from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.services.models import Service
from dental_erp.worker_price_list import service as svc
from dental_erp.worker_price_list.schemas import WorkerPriceRead, WorkerPriceUpsert
from dental_erp.workers import service as worker_svc

router = APIRouter(prefix="/workers/{worker_id}/prices", tags=["worker-prices"])


def _resolve_worker(worker_id: int, db: Session):
    worker = worker_svc.get_worker(db, worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


def _to_read(entry, db: Session) -> WorkerPriceRead:
    service = db.query(Service).filter(Service.id == entry.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Associated service not found")
    return WorkerPriceRead(
        worker_id=entry.worker_id,
        service_id=entry.service_id,
        service_name=service.name,
        service_price=service.price,
        price=entry.price,
    )


@router.get("", response_model=list[WorkerPriceRead])
def list_prices(
    worker_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    _resolve_worker(worker_id, db)
    entries = svc.list_prices(db, worker_id)
    return [_to_read(e, db) for e in entries]


@router.put("/{service_id}", response_model=WorkerPriceRead)
def upsert_price(
    worker_id: int,
    service_id: int,
    data: WorkerPriceUpsert,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    _resolve_worker(worker_id, db)
    entry = svc.upsert_price(db, worker_id, service_id, data)
    return _to_read(entry, db)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price(
    worker_id: int,
    service_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    _resolve_worker(worker_id, db)
    svc.delete_price(db, worker_id, service_id)
