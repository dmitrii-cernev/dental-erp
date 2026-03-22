from decimal import Decimal

from pydantic import BaseModel


class WorkerPriceUpsert(BaseModel):
    price: Decimal


class WorkerPriceRead(BaseModel):
    worker_id: int
    service_id: int
    service_name: str
    service_price: Decimal
    price: Decimal

    model_config = {"from_attributes": True}
