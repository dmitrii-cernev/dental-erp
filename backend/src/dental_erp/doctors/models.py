from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from dental_erp.core.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    surname: Mapped[str]
    phone: Mapped[str | None]
    email: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
