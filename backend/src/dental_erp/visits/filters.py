from datetime import date

from pydantic import BaseModel

from dental_erp.visits.models import VisitStatus


class VisitFilter(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    client_id: int | None = None
    doctor_id: int | None = None
    status: VisitStatus | None = None
