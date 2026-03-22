from sqlalchemy.orm import Session

from dental_erp.reports.pdf_builder import build_pdf
from dental_erp.reports.schemas import ReportRequest
from dental_erp.visits.filters import VisitFilter
from dental_erp.visits.service import list_visits


def generate_report(db: Session, request: ReportRequest) -> bytes:
    filters = VisitFilter(
        date_from=request.date_from,
        date_to=request.date_to,
        client_id=request.client_id,
        doctor_id=request.doctor_id,
    )
    visits = list_visits(db, filters)

    visits_data = []
    for v in visits:
        client_name = f"Client #{v.client_id}"
        doctors = [f"{d.name} {d.surname}" for d in v.doctors]
        visits_data.append({
            "date": v.date.isoformat() if v.date else "",
            "client": client_name,
            "doctors": doctors,
            "services_provided": ", ".join(s.name for s in v.services),
            "status": v.status,
            "price": v.price,
        })

    date_range = ""
    if request.date_from:
        date_range += f"From {request.date_from}"
    if request.date_to:
        date_range += f" To {request.date_to}"
    title = f"Visits Report{' — ' + date_range if date_range else ''}"

    return build_pdf(visits_data, title)
