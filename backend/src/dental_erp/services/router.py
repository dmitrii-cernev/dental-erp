from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.services.schemas import ServiceCreate, ServiceRead, ServiceUpdate
from dental_erp.services import service as svc

router = APIRouter(prefix="/services", tags=["services"])


@router.post("", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return svc.create_service(db, data)


@router.get("", response_model=list[ServiceRead])
def list_services(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return svc.list_services(db)


@router.get("/{service_id}", response_model=ServiceRead)
def get_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    service = svc.get_service(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service


@router.patch("/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    service = svc.get_service(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return svc.update_service(db, service, data)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    service = svc.get_service(db, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.delete_service(db, service)
