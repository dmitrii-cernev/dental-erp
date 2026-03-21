from datetime import datetime
from dental_erp.core.schemas import PersonBase


class DoctorCreate(PersonBase):
    pass


class DoctorRead(PersonBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DoctorUpdate(PersonBase):
    name: str | None = None
    surname: str | None = None
