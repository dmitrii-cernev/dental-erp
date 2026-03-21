# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Layout

```
dental-erp/
  backend/          # Python FastAPI backend (primary codebase)
  UI/               # Frontend design assets and HTML mockups
  docker-compose.yml
  plan.md
```

All backend work happens inside `backend/`. The package source is at `backend/src/dental_erp/`.

## Commands

A `Justfile` at the repo root provides all common tasks (`just --list` to see them all):

```bash
just install                        # pip install -e ".[dev]"
just dev                            # uvicorn with --reload
just test                           # pytest
just test-file visits               # pytest tests/test_visits.py -v
just test-one visits::test_create_visit
just cov                            # pytest --cov + term-missing report
just lint / just lint-fix           # ruff check src/
just migrate                        # alembic upgrade head
just migration "add foo table"      # alembic revision --autogenerate
just migrate-down                   # alembic downgrade -1
just up / just down / just logs     # docker compose
just backup                         # hot backup via container
```

## Architecture

**Modular monolith** — each domain owns a package with `models.py`, `schemas.py`, `service.py`, `router.py`.

```
core/
  config.py       # Settings via pydantic-settings (DATABASE_URL, SECRET_KEY, etc.)
  database.py     # SQLAlchemy engine (WAL mode), Base, get_db dependency
  security.py     # bcrypt hashing, JWT encode/decode
  dependencies.py # get_current_user (OAuth2 bearer)
  schemas.py      # PersonBase (shared by clients/doctors/workers)
auth/             # POST /auth/login → JWT token
users/            # /users CRUD + GET /users/me
clients/          # /clients CRUD
doctors/          # /doctors CRUD
workers/          # /workers CRUD
visits/           # /visits CRUD + filtering (date, status, doctor)
reports/          # POST /report → PDF (application/pdf)
dashboard/        # GET /dashboard/stats → aggregated counts/revenue
```

Routers are registered in `main.py` via `create_app()`.

## Key Design Decisions

- **Separate tables** for Client, Doctor, Worker (same columns for now). Use `PersonBase` Pydantic schema to share validation.
- **Visits → Doctors/Workers** via explicit association tables (`visit_doctors`, `visit_workers`), not polymorphism. Relationships must use `Mapped[List["Doctor"]]` (fully typed) — `Mapped[list]` without a type parameter causes SQLAlchemy to treat the relationship as a scalar.
- **Price** stored as `Numeric(10, 2, asdecimal=True)`, never `float`.
- **VisitStatus** is a `StrEnum`: `scheduled | completed | cancelled | no_show`.
- **JWT** only, 8-hour tokens. Login uses `OAuth2PasswordRequestForm` (form data, compatible with Swagger UI at `/docs`).
- **PDF reports** built via `reports/pdf_builder.py` — a pure function `build_pdf(visits, title) -> bytes`, no DB access.

## Test Infrastructure

Tests use an **in-memory SQLite** database with `StaticPool`. The critical pattern in `conftest.py`:

- `db_session` — for seeding test data directly
- `client` fixture — creates a **separate** `ApiSession` per request (not sharing `db_session`). This prevents SQLAlchemy lazy-loading failures that occur when a session is used from multiple threads.
- All models must be imported before `Base.metadata.create_all()` — handled by `_import_all_models()` in conftest.

**`freezegun` + JWT**: `@freeze_time` only applies to the test body, not fixture setup. If frozen time is later than the token's expiry, requests return 401. Always create the JWT token **inside** the `freeze_time` context for time-sensitive dashboard tests.

## Adding a New Domain Entity

1. Create `src/dental_erp/<entity>/` with `__init__.py`, `models.py`, `schemas.py`, `service.py`, `router.py`
2. Import the model in `conftest.py`'s `_import_all_models()` and in `alembic/env.py`
3. Register the router in `main.py`'s `create_app()`
4. Run `alembic revision --autogenerate -m "add <entity>"` from `backend/`
