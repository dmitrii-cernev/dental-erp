# Visit Service Quantity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `visit_services` many-to-many table with a `VisitServiceItem` ORM model that carries a `quantity` field, and update all API schemas, service logic, and tests accordingly.

**Architecture:** Drop the bare SQLAlchemy `Table` (`visit_services`) and introduce a proper `VisitServiceItem` model with `(visit_id, service_id, quantity)`. `Visit` gets a `service_items` relationship with cascade delete. Price is always computed on write as `sum(item.quantity * service.price)`. The API input shape changes from `service_ids: list[int]` to `service_items: list[{service_id, quantity}]`.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2 (mapped columns), Pydantic v2, Alembic, pytest, SQLite (tests), PostgreSQL (prod).

---

### Task 1: Replace `visit_services` table with `VisitServiceItem` model

**Files:**
- Modify: `backend/src/dental_erp/visits/models.py`

**Step 1: Open the file and read it**

File: `backend/src/dental_erp/visits/models.py`

**Step 2: Replace `visit_services` table and `services` relationship**

Remove:
```python
visit_services = Table(
    "visit_services",
    Base.metadata,
    Column("visit_id", ForeignKey("visits.id"), primary_key=True),
    Column("service_id", ForeignKey("services.id"), primary_key=True),
)
```

Add after the `visit_workers` table definition:
```python
class VisitServiceItem(Base):
    __tablename__ = "visit_service_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    quantity: Mapped[int] = mapped_column(default=1)
```

On `Visit`, replace:
```python
services: Mapped[List["Service"]] = relationship("Service", secondary=visit_services)
```
with:
```python
service_items: Mapped[List["VisitServiceItem"]] = relationship(
    "VisitServiceItem", cascade="all, delete-orphan"
)
```

Also remove `"Service"` from the `TYPE_CHECKING` imports block since `Visit` no longer holds a direct `Service` relationship (the `VisitServiceItem` model doesn't need it in TYPE_CHECKING — SQLAlchemy resolves it by string).

Final `models.py` should look like:

```python
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


class VisitServiceItem(Base):
    __tablename__ = "visit_service_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    quantity: Mapped[int] = mapped_column(default=1)


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
    service_items: Mapped[List["VisitServiceItem"]] = relationship(
        "VisitServiceItem", cascade="all, delete-orphan"
    )
```

**Step 3: Commit**

```bash
git add backend/src/dental_erp/visits/models.py
git commit -m "refactor: replace visit_services table with VisitServiceItem model"
```

---

### Task 2: Update schemas

**Files:**
- Modify: `backend/src/dental_erp/visits/schemas.py`

**Step 1: Read the current file**

File: `backend/src/dental_erp/visits/schemas.py`

**Step 2: Write the new schemas**

Replace the entire file with:

```python
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from dental_erp.doctors.schemas import DoctorRead
from dental_erp.services.schemas import ServiceRead
from dental_erp.visits.models import VisitStatus
from dental_erp.workers.schemas import WorkerRead


class VisitServiceItemInput(BaseModel):
    service_id: int
    quantity: int = Field(default=1, ge=1)


class VisitServiceItemRead(BaseModel):
    service_id: int
    quantity: int
    service: ServiceRead

    model_config = {"from_attributes": True}


class VisitCreate(BaseModel):
    client_id: int
    date: datetime
    doctor_ids: list[int] = []
    worker_ids: list[int] = []
    service_items: list[VisitServiceItemInput] = []
    comments: str | None = None
    status: VisitStatus = VisitStatus.scheduled


class VisitUpdate(BaseModel):
    date: datetime | None = None
    doctor_ids: list[int] | None = None
    worker_ids: list[int] | None = None
    service_items: list[VisitServiceItemInput] | None = None
    comments: str | None = None
    status: VisitStatus | None = None


class VisitRead(BaseModel):
    id: int
    client_id: int
    date: datetime
    comments: str | None
    price: Decimal
    status: str
    created_at: datetime
    doctors: list[DoctorRead]
    workers: list[WorkerRead]
    service_items: list[VisitServiceItemRead]

    model_config = {"from_attributes": True}
```

**Step 3: Commit**

```bash
git add backend/src/dental_erp/visits/schemas.py
git commit -m "refactor: update visit schemas to use service_items with quantity"
```

---

### Task 3: Update service layer

**Files:**
- Modify: `backend/src/dental_erp/visits/service.py`

**Step 1: Read the current file**

File: `backend/src/dental_erp/visits/service.py`

**Step 2: Write the new service.py**

Replace the entire file with:

```python
from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from dental_erp.clients.models import Client
from dental_erp.doctors.models import Doctor
from dental_erp.services.models import Service
from dental_erp.visits.filters import VisitFilter
from dental_erp.visits.models import Visit, VisitServiceItem, visit_doctors
from dental_erp.visits.schemas import VisitCreate, VisitUpdate
from dental_erp.workers.models import Worker


def _build_service_items(db: Session, inputs) -> tuple[list[VisitServiceItem], Decimal]:
    """Return (VisitServiceItem list, computed price) for a list of VisitServiceItemInput."""
    if not inputs:
        return [], Decimal("0")

    service_map = {
        s.id: s
        for s in db.query(Service).filter(Service.id.in_([i.service_id for i in inputs])).all()
    }
    items = []
    price = Decimal("0")
    for inp in inputs:
        svc = service_map.get(inp.service_id)
        if svc is None:
            continue
        items.append(VisitServiceItem(service_id=inp.service_id, quantity=inp.quantity))
        price += svc.price * inp.quantity
    return items, price


def create_visit(db: Session, data: VisitCreate) -> Visit:
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        return None

    items, computed_price = _build_service_items(db, data.service_items)

    visit = Visit(
        client_id=data.client_id,
        date=data.date,
        comments=data.comments,
        price=computed_price,
        status=data.status,
    )
    visit.service_items = items

    if data.doctor_ids:
        visit.doctors = db.query(Doctor).filter(Doctor.id.in_(data.doctor_ids)).all()
    if data.worker_ids:
        visit.workers = db.query(Worker).filter(Worker.id.in_(data.worker_ids)).all()

    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


def get_visit(db: Session, visit_id: int) -> Visit | None:
    return db.query(Visit).filter(Visit.id == visit_id).first()


def list_visits(db: Session, filters: VisitFilter) -> list[Visit]:
    query = db.query(Visit)

    if filters.date_from:
        query = query.filter(Visit.date >= datetime.combine(filters.date_from, datetime.min.time()))
    if filters.date_to:
        query = query.filter(Visit.date <= datetime.combine(filters.date_to, datetime.max.time()))
    if filters.client_id:
        query = query.filter(Visit.client_id == filters.client_id)
    if filters.status:
        query = query.filter(Visit.status == filters.status)
    if filters.doctor_id:
        query = query.join(visit_doctors).filter(visit_doctors.c.doctor_id == filters.doctor_id)

    return query.all()


def update_visit(db: Session, visit: Visit, data: VisitUpdate) -> Visit:
    if data.date is not None:
        visit.date = data.date
    if data.comments is not None:
        visit.comments = data.comments
    if data.status is not None:
        visit.status = data.status
    if data.service_items is not None:
        items, price = _build_service_items(db, data.service_items)
        visit.service_items = items  # cascade delete-orphan removes old items
        visit.price = price
    if data.doctor_ids is not None:
        visit.doctors = db.query(Doctor).filter(Doctor.id.in_(data.doctor_ids)).all()
    if data.worker_ids is not None:
        visit.workers = db.query(Worker).filter(Worker.id.in_(data.worker_ids)).all()

    db.commit()
    db.refresh(visit)
    return visit


def delete_visit(db: Session, visit: Visit) -> None:
    db.delete(visit)
    db.commit()
```

**Step 3: Commit**

```bash
git add backend/src/dental_erp/visits/service.py
git commit -m "refactor: update visit service layer to use VisitServiceItem with quantity"
```

---

### Task 4: Update existing tests and add quantity tests

**Files:**
- Modify: `backend/tests/test_visits.py`

**Step 1: Run the existing tests to see what breaks**

```bash
cd backend && pytest tests/test_visits.py -v 2>&1 | head -60
```

Expected: several failures because `service_ids` is gone and `services` key is gone from responses.

**Step 2: Rewrite the visits test file**

Replace the entire file with:

```python
import pytest
from decimal import Decimal


@pytest.fixture
def seeded_client_obj(db_session):
    from dental_erp.clients.models import Client

    c = Client(name="Jan", surname="Kowalski")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


@pytest.fixture
def seeded_doctor_obj(db_session):
    from dental_erp.doctors.models import Doctor

    d = Doctor(name="Adam", surname="Nowak")
    db_session.add(d)
    db_session.commit()
    db_session.refresh(d)
    return d


@pytest.fixture
def seeded_service_obj(db_session):
    from dental_erp.services.models import Service

    s = Service(name="Cleaning", price=Decimal("75.00"), steps=["Scale", "Polish"])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def seeded_service_obj2(db_session):
    from dental_erp.services.models import Service

    s = Service(name="Filling", price=Decimal("120.00"), steps=["Drill", "Fill"])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


@pytest.fixture
def seeded_visits(db_session, seeded_client_obj, seeded_doctor_obj):
    from datetime import datetime
    from dental_erp.visits.models import Visit

    visits = [
        Visit(client_id=seeded_client_obj.id, date=datetime(2026, 4, 10, 10, 0), price=100),
        Visit(client_id=seeded_client_obj.id, date=datetime(2026, 4, 20, 10, 0), price=200),
        Visit(client_id=seeded_client_obj.id, date=datetime(2026, 5, 5, 10, 0), price=150),
    ]
    for v in visits:
        db_session.add(v)
    db_session.commit()
    for v in visits:
        db_session.refresh(v)
    return visits


def test_create_visit(client, auth_headers, seeded_client_obj, seeded_doctor_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "doctor_ids": [seeded_doctor_obj.id],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["client_id"] == seeded_client_obj.id


def test_create_visit_invalid_client_returns_404(client, auth_headers, seeded_doctor_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": 99999,
            "doctor_ids": [seeded_doctor_obj.id],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 404


def test_create_visit_with_service_items(client, auth_headers, seeded_client_obj, seeded_service_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [{"service_id": seeded_service_obj.id, "quantity": 1}],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert Decimal(data["price"]) == Decimal("75.00")
    assert data["service_items"][0]["service_id"] == seeded_service_obj.id
    assert data["service_items"][0]["quantity"] == 1


def test_create_visit_quantity_multiplies_price(
    client, auth_headers, seeded_client_obj, seeded_service_obj
):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [{"service_id": seeded_service_obj.id, "quantity": 3}],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert Decimal(r.json()["price"]) == Decimal("225.00")  # 3 * 75.00


def test_create_visit_multiple_service_types(
    client, auth_headers, seeded_client_obj, seeded_service_obj, seeded_service_obj2
):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "service_items": [
                {"service_id": seeded_service_obj.id, "quantity": 2},   # 2 * 75 = 150
                {"service_id": seeded_service_obj2.id, "quantity": 1},  # 1 * 120 = 120
            ],
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert Decimal(r.json()["price"]) == Decimal("270.00")


def test_create_visit_no_services_price_is_zero(client, auth_headers, seeded_client_obj):
    r = client.post(
        "/visits",
        json={
            "client_id": seeded_client_obj.id,
            "date": "2026-04-01T10:00:00",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert Decimal(r.json()["price"]) == Decimal("0")


def test_update_visit_recalculates_price(client, auth_headers, seeded_visits, seeded_service_obj):
    visit_id = seeded_visits[0].id
    r = client.patch(
        f"/visits/{visit_id}",
        json={"service_items": [{"service_id": seeded_service_obj.id, "quantity": 1}]},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert Decimal(r.json()["price"]) == Decimal("75.00")


def test_update_visit_quantity_recalculates_price(
    client, auth_headers, seeded_visits, seeded_service_obj
):
    visit_id = seeded_visits[0].id
    r = client.patch(
        f"/visits/{visit_id}",
        json={"service_items": [{"service_id": seeded_service_obj.id, "quantity": 4}]},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert Decimal(r.json()["price"]) == Decimal("300.00")  # 4 * 75.00


def test_filter_by_date_range(client, auth_headers, seeded_visits):
    r = client.get(
        "/visits",
        params={"date_from": "2026-04-01", "date_to": "2026-04-30"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    results = r.json()
    assert len(results) == 2
    for v in results:
        assert v["date"].startswith("2026-04")


def test_filter_by_status(client, auth_headers, seeded_visits):
    r = client.get("/visits", params={"status": "scheduled"}, headers=auth_headers)
    assert r.status_code == 200
    for v in r.json():
        assert v["status"] == "scheduled"


def test_get_visit_not_found(client, auth_headers):
    r = client.get("/visits/99999", headers=auth_headers)
    assert r.status_code == 404


def test_update_visit_status(client, auth_headers, seeded_visits):
    visit_id = seeded_visits[0].id
    r = client.patch(
        f"/visits/{visit_id}",
        json={"status": "completed"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "completed"


def test_delete_visit(client, auth_headers, seeded_visits):
    visit_id = seeded_visits[0].id
    r = client.delete(f"/visits/{visit_id}", headers=auth_headers)
    assert r.status_code == 204
```

**Step 3: Run the tests**

```bash
cd backend && pytest tests/test_visits.py -v
```

Expected: all tests pass.

**Step 4: Run the full test suite to check for regressions**

```bash
cd backend && pytest -v
```

Expected: all tests pass. If any other test references `service_ids` or `services` key in visit responses, fix them the same way.

**Step 5: Commit**

```bash
git add backend/tests/test_visits.py
git commit -m "test: update visit tests for service_items with quantity"
```

---

### Task 5: Generate and review migration

**Files:**
- Create: `backend/alembic/versions/<hash>_replace_visit_services_with_visit_service_items.py` (auto-generated)

**Step 1: Generate the migration**

```bash
cd backend && alembic revision --autogenerate -m "replace visit_services with visit_service_items"
```

Expected: a new file in `backend/alembic/versions/`.

**Step 2: Review the generated migration**

Open the generated file and verify it:
- Drops `visit_services` table
- Creates `visit_service_items` table with columns: `id` (PK), `visit_id` (FK → visits.id), `service_id` (FK → services.id), `quantity` (integer, default 1)

If the auto-generated migration looks correct, proceed. If it's missing anything, edit it manually.

**Step 3: Commit the migration**

```bash
git add backend/alembic/versions/
git commit -m "migration: replace visit_services with visit_service_items"
```

---

### Task 6: Final verification

**Step 1: Run full test suite with coverage**

```bash
cd backend && pytest --cov=dental_erp --cov-report=term-missing
```

Expected: all tests pass, coverage stays ≥ 90%.

**Step 2: Confirm app starts**

```bash
cd backend && uvicorn dental_erp.main:app --reload &
sleep 2 && curl -s http://localhost:8000/docs | grep -q "swagger" && echo "OK"
```
