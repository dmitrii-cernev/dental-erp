from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from dental_erp.doctors.schemas import DoctorRead
from dental_erp.visits.models import VisitStatus
from dental_erp.workers.schemas import WorkerRead


class VisitCreate(BaseModel):
    client_id: int
    date: datetime
    doctor_ids: list[int] = []
    worker_ids: list[int] = []
    services_provided: str | None = None
    comments: str | None = None
    price: Decimal = Decimal("0")
    status: VisitStatus = VisitStatus.scheduled


class VisitUpdate(BaseModel):
    date: datetime | None = None
    doctor_ids: list[int] | None = None
    worker_ids: list[int] | None = None
    services_provided: str | None = None
    comments: str | None = None
    price: Decimal | None = None
    status: VisitStatus | None = None


class VisitRead(BaseModel):
    id: int
    client_id: int
    date: datetime
    services_provided: str | None
    comments: str | None
    price: Decimal
    status: str
    created_at: datetime
    doctors: list[DoctorRead]
    workers: list[WorkerRead]

    model_config = {"from_attributes": True}
