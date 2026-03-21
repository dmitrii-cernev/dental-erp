from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.doctors import service
from dental_erp.doctors.schemas import DoctorCreate, DoctorRead, DoctorUpdate

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.post("", response_model=DoctorRead, status_code=status.HTTP_201_CREATED)
def create_doctor(
    data: DoctorCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return service.create_doctor(db, data)


@router.get("", response_model=list[DoctorRead])
def list_doctors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return service.list_doctors(db)


@router.get("/{doctor_id}", response_model=DoctorRead)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    doctor = service.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


@router.patch("/{doctor_id}", response_model=DoctorRead)
def update_doctor(
    doctor_id: int,
    data: DoctorUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    doctor = service.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return service.update_doctor(db, doctor, data)


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    doctor = service.get_doctor(db, doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    service.delete_doctor(db, doctor)
