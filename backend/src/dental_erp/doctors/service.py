from sqlalchemy.orm import Session

from dental_erp.doctors.models import Doctor
from dental_erp.doctors.schemas import DoctorCreate, DoctorUpdate


def create_doctor(db: Session, data: DoctorCreate) -> Doctor:
    doctor = Doctor(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def get_doctor(db: Session, doctor_id: int) -> Doctor | None:
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()


def list_doctors(db: Session) -> list[Doctor]:
    return db.query(Doctor).all()


def update_doctor(db: Session, doctor: Doctor, data: DoctorUpdate) -> Doctor:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


def delete_doctor(db: Session, doctor: Doctor) -> None:
    db.delete(doctor)
    db.commit()
