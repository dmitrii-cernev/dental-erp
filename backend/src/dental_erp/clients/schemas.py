from datetime import datetime
from dental_erp.core.schemas import PersonBase


class ClientCreate(PersonBase):
    pass


class ClientRead(PersonBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientUpdate(PersonBase):
    name: str | None = None
    surname: str | None = None
