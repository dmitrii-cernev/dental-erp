from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dental_erp.core.config import settings
from dental_erp.auth.router import router as auth_router
from dental_erp.users.router import router as users_router


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
    return app


app = create_app()


@app.get("/health")
def health():
    return {"status": "ok"}
