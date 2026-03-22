from datetime import datetime
from dental_erp.core.schemas import PersonBase


class WorkerCreate(PersonBase):
    pass


class WorkerRead(PersonBase):
    id: int
    created_at: datetime
    prices_count: int = 0

    model_config = {"from_attributes": True}


class WorkerUpdate(PersonBase):
    name: str | None = None
    surname: str | None = None
