from sqlalchemy.orm import Session

from dental_erp.workers.models import Worker
from dental_erp.workers.schemas import WorkerCreate, WorkerUpdate


def create_worker(db: Session, data: WorkerCreate) -> Worker:
    worker = Worker(**data.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


def get_worker(db: Session, worker_id: int) -> Worker | None:
    return db.query(Worker).filter(Worker.id == worker_id).first()


def list_workers(db: Session) -> list[Worker]:
    return db.query(Worker).all()


def update_worker(db: Session, worker: Worker, data: WorkerUpdate) -> Worker:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(worker, field, value)
    db.commit()
    db.refresh(worker)
    return worker


def delete_worker(db: Session, worker: Worker) -> None:
    db.delete(worker)
    db.commit()
