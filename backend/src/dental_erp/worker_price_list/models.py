from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from dental_erp.core.database import Base


class WorkerPriceList(Base):
    __tablename__ = "worker_price_list"

    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id"), primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), primary_key=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2, asdecimal=True))
