from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from dental_erp.clients.models import Client
from dental_erp.dashboard.schemas import DashboardStats
from dental_erp.visits.models import Visit, VisitStatus


def get_dashboard_stats(db: Session) -> DashboardStats:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_visits_today = (
        db.query(func.count(Visit.id))
        .filter(Visit.date >= today_start, Visit.date <= today_end)
        .scalar() or 0
    )

    total_visits_this_month = (
        db.query(func.count(Visit.id))
        .filter(Visit.date >= month_start)
        .scalar() or 0
    )

    revenue_today = (
        db.query(func.sum(Visit.price))
        .filter(Visit.date >= today_start, Visit.date <= today_end)
        .scalar()
    ) or Decimal("0")

    revenue_this_month = (
        db.query(func.sum(Visit.price))
        .filter(Visit.date >= month_start)
        .scalar()
    ) or Decimal("0")

    total_clients = db.query(func.count(Client.id)).scalar() or 0

    status_counts = (
        db.query(Visit.status, func.count(Visit.id))
        .group_by(Visit.status)
        .all()
    )
    visits_by_status = {s: c for s, c in status_counts}
    # Ensure all statuses present
    for status in VisitStatus:
        visits_by_status.setdefault(status.value, 0)

    return DashboardStats(
        total_visits_today=total_visits_today,
        total_visits_this_month=total_visits_this_month,
        revenue_today=Decimal(str(revenue_today)),
        revenue_this_month=Decimal(str(revenue_this_month)),
        total_clients=total_clients,
        visits_by_status=visits_by_status,
    )
