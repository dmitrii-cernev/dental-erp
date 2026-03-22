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
