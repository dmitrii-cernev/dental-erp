import pytest
from decimal import Decimal


@pytest.fixture
def seeded_client_obj(db_session):
    from dental_erp.clients.models import Client

    c = Client(name="Jan", surname="Kowalski")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def seeded_doctor_obj(db_session):
    from dental_erp.doctors.models import Doctor

    d = Doctor(name="Adam", surname="Nowak")
    db_session.add(d)
    db_session.commit()
    db_session.refresh(d)
    return d


@pytest.fixture
def seeded_service_obj(db_session):
    from dental_erp.services.models import Service

    s = Service(name="Cleaning", price=Decimal("75.00"), steps=["Scale", "Polish"])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def seeded_service_obj2(db_session):
    from dental_erp.services.models import Service

    s = Service(name="Filling", price=Decimal("120.00"), steps=["Drill", "Fill"])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def seeded_visits(db_session, seeded_client_obj, seeded_doctor_obj):
    from datetime import datetime
    from dental_erp.visits.models import Visit

    visits = [
        Visit(client_id=seeded_client_obj.id, date=datetime(2026, 4, 10, 10, 0), price=100),
        Visit(client_id=seeded_client_obj.id, date=datetime(2026, 4, 20, 10, 0), price=200),
        Visit(client_id=seeded_client_obj.id, date=datetime(2026, 5, 5, 10, 0), price=150),
    ]
    for v in visits:
        db_session.add(v)
    db_session.commit()
    for v in visits:
        db_session.refresh(v)
    return visits


def test_create_visit(client, auth_headers, seeded_client_obj, seeded_doctor_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "doctor_ids": [seeded_doctor_obj.id],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["client_id"] == seeded_client_obj.id


def test_create_visit_invalid_client_returns_404(client, auth_headers, seeded_doctor_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": 99999,
            "doctor_ids": [seeded_doctor_obj.id],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_create_visit_with_service_items(client, auth_headers, seeded_client_obj, seeded_service_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [{"service_id": seeded_service_obj.id, "quantity": 1}],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert Decimal(data["price"]) == Decimal("75.00")
    assert data["service_items"][0]["service_id"] == seeded_service_obj.id
    assert data["service_items"][0]["quantity"] == 1


def test_create_visit_quantity_multiplies_price(
    client, auth_headers, seeded_client_obj, seeded_service_obj
):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [{"service_id": seeded_service_obj.id, "quantity": 3}],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert Decimal(r.json()["price"]) == Decimal("225.00")  # 3 * 75.00


def test_create_visit_multiple_service_types(
    client, auth_headers, seeded_client_obj, seeded_service_obj, seeded_service_obj2
):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [
                {"service_id": seeded_service_obj.id, "quantity": 2},   # 2 * 75 = 150
                {"service_id": seeded_service_obj2.id, "quantity": 1},  # 1 * 120 = 120
            ],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert Decimal(r.json()["price"]) == Decimal("270.00")


def test_create_visit_no_services_price_is_zero(client, auth_headers, seeded_client_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert Decimal(r.json()["price"]) == Decimal("0")


def test_create_visit_unknown_service_returns_422(client, auth_headers, seeded_client_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [{"service_id": 99999, "quantity": 1}],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 422


def test_create_visit_duplicate_service_returns_422(
    client, auth_headers, seeded_client_obj, seeded_service_obj
):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [
                {"service_id": seeded_service_obj.id, "quantity": 1},
                {"service_id": seeded_service_obj.id, "quantity": 2},
            ],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 422


def test_update_visit_recalculates_price(client, auth_headers, seeded_visits, seeded_service_obj):
    visit_id = seeded_visits[0].id
    r = client.patch(
        f"/visits/{visit_id}",
        json={"service_items": [{"service_id": seeded_service_obj.id, "quantity": 1}]},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert Decimal(r.json()["price"]) == Decimal("75.00")


def test_update_visit_quantity_recalculates_price(
    client, auth_headers, seeded_visits, seeded_service_obj
):
    visit_id = seeded_visits[0].id
    r = client.patch(
        f"/visits/{visit_id}",
        json={"service_items": [{"service_id": seeded_service_obj.id, "quantity": 4}]},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert Decimal(r.json()["price"]) == Decimal("300.00")  # 4 * 75.00


def test_filter_by_date_range(client, auth_headers, seeded_visits):
    r = client.get(
        "/visits",
        params={"date_from": "2026-04-01", "date_to": "2026-04-30"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    results = r.json()
    assert len(results) == 2
    for v in results:
        assert v["date"].startswith("2026-04")


def test_filter_by_status(client, auth_headers, seeded_visits):
    r = client.get("/visits", params={"status": "scheduled"}, headers=auth_headers)
    assert r.status_code == 200
    for v in r.json():
        assert v["status"] == "scheduled"


def test_get_visit_not_found(client, auth_headers):
    r = client.get("/visits/99999", headers=auth_headers)
    assert r.status_code == 404


def test_update_visit_status(client, auth_headers, seeded_visits):
    visit_id = seeded_visits[0].id
    r = client.patch(
        f"/visits/{visit_id}",
        json={"status": "completed"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "completed"


def test_delete_visit(client, auth_headers, seeded_visits):
    visit_id = seeded_visits[0].id
    r = client.delete(f"/visits/{visit_id}", headers=auth_headers)
    assert r.status_code == 204
