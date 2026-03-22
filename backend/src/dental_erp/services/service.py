from sqlalchemy.orm import Session

from dental_erp.services.models import Service
from dental_erp.services.schemas import ServiceCreate, ServiceUpdate


def create_service(db: Session, data: ServiceCreate) -> Service:
    service = Service(name=data.name, price=data.price, steps=data.steps)
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def get_service(db: Session, service_id: int) -> Service | None:
    return db.query(Service).filter(Service.id == service_id).first()


def list_services(db: Session) -> list[Service]:
    return db.query(Service).order_by(Service.name).all()


def update_service(db: Session, service: Service, data: ServiceUpdate) -> Service:
    if data.name is not None:
        service.name = data.name
    if data.price is not None:
        service.price = data.price
    if data.steps is not None:
        service.steps = data.steps
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, service: Service) -> None:
    db.delete(service)
    db.commit()
