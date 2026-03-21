from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dental_erp.core.config import settings
from dental_erp.auth.router import router as auth_router
from dental_erp.clients.router import router as clients_router
from dental_erp.doctors.router import router as doctors_router
from dental_erp.users.router import router as users_router
from dental_erp.reports.router import router as reports_router
from dental_erp.visits.router import router as visits_router
from dental_erp.workers.router import router as workers_router


def create_app() -> FastAPI:
    app = FastAPI(title="Dental ERP", version="0.1.0")
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
    return app


app = create_app()


@app.get("/health")
def health():
    return {"status": "ok"}
