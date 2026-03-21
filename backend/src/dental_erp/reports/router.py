from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.reports.schemas import ReportRequest
from dental_erp.reports.service import generate_report

router = APIRouter(prefix="/report", tags=["reports"])


@router.post("")
def create_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    pdf_bytes = generate_report(db, request)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=report.pdf"},
    )
