from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING, List

from sqlalchemy import Column, ForeignKey, Numeric, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from dental_erp.core.database import Base

if TYPE_CHECKING:
    from dental_erp.doctors.models import Doctor
    from dental_erp.services.models import Service
    from dental_erp.workers.models import Worker


class VisitStatus(StrEnum):
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"


visit_doctors = Table(
    "visit_doctors",
    Base.metadata,
    Column("visit_id", ForeignKey("visits.id"), primary_key=True),
    Column("doctor_id", ForeignKey("doctors.id"), primary_key=True),
)

visit_workers = Table(
    "visit_workers",
    Base.metadata,
    Column("visit_id", ForeignKey("visits.id"), primary_key=True),
    Column("worker_id", ForeignKey("workers.id"), primary_key=True),
)

visit_services = Table(
    "visit_services",
    Base.metadata,
    Column("visit_id", ForeignKey("visits.id"), primary_key=True),
    Column("service_id", ForeignKey("services.id"), primary_key=True),
)


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    date: Mapped[datetime]
    comments: Mapped[str | None]
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2, asdecimal=True), default=0)
    status: Mapped[str] = mapped_column(default=VisitStatus.scheduled)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    doctors: Mapped[List["Doctor"]] = relationship("Doctor", secondary=visit_doctors)
    workers: Mapped[List["Worker"]] = relationship("Worker", secondary=visit_workers)
    services: Mapped[List["Service"]] = relationship("Service", secondary=visit_services)
