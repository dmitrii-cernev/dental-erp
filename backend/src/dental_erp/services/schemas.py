from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class ServiceCreate(BaseModel):
    name: str
    price: Decimal = Decimal("0.00")
    steps: list[str] = []


class ServiceUpdate(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    steps: list[str] | None = None


class ServiceRead(BaseModel):
    id: int
    name: str
    price: Decimal
    steps: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
