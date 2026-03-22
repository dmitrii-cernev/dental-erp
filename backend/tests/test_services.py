import pytest
from decimal import Decimal


@pytest.fixture
def seeded_service(db_session):
    from dental_erp.services.models import Service

    s = Service(name="Cleaning", price=Decimal("75.00"), steps=["Scale", "Polish"])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


def test_create_service(client, auth_headers):
    r = client.post(
        "/services",
        json={"name": "Whitening", "price": "120.00", "steps": ["Apply gel", "UV light"]},
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Whitening"
    assert Decimal(data["price"]) == Decimal("120.00")
    assert data["steps"] == ["Apply gel", "UV light"]
    assert "id" in data


def test_list_services(client, auth_headers, seeded_service):
    r = client.get("/services", headers=auth_headers)
    assert r.status_code == 200
    names = [s["name"] for s in r.json()]
    assert "Cleaning" in names


def test_get_service(client, auth_headers, seeded_service):
    r = client.get(f"/services/{seeded_service.id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Cleaning"


def test_get_service_not_found(client, auth_headers):
    r = client.get("/services/99999", headers=auth_headers)
    assert r.status_code == 404


def test_update_service_price(client, auth_headers, seeded_service):
    r = client.patch(
        f"/services/{seeded_service.id}",
        json={"price": "90.00"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert Decimal(r.json()["price"]) == Decimal("90.00")
    assert r.json()["name"] == "Cleaning"


def test_delete_service(client, auth_headers, seeded_service):
    r = client.delete(f"/services/{seeded_service.id}", headers=auth_headers)
    assert r.status_code == 204
    r2 = client.get(f"/services/{seeded_service.id}", headers=auth_headers)
    assert r2.status_code == 404


def test_create_service_missing_name_returns_422(client, auth_headers):
    r = client.post("/services", json={"price": "50.00"}, headers=auth_headers)
    assert r.status_code == 422
