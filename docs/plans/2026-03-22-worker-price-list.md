# Worker Price List Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-worker price list that associates a worker with a service at a price strictly less than the service's standard price, surfaced on a new `/workers/:id` detail page.

**Architecture:** New `worker_price_list` backend module (modular monolith pattern) with composite PK `(worker_id, service_id)`. API endpoints nested under `/workers/{worker_id}/prices`. Frontend adds `WorkerDetailPage` at `/workers/:id` with a price list section and an Add/Edit modal.

**Tech Stack:** Python/FastAPI/SQLAlchemy (backend), React/TypeScript/Tailwind (frontend), Alembic (migrations), pytest (tests)

---

## Task 1: Backend module scaffold

**Files:**
- Create: `backend/src/dental_erp/worker_price_list/__init__.py`
- Create: `backend/src/dental_erp/worker_price_list/models.py`

**Step 1: Create the package**

```bash
mkdir backend/src/dental_erp/worker_price_list
touch backend/src/dental_erp/worker_price_list/__init__.py
```

**Step 2: Write `models.py`**

```python
# backend/src/dental_erp/worker_price_list/models.py
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from dental_erp.core.database import Base


class WorkerPriceList(Base):
    __tablename__ = "worker_price_list"

    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id"), primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), primary_key=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2, asdecimal=True))
```

**Step 3: Register model in conftest and alembic**

In `backend/tests/conftest.py`, add to `_import_all_models()`:
```python
import dental_erp.worker_price_list.models  # noqa: F401
```

In `backend/alembic/env.py`, add the same import wherever the other models are imported.

**Step 4: Generate and apply migration**

```bash
cd backend
just migration "add worker_price_list table"
just migrate
```

Expected output: migration file created, then `Running upgrade ... -> <rev>`.

**Step 5: Commit**

```bash
git add backend/src/dental_erp/worker_price_list/ backend/tests/conftest.py backend/alembic/
git commit -m "feat: add WorkerPriceList model and migration"
```

---

## Task 2: Backend schemas

**Files:**
- Create: `backend/src/dental_erp/worker_price_list/schemas.py`

**Step 1: Write schemas**

```python
# backend/src/dental_erp/worker_price_list/schemas.py
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
```

**Step 2: Commit**

```bash
git add backend/src/dental_erp/worker_price_list/schemas.py
git commit -m "feat: add WorkerPriceList schemas"
```

---

## Task 3: Backend service layer

**Files:**
- Create: `backend/src/dental_erp/worker_price_list/service.py`

**Step 1: Write the failing test first**

Create `backend/tests/test_worker_price_list.py`:

```python
import pytest
from decimal import Decimal


@pytest.fixture
def seeded_worker(db_session):
    from dental_erp.workers.models import Worker
    w = Worker(name="Jane", surname="Doe")
    db_session.add(w)
    db_session.commit()
    db_session.refresh(w)
    return w


@pytest.fixture
def seeded_service(db_session):
    from dental_erp.services.models import Service
    s = Service(name="Cleaning", price=Decimal("100.00"), steps=[])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


def test_upsert_price_creates_entry(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert

    entry = svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("60.00")))
    assert entry.price == Decimal("60.00")
    assert entry.worker_id == seeded_worker.id
    assert entry.service_id == seeded_service.id


def test_upsert_price_rejects_price_gte_service_price(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("100.00")))
    assert exc.value.status_code == 422


def test_list_prices(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert

    svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("50.00")))
    entries = svc.list_prices(db_session, seeded_worker.id)
    assert len(entries) == 1
    assert entries[0].price == Decimal("50.00")


def test_delete_price(db_session, seeded_worker, seeded_service):
    from dental_erp.worker_price_list import service as svc
    from dental_erp.worker_price_list.schemas import WorkerPriceUpsert

    svc.upsert_price(db_session, seeded_worker.id, seeded_service.id, WorkerPriceUpsert(price=Decimal("40.00")))
    svc.delete_price(db_session, seeded_worker.id, seeded_service.id)
    entries = svc.list_prices(db_session, seeded_worker.id)
    assert entries == []
```

**Step 2: Run tests to verify they fail**

```bash
cd backend
just test-file worker_price_list
```

Expected: `ImportError` or `ModuleNotFoundError` — service module doesn't exist yet.

**Step 3: Write `service.py`**

```python
# backend/src/dental_erp/worker_price_list/service.py
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from dental_erp.services.models import Service
from dental_erp.worker_price_list.models import WorkerPriceList
from dental_erp.worker_price_list.schemas import WorkerPriceUpsert


def list_prices(db: Session, worker_id: int) -> list[WorkerPriceList]:
    return (
        db.query(WorkerPriceList)
        .filter(WorkerPriceList.worker_id == worker_id)
        .all()
    )


def upsert_price(
    db: Session, worker_id: int, service_id: int, data: WorkerPriceUpsert
) -> WorkerPriceList:
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if data.price >= service.price:
        raise HTTPException(
            status_code=422,
            detail="Worker price must be strictly less than service price",
        )
    entry = db.query(WorkerPriceList).filter(
        WorkerPriceList.worker_id == worker_id,
        WorkerPriceList.service_id == service_id,
    ).first()
    if entry:
        entry.price = data.price
    else:
        entry = WorkerPriceList(worker_id=worker_id, service_id=service_id, price=data.price)
        db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def delete_price(db: Session, worker_id: int, service_id: int) -> None:
    entry = db.query(WorkerPriceList).filter(
        WorkerPriceList.worker_id == worker_id,
        WorkerPriceList.service_id == service_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Price entry not found")
    db.delete(entry)
    db.commit()
```

**Step 4: Run tests to verify they pass**

```bash
cd backend
just test-file worker_price_list
```

Expected: all 4 tests pass.

**Step 5: Commit**

```bash
git add backend/src/dental_erp/worker_price_list/service.py backend/tests/test_worker_price_list.py
git commit -m "feat: add WorkerPriceList service layer with tests"
```

---

## Task 4: Backend router + API tests

**Files:**
- Create: `backend/src/dental_erp/worker_price_list/router.py`
- Modify: `backend/src/dental_erp/main.py`

**Step 1: Write failing API tests**

Add to `backend/tests/test_worker_price_list.py`:

```python
@pytest.fixture
def seeded_worker_api(db_session):
    from dental_erp.workers.models import Worker
    w = Worker(name="Alice", surname="Smith")
    db_session.add(w)
    db_session.commit()
    db_session.refresh(w)
    return w


@pytest.fixture
def seeded_service_api(db_session):
    from dental_erp.services.models import Service
    s = Service(name="X-Ray", price=Decimal("200.00"), steps=[])
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)
    return s


def test_api_upsert_price(client, auth_headers, seeded_worker_api, seeded_service_api):
    r = client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "80.00"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["price"] == "80.00"
    assert data["service_name"] == "X-Ray"
    assert data["service_price"] == "200.00"


def test_api_upsert_price_rejects_high_price(client, auth_headers, seeded_worker_api, seeded_service_api):
    r = client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "200.00"},
        headers=auth_headers,
    )
    assert r.status_code == 422


def test_api_list_prices(client, auth_headers, seeded_worker_api, seeded_service_api):
    client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "90.00"},
        headers=auth_headers,
    )
    r = client.get(f"/workers/{seeded_worker_api.id}/prices", headers=auth_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_api_delete_price(client, auth_headers, seeded_worker_api, seeded_service_api):
    client.put(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        json={"price": "70.00"},
        headers=auth_headers,
    )
    r = client.delete(
        f"/workers/{seeded_worker_api.id}/prices/{seeded_service_api.id}",
        headers=auth_headers,
    )
    assert r.status_code == 204


def test_api_worker_not_found(client, auth_headers):
    r = client.get("/workers/99999/prices", headers=auth_headers)
    assert r.status_code == 404
```

**Step 2: Run to verify they fail**

```bash
cd backend
just test-file worker_price_list
```

Expected: tests fail with 404 (routes don't exist yet).

**Step 3: Write `router.py`**

The `WorkerPriceRead` response needs `service_name` and `service_price`, which aren't columns on `WorkerPriceList`. We'll build a helper that joins Service into the response schema manually.

```python
# backend/src/dental_erp/worker_price_list/router.py
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user
from dental_erp.services.models import Service
from dental_erp.worker_price_list import service as svc
from dental_erp.worker_price_list.schemas import WorkerPriceRead, WorkerPriceUpsert
from dental_erp.workers import service as worker_svc

router = APIRouter(prefix="/workers/{worker_id}/prices", tags=["worker-prices"])


def _resolve_worker(worker_id: int, db: Session):
    worker = worker_svc.get_worker(db, worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


def _to_read(entry, db: Session) -> WorkerPriceRead:
    service = db.query(Service).filter(Service.id == entry.service_id).first()
    return WorkerPriceRead(
        worker_id=entry.worker_id,
        service_id=entry.service_id,
        service_name=service.name,
        service_price=service.price,
        price=entry.price,
    )


@router.get("", response_model=list[WorkerPriceRead])
def list_prices(
    worker_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    _resolve_worker(worker_id, db)
    entries = svc.list_prices(db, worker_id)
    return [_to_read(e, db) for e in entries]


@router.put("/{service_id}", response_model=WorkerPriceRead)
def upsert_price(
    worker_id: int,
    service_id: int,
    data: WorkerPriceUpsert,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    _resolve_worker(worker_id, db)
    entry = svc.upsert_price(db, worker_id, service_id, data)
    return _to_read(entry, db)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_price(
    worker_id: int,
    service_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    _resolve_worker(worker_id, db)
    svc.delete_price(db, worker_id, service_id)
```

**Step 4: Register router in `main.py`**

Add to `backend/src/dental_erp/main.py`:
```python
from dental_erp.worker_price_list.router import router as worker_prices_router
```
And in `create_app()`:
```python
app.include_router(worker_prices_router)
```

**Step 5: Run tests to verify they pass**

```bash
cd backend
just test-file worker_price_list
```

Expected: all tests pass.

Also run full suite to ensure nothing broke:
```bash
cd backend
just test
```

**Step 6: Commit**

```bash
git add backend/src/dental_erp/worker_price_list/router.py backend/src/dental_erp/main.py backend/tests/test_worker_price_list.py
git commit -m "feat: add WorkerPriceList router and API tests"
```

---

## Task 5: Frontend API client and types

**Files:**
- Create: `frontend/src/api/workerPrices.ts`
- Modify: `frontend/src/types/api.ts`

**Step 1: Add `WorkerPriceRead` type**

In `frontend/src/types/api.ts`, after the `WorkerRead` interface, add:

```typescript
export interface WorkerPriceRead {
  worker_id: number;
  service_id: number;
  service_name: string;
  service_price: string;
  price: string;
}
```

**Step 2: Create `workerPrices.ts`**

```typescript
// frontend/src/api/workerPrices.ts
import { apiFetch } from './client';
import type { WorkerPriceRead } from '../types/api';

export const getWorkerPrices = (workerId: number) =>
  apiFetch<WorkerPriceRead[]>(`/workers/${workerId}/prices`);

export const upsertWorkerPrice = (workerId: number, serviceId: number, price: string) =>
  apiFetch<WorkerPriceRead>(`/workers/${workerId}/prices/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ price }),
  });

export const deleteWorkerPrice = (workerId: number, serviceId: number) =>
  apiFetch<void>(`/workers/${workerId}/prices/${serviceId}`, { method: 'DELETE' });
```

**Step 3: Commit**

```bash
git add frontend/src/api/workerPrices.ts frontend/src/types/api.ts
git commit -m "feat: add WorkerPriceRead type and workerPrices API client"
```

---

## Task 6: WorkerDetailPage

**Files:**
- Create: `frontend/src/pages/WorkerDetailPage.tsx`

**Step 1: Write `WorkerDetailPage.tsx`**

This page:
- Fetches worker by id (`getWorker`)
- Fetches worker's price list (`getWorkerPrices`)
- Fetches all services (`getServices`) — used to populate the Add modal dropdown, filtering out already-configured service IDs
- Shows a table of configured entries
- "Add Price" button opens a modal; rows have Edit/Delete actions
- Inline validation: price must be a valid decimal and less than `service_price`; shows error before submit

```tsx
// frontend/src/pages/WorkerDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorker } from '../api/workers';
import { getServices } from '../api/services';
import { getWorkerPrices, upsertWorkerPrice, deleteWorkerPrice } from '../api/workerPrices';
import type { WorkerRead, ServiceRead, WorkerPriceRead } from '../types/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { formatDate, personInitials } from '../utils/formatters';

export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workerId = Number(id);

  const [worker, setWorker] = useState<WorkerRead | null>(null);
  const [prices, setPrices] = useState<WorkerPriceRead[]>([]);
  const [services, setServices] = useState<ServiceRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkerPriceRead | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceError, setPriceError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<WorkerPriceRead | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    const [w, p, s] = await Promise.all([
      getWorker(workerId),
      getWorkerPrices(workerId),
      getServices(),
    ]);
    setWorker(w);
    setPrices(p);
    setServices(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, [workerId]);

  const configuredServiceIds = new Set(prices.map(p => p.service_id));

  const openAdd = () => {
    setEditingEntry(null);
    setSelectedServiceId('');
    setPriceInput('');
    setPriceError('');
    setModalOpen(true);
  };

  const openEdit = (entry: WorkerPriceRead) => {
    setEditingEntry(entry);
    setSelectedServiceId(String(entry.service_id));
    setPriceInput(entry.price);
    setPriceError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
  };

  const validatePrice = (serviceId: number, price: string): string => {
    const num = parseFloat(price);
    if (isNaN(num) || num <= 0) return 'Enter a valid price';
    const svc = services.find(s => s.id === serviceId);
    if (svc && num >= parseFloat(svc.price)) {
      return `Must be less than service price (${svc.price})`;
    }
    return '';
  };

  const handleSubmit = async () => {
    const svcId = Number(selectedServiceId);
    const err = validatePrice(svcId, priceInput);
    if (err) { setPriceError(err); return; }
    setSaving(true);
    try {
      await upsertWorkerPrice(workerId, svcId, parseFloat(priceInput).toFixed(2));
      await load();
      closeModal();
    } catch (e: any) {
      setPriceError(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteWorkerPrice(workerId, deleteTarget.service_id);
      await load();
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const availableServices = services.filter(
    s => !configuredServiceIds.has(s.id) || s.id === editingEntry?.service_id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
      </div>
    );
  }

  if (!worker) {
    return <div className="pt-8 max-w-7xl mx-auto text-on-surface-variant">Worker not found.</div>;
  }

  return (
    <div className="pt-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/workers')}
          className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-lg font-bold shrink-0">
          {personInitials(worker.name, worker.surname)}
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface font-headline">{worker.name} {worker.surname}</h2>
          <p className="text-on-surface-variant text-sm">#{worker.id}</p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm mb-8 flex gap-8">
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Phone</p>
          <p className="text-on-surface">{worker.phone || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email</p>
          <p className="text-on-surface">{worker.email || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Joined</p>
          <p className="text-on-surface">{formatDate(worker.created_at)}</p>
        </div>
      </div>

      {/* Price list */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-on-surface">Price List</h3>
        <Button onClick={openAdd} disabled={availableServices.length === 0 && !editingEntry}>
          <span className="material-symbols-outlined text-base">add</span>
          Add Price
        </Button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm">
        {prices.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">No prices configured yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Service</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Service Price</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Worker Price</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-low/30">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prices.map(entry => {
                const isInvalid = parseFloat(entry.price) >= parseFloat(entry.service_price);
                return (
                  <tr key={entry.service_id} className={`hover:bg-surface-container-low/40 transition-colors ${isInvalid ? 'bg-error-container/10' : ''}`}>
                    <td className="px-8 py-4 text-on-surface font-medium">{entry.service_name}</td>
                    <td className="px-8 py-4 text-on-surface-variant">{entry.service_price}</td>
                    <td className="px-8 py-4">
                      <span className={isInvalid ? 'text-error font-semibold' : 'text-on-surface'}>
                        {entry.price}
                        {isInvalid && (
                          <span className="material-symbols-outlined text-sm ml-1 align-middle">warning</span>
                        )}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(entry)} className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant hover:text-primary">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onClick={() => setDeleteTarget(entry)} className="w-9 h-9 rounded-xl hover:bg-error-container/30 flex items-center justify-center transition-colors text-on-surface-variant hover:text-error">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingEntry ? 'Edit Price' : 'Add Price'}>
        <div className="flex flex-col gap-4">
          {!editingEntry && (
            <Select
              label="Service"
              value={selectedServiceId}
              onChange={e => { setSelectedServiceId(e.target.value); setPriceError(''); }}
            >
              <option value="">Select a service…</option>
              {availableServices.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (max: {s.price})
                </option>
              ))}
            </Select>
          )}
          {editingEntry && (
            <p className="text-sm text-on-surface-variant">
              Service: <span className="font-semibold text-on-surface">{editingEntry.service_name}</span>
              {' '}(max: {editingEntry.service_price})
            </p>
          )}
          <Input
            label="Worker Price"
            type="number"
            min="0"
            step="0.01"
            value={priceInput}
            onChange={e => { setPriceInput(e.target.value); setPriceError(''); }}
            error={priceError}
            icon="payments"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="text" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || (!editingEntry && !selectedServiceId) || !priceInput}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Price"
        message={`Remove price for "${deleteTarget?.service_name}"?`}
        loading={deleteLoading}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/WorkerDetailPage.tsx
git commit -m "feat: add WorkerDetailPage with price list"
```

---

## Task 7: Wire up routing and WorkersPage link

**Files:**
- Modify: `frontend/src/router/index.tsx`
- Modify: `frontend/src/pages/WorkersPage.tsx`

**Step 1: Add route to `router/index.tsx`**

Add import:
```typescript
import { WorkerDetailPage } from '../pages/WorkerDetailPage';
```

Add route inside the protected `<Route>` block, after the existing workers route:
```tsx
<Route path="/workers/:id" element={<WorkerDetailPage />} />
```

**Step 2: Make worker name a link in `WorkersPage.tsx`**

Add import:
```typescript
import { useNavigate } from 'react-router-dom';
```

Inside `WorkersPage`, add:
```typescript
const navigate = useNavigate();
```

Wrap the name cell content to be clickable. Find the `<p className="font-semibold text-on-surface">` line and replace the outer `<div>` around name/id with:
```tsx
<div
  className="cursor-pointer hover:text-primary transition-colors"
  onClick={() => navigate(`/workers/${w.id}`)}
>
  <p className="font-semibold text-on-surface">{w.name} {w.surname}</p>
  <p className="text-xs text-on-surface-variant">#{w.id}</p>
</div>
```

**Step 3: Check that `getServices` exists in the API client**

Verify `frontend/src/api/services.ts` exports `getServices`. If it does not exist, create it:
```typescript
// frontend/src/api/services.ts
import { apiFetch } from './client';
import type { ServiceRead } from '../types/api';

export const getServices = () => apiFetch<ServiceRead[]>('/services');
```

**Step 4: Commit**

```bash
git add frontend/src/router/index.tsx frontend/src/pages/WorkersPage.tsx frontend/src/api/services.ts
git commit -m "feat: wire WorkerDetailPage route and clickable worker names"
```

---

## Task 8: Smoke test end-to-end

**Step 1: Run full backend test suite**

```bash
cd backend
just test
```

Expected: all tests pass (no regressions).

**Step 2: Start dev environment and manual test**

```bash
just up   # or just dev in backend, and npm run dev in frontend
```

- Navigate to Workers page
- Click a worker name → should land on `/workers/:id`
- Click "Add Price" → modal appears with service dropdown and price input
- Select a service, enter price higher than service price → error shown
- Enter valid price → entry appears in table
- Edit entry → modal pre-fills with current price
- Delete entry → entry disappears
- 404 on unknown worker id → worker not found message shown

**Step 3: Commit any fixes found**

```bash
git add -p
git commit -m "fix: <describe any issues found>"
```
