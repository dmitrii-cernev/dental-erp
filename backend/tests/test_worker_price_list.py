import pytest
from decimal import Decimal


@pytest.fixture
def seeded_worker(db_session):
    from dental_erp.workers.models import Worker
    w = Worker(name="Jane", surname="Doe")
    db_session.add(w)
    db_session.commit()
    db_session.refresh(w)
    return w


@pytest.fixture
def seeded_service(db_session):
    from dental_erp.services.models import Service
    s = Service(name="Cleaning", price=Decimal("100.00"), steps=[])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


def test_upsert_price_creates_entry(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert

    entry = svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("60.00")))
    assert entry.price == Decimal("60.00")
    assert entry.worker_id == seeded_worker.id
    assert entry.service_id == seeded_service.id


def test_upsert_price_rejects_price_gte_service_price(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("100.00")))
    assert exc.value.status_code == 422


def test_list_prices(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert

    svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("50.00")))
    entries = svc.list_prices(db_session, seeded_worker.id)
    assert len(entries) == 1
    assert entries[0].price == Decimal("50.00")


def test_delete_price(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert

    svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("40.00")))
    svc.delete_price(db_session, seeded_worker.id, seeded_service.id)
    entries = svc.list_prices(db_session, seeded_worker.id)
    assert entries == []


@pytest.fixture
def seeded_worker_api(db_session):
    from dental_erp.workers.models import Worker
    w = Worker(name="Alice", surname="Smith")
    db_session.add(w)
    db_session.commit()
    db_session.refresh(w)
    return w


@pytest.fixture
def seeded_service_api(db_session):
    from dental_erp.services.models import Service
    s = Service(name="X-Ray", price=Decimal("200.00"), steps=[])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


def test_api_upsert_price(client, auth_headers, seeded_worker_api, seeded_service_api):
    r = client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "80.00"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["price"] == "80.00"
    assert data["service_name"] == "X-Ray"
    assert data["service_price"] == "200.00"


def test_api_upsert_price_rejects_high_price(client, auth_headers, seeded_worker_api, seeded_service_api):
    r = client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "200.00"},
        headers=auth_headers,
    )
    assert r.status_code == 422


def test_api_list_prices(client, auth_headers, seeded_worker_api, seeded_service_api):
    client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "90.00"},
        headers=auth_headers,
    )
    r = client.get(f"/workers/{seeded_worker_api.id}/prices", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_api_delete_price(client, auth_headers, seeded_worker_api, seeded_service_api):
    client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "70.00"},
        headers=auth_headers,
    )
    r = client.delete(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        headers=auth_headers,
    )
    assert r.status_code == 204


def test_api_worker_not_found(client, auth_headers):
    r = client.get("/workers/99999/prices", headers=auth_headers)
    assert r.status_code == 404
