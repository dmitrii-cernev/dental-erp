set dotenv-load := true

backend := "backend"

# List available recipes
default:
    @just --list

# ── Install ────────────────────────────────────────────────────────────────────

# Install backend with dev dependencies
install:
    cd {{backend}} && pip install -e ".[dev]"

# ── Dev server ────────────────────────────────────────────────────────────────

# Run dev server with auto-reload
dev:
    cd {{backend}} && uvicorn dental_erp.main:app --reload

# Run dev server on a custom host/port
dev-on host="0.0.0.0" port="8000":
    cd {{backend}} && uvicorn dental_erp.main:app --reload --host {{host}} --port {{port}}

# ── Tests ─────────────────────────────────────────────────────────────────────

# Run all tests
test:
    cd {{backend}} && pytest

# Run tests with coverage report
cov:
    cd {{backend}} && pytest --cov=dental_erp --cov-report=term-missing

# Run a specific test file  e.g: just test-file test_visits
test-file file:
    cd {{backend}} && pytest tests/test_{{file}}.py -v

# Run a single test by name  e.g: just test-one test_visits::test_create_visit
test-one name:
    cd {{backend}} && pytest tests/{{name}} -v

# ── Lint ──────────────────────────────────────────────────────────────────────

# Check linting
lint:
    cd {{backend}} && ruff check src/

# Fix auto-fixable lint issues
lint-fix:
    cd {{backend}} && ruff check src/ --fix

# ── Database / Migrations ────────────────────────────────────────────────────

# Apply all pending migrations
migrate:
    cd {{backend}} && alembic upgrade head

# Generate a new migration  e.g: just migration "add appointment table"
migration msg:
    cd {{backend}} && alembic revision --autogenerate -m "{{msg}}"

# Roll back one migration
migrate-down:
    cd {{backend}} && alembic downgrade -1

# Show current migration state
migrate-status:
    cd {{backend}} && alembic current

# ── Docker ───────────────────────────────────────────────────────────────────

# Build and start all services
up:
    docker compose up --build -d

# Stop all services
down:
    docker compose down

# Show live logs
logs:
    docker compose logs -f backend

# Health check against running container
health:
    curl -s http://localhost:8000/health | python3 -m json.tool

# ── Backup ───────────────────────────────────────────────────────────────────

# Run a hot backup of the containerised database
backup:
    docker compose exec backend /app/scripts/backup.sh
