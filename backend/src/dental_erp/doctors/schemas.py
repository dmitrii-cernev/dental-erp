from datetime import datetime
from dental_erp.core.schemas import PersonBase


class DoctorBase(PersonBase):
    company: str | None = None


class DoctorCreate(DoctorBase):
    pass


class DoctorRead(DoctorBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DoctorUpdate(DoctorBase):
    name: str | None = None
    surname: str | None = None
