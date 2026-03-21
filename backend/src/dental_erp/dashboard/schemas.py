from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_visits_today: int
    total_visits_this_month: int
    revenue_today: Decimal
    revenue_this_month: Decimal
    total_clients: int
    visits_by_status: dict[str, int]
