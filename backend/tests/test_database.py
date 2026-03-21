import tempfile
import os

from sqlalchemy import text


def test_wal_mode():
    from dental_erp.core.database import make_engine, Base

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    try:
        engine = make_engine(f"sqlite:///{db_path}")
        Base.metadata.create_all(engine)
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA journal_mode")).scalar()
        assert result == "wal"
    finally:
        os.unlink(db_path)
