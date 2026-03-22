from fastapi import HTTPException
from sqlalchemy.orm import Session

from dental_erp.services.models import Service
from dental_erp.worker_price_list.models import WorkerPriceList
from dental_erp.worker_price_list.schemas import WorkerPriceUpsert


def list_prices(db: Session, worker_id: int) -> list[WorkerPriceList]:
    return (
        db.query(WorkerPriceList)
        .filter(WorkerPriceList.worker_id == worker_id)
        .all()
    )


def upsert_price(
    db: Session, worker_id: int, service_id: int, data: WorkerPriceUpsert
) -> WorkerPriceList:
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if data.price >= service.price:
        raise HTTPException(
            status_code=422,
            detail="Worker price must be strictly less than service price",
        )
    entry = db.query(WorkerPriceList).filter(
        WorkerPriceList.worker_id == worker_id,
        WorkerPriceList.service_id == service_id,
    ).first()
    if entry:
        entry.price = data.price
    else:
        entry = WorkerPriceList(worker_id=worker_id, service_id=service_id, price=data.price)
        db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def delete_price(db: Session, worker_id: int, service_id: int) -> None:
    entry = db.query(WorkerPriceList).filter(
        WorkerPriceList.worker_id == worker_id,
        WorkerPriceList.service_id == service_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Price entry not found")
    db.delete(entry)
    db.commit()
