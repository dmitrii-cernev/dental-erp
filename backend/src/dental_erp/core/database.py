from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from dental_erp.core.config import settings


class Base(DeclarativeBase):
    pass


def _enable_wal(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA journal_mode=WAL")
    dbapi_conn.execute("PRAGMA synchronous=NORMAL")


def make_engine(url: str):
    engine = create_engine(url, connect_args={"check_same_thread": False})
    if url.startswith("sqlite"):
        event.listen(engine, "connect", _enable_wal)
    return engine


engine = make_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
