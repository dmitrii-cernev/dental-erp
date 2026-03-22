---
name: Worker Price List Design
description: Design for per-worker pricing of services
type: project
date: 2026-03-22
---

# Worker Price List — Design

## Summary

Each worker can have an explicit price for services they perform. That price must be strictly less than the service's standard price. Only explicitly configured entries exist — there is no implicit default.

## Backend

### New module: `backend/src/dental_erp/worker_price_list/`

Files: `__init__.py`, `models.py`, `schemas.py`, `service.py`, `router.py`

### Model: `WorkerPriceList`

Table: `worker_price_list`

| Column       | Type              | Notes                        |
|--------------|-------------------|------------------------------|
| worker_id    | FK → workers.id   | composite PK                 |
| service_id   | FK → services.id  | composite PK                 |
| price        | Numeric(10, 2)    | must be < service.price      |

### API Endpoints

All under `/workers/{worker_id}/prices`, auth-protected.

| Method | Path                                          | Description                          |
|--------|-----------------------------------------------|--------------------------------------|
| GET    | `/workers/{worker_id}/prices`                 | List all price entries for a worker  |
| PUT    | `/workers/{worker_id}/prices/{service_id}`    | Upsert a price entry                 |
| DELETE | `/workers/{worker_id}/prices/{service_id}`    | Remove a price entry                 |

### Schemas

- `WorkerPriceUpsert`: `{ price: Decimal }`
- `WorkerPriceRead`: `{ worker_id, service_id, service_name, service_price, price }`

### Validation

Service layer fetches the `Service` record before upsert. If `data.price >= service.price`, raises `HTTPException(422, "Worker price must be less than service price")`.

### Registration

- Import model in `conftest.py` `_import_all_models()` and `alembic/env.py`
- Register router in `main.py` `create_app()`
- Generate migration: `alembic revision --autogenerate -m "add worker_price_list table"`

## Frontend

### New route: `/workers/:id` → `WorkerDetailPage`

**Layout:**
- Header: worker initials avatar, full name, back link to `/workers`
- Info card: phone, email, joined date
- Price List section below

**Price List section:**
- Table of configured entries: Service Name | Worker Price | Service Price | Actions (Edit, Delete)
- "Add Price" button opens a modal
- If no entries: empty state with "Add Price" prompt

**Add/Edit Price modal:**
- Service dropdown (on add: excludes already-configured services)
- Price input (Decimal)
- Inline validation: error shown if price ≥ service price (before submit)
- API error surfaced if backend rejects

### New files

- `frontend/src/pages/WorkerDetailPage.tsx`
- `frontend/src/api/workerPrices.ts` — `getWorkerPrices`, `upsertWorkerPrice`, `deleteWorkerPrice`

### Modified files

- `frontend/src/types/api.ts` — add `WorkerPriceRead` type
- `frontend/src/pages/WorkersPage.tsx` — worker name becomes a link to `/workers/:id`
- `frontend/src/App.tsx` (or router file) — add route for `/workers/:id`
