from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    DATABASE_URL: str = "sqlite:///./dental_erp.db"
    SECRET_KEY: str = "changeme"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin"


settings = Settings()
