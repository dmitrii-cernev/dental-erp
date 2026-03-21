from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.visits import service
from dental_erp.visits.filters import VisitFilter
from dental_erp.visits.models import VisitStatus
from dental_erp.visits.schemas import VisitCreate, VisitRead, VisitUpdate

router = APIRouter(prefix="/visits", tags=["visits"])


@router.post("", response_model=VisitRead, status_code=status.HTTP_201_CREATED)
def create_visit(
    data: VisitCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    visit = service.create_visit(db, data)
    if visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return visit


@router.get("", response_model=list[VisitRead])
def list_visits(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    client_id: int | None = Query(None),
    doctor_id: int | None = Query(None),
    visit_status: VisitStatus | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    from datetime import date

    filters = VisitFilter(
        date_from=date.fromisoformat(date_from) if date_from else None,
        date_to=date.fromisoformat(date_to) if date_to else None,
        client_id=client_id,
        doctor_id=doctor_id,
        status=visit_status,
    )
    return service.list_visits(db, filters)


@router.get("/{visit_id}", response_model=VisitRead)
def get_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    visit = service.get_visit(db, visit_id)
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    return visit


@router.patch("/{visit_id}", response_model=VisitRead)
def update_visit(
    visit_id: int,
    data: VisitUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    visit = service.get_visit(db, visit_id)
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    return service.update_visit(db, visit, data)


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visit(
    visit_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    visit = service.get_visit(db, visit_id)
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    service.delete_visit(db, visit)
