from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from dental_erp.doctors.schemas import DoctorRead
from dental_erp.services.schemas import ServiceRead
from dental_erp.visits.models import VisitStatus
from dental_erp.workers.schemas import WorkerRead


class VisitServiceItemInput(BaseModel):
    service_id: int
    quantity: int = Field(default=1, ge=1)


class VisitServiceItemRead(BaseModel):
    service_id: int
    quantity: int
    service: ServiceRead

    model_config = {"from_attributes": True}


class VisitCreate(BaseModel):
    client_id: int
    date: datetime
    doctor_ids: list[int] = []
    worker_ids: list[int] = []
    service_items: list[VisitServiceItemInput] = []
    comments: str | None = None
    status: VisitStatus = VisitStatus.scheduled


class VisitUpdate(BaseModel):
    date: datetime | None = None
    doctor_ids: list[int] | None = None
    worker_ids: list[int] | None = None
    service_items: list[VisitServiceItemInput] | None = None
    comments: str | None = None
    status: VisitStatus | None = None


class VisitRead(BaseModel):
    id: int
    client_id: int
    date: datetime
    comments: str | None
    price: Decimal
    status: str
    created_at: datetime
    doctors: list[DoctorRead]
    workers: list[WorkerRead]
    service_items: list[VisitServiceItemRead]

    model_config = {"from_attributes": True}
