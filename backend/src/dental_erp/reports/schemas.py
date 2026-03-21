from datetime import date

from pydantic import BaseModel


class ReportRequest(BaseModel):
    date_from: date | None = None
    date_to: date | None = None
    client_id: int | None = None
    doctor_id: int | None = None
