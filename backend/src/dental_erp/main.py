from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dental_erp.core.config import settings
from dental_erp.core.database import SessionLocal
from dental_erp.auth.router import router as auth_router
from dental_erp.clients.router import router as clients_router
from dental_erp.doctors.router import router as doctors_router
from dental_erp.users.router import router as users_router
from dental_erp.users.schemas import UserCreate
from dental_erp.users.service import create_user, get_user_by_username
from dental_erp.dashboard.router import router as dashboard_router
from dental_erp.reports.router import router as reports_router
from dental_erp.visits.router import router as visits_router
from dental_erp.workers.router import router as workers_router


def _seed_admin() -> None:
    db = SessionLocal()
    try:
        if get_user_by_username(db, settings.ADMIN_USERNAME) is None:
            create_user(db, UserCreate(
                username=settings.ADMIN_USERNAME,
                password=settings.ADMIN_PASSWORD,
                role="admin",
            ))
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_admin()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Dental ERP", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(clients_router)
    app.include_router(doctors_router)
    app.include_router(workers_router)
    app.include_router(visits_router)
    app.include_router(reports_router)
    app.include_router(dashboard_router)
    return app


app = create_app()


@app.get("/health")
def health():
    return {"status": "ok"}
