from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from dental_erp.clients.models import Client
from dental_erp.doctors.models import Doctor
from dental_erp.services.models import Service
from dental_erp.visits.filters import VisitFilter
from dental_erp.visits.models import Visit, VisitServiceItem, visit_doctors
from dental_erp.visits.schemas import VisitCreate, VisitUpdate
from dental_erp.workers.models import Worker


def _build_service_items(db: Session, inputs) -> tuple[list[VisitServiceItem], Decimal]:
    """Return (VisitServiceItem list, computed price) for a list of VisitServiceItemInput."""
    if not inputs:
        return [], Decimal("0")

    service_map = {
        s.id: s
        for s in db.query(Service).filter(Service.id.in_([i.service_id for i in inputs])).all()
    }
    items = []
    price = Decimal("0")
    for inp in inputs:
        svc = service_map.get(inp.service_id)
        if svc is None:
            continue
        items.append(VisitServiceItem(service_id=inp.service_id, quantity=inp.quantity))
        price += svc.price * inp.quantity
    return items, price


def create_visit(db: Session, data: VisitCreate) -> Visit:
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        return None

    items, computed_price = _build_service_items(db, data.service_items)

    visit = Visit(
        client_id=data.client_id,
        date=data.date,
        comments=data.comments,
        price=computed_price,
        status=data.status,
    )
    visit.service_items = items

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
    if data.comments is not None:
        visit.comments = data.comments
    if data.status is not None:
        visit.status = data.status
    if data.service_items is not None:
        items, price = _build_service_items(db, data.service_items)
        visit.service_items = items  # cascade delete-orphan removes old items
        visit.price = price
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
