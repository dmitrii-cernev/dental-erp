from datetime import datetime
from decimal import Decimal
from typing import List

from sqlalchemy import JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from dental_erp.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2, asdecimal=True), default=0)
    steps: Mapped[List[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
