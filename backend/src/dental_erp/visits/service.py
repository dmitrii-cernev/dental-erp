from datetime import datetime

from sqlalchemy.orm import Session

from dental_erp.clients.models import Client
from dental_erp.doctors.models import Doctor
from dental_erp.visits.filters import VisitFilter
from dental_erp.visits.models import Visit, visit_doctors
from dental_erp.visits.schemas import VisitCreate, VisitUpdate
from dental_erp.workers.models import Worker


def create_visit(db: Session, data: VisitCreate) -> Visit:
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        return None

    visit = Visit(
        client_id=data.client_id,
        date=data.date,
        services_provided=data.services_provided,
        comments=data.comments,
        price=data.price,
        status=data.status,
    )

    if data.doctor_ids:
        visit.doctors = db.query(Doctor).filter(Doctor.id.in_(data.doctor_ids)).all()
    if data.worker_ids:
        visit.workers = db.query(Worker).filter(Worker.id.in_(data.worker_ids)).all()

    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


def get_visit(db: Session, visit_id: int) -> Visit | None:
    return db.query(Visit).filter(Visit.id == visit_id).first()


def list_visits(db: Session, filters: VisitFilter) -> list[Visit]:
    query = db.query(Visit)

    if filters.date_from:
        query = query.filter(Visit.date >= datetime.combine(filters.date_from, datetime.min.time()))
    if filters.date_to:
        query = query.filter(Visit.date <= datetime.combine(filters.date_to, datetime.max.time()))
    if filters.client_id:
        query = query.filter(Visit.client_id == filters.client_id)
    if filters.status:
        query = query.filter(Visit.status == filters.status)
    if filters.doctor_id:
        query = query.join(visit_doctors).filter(visit_doctors.c.doctor_id == filters.doctor_id)

    return query.all()


def update_visit(db: Session, visit: Visit, data: VisitUpdate) -> Visit:
    if data.date is not None:
        visit.date = data.date
    if data.services_provided is not None:
        visit.services_provided = data.services_provided
    if data.comments is not None:
        visit.comments = data.comments
    if data.price is not None:
        visit.price = data.price
    if data.status is not None:
        visit.status = data.status
    if data.doctor_ids is not None:
        visit.doctors = db.query(Doctor).filter(Doctor.id.in_(data.doctor_ids)).all()
    if data.worker_ids is not None:
        visit.workers = db.query(Worker).filter(Worker.id.in_(data.worker_ids)).all()

    db.commit()
    db.refresh(visit)
    return visit


def delete_visit(db: Session, visit: Visit) -> None:
    db.delete(visit)
    db.commit()
