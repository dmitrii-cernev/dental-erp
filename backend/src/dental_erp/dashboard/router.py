from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.dashboard.schemas import DashboardStats
from dental_erp.dashboard.service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return get_dashboard_stats(db)
