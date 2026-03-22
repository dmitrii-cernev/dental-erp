from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.worker_price_list.models import WorkerPriceList
from dental_erp.workers import service
from dental_erp.workers.schemas import WorkerCreate, WorkerRead, WorkerUpdate

router = APIRouter(prefix="/workers", tags=["workers"])


@router.post("", response_model=WorkerRead, status_code=status.HTTP_201_CREATED)
def create_worker(
    data: WorkerCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return service.create_worker(db, data)


@router.get("", response_model=list[WorkerRead])
def list_workers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    workers = service.list_workers(db)
    counts = dict(
        db.query(WorkerPriceList.worker_id, func.count(WorkerPriceList.service_id))
        .group_by(WorkerPriceList.worker_id)
        .all()
    )
    return [
        WorkerRead(
            id=w.id,
            name=w.name,
            surname=w.surname,
            phone=w.phone,
            email=w.email,
            created_at=w.created_at,
            prices_count=counts.get(w.id, 0),
        )
        for w in workers
    ]


@router.get("/{worker_id}", response_model=WorkerRead)
def get_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    worker = service.get_worker(db, worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return worker


@router.patch("/{worker_id}", response_model=WorkerRead)
def update_worker(
    worker_id: int,
    data: WorkerUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    worker = service.get_worker(db, worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return service.update_worker(db, worker, data)


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    worker = service.get_worker(db, worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    service.delete_worker(db, worker)
