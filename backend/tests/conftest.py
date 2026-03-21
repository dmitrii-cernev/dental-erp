import pytest


def _import_all_models():
    """Import all models so they register with Base.metadata."""
    import dental_erp.users.models  # noqa: F401
    import dental_erp.clients.models  # noqa: F401
    import dental_erp.doctors.models  # noqa: F401
    import dental_erp.workers.models  # noqa: F401
    import dental_erp.visits.models  # noqa: F401


@pytest.fixture(scope="function")
def test_engine():
    from sqlalchemy import create_engine
    from sqlalchemy.pool import StaticPool
    from dental_erp.core.database import Base, _enable_wal

    _import_all_models()
    from sqlalchemy import event

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    event.listen(engine, "connect", _enable_wal)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)


@pytest.fixture
def db_session(test_engine):
    from sqlalchemy.orm import sessionmaker

    Session = sessionmaker(bind=test_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


@pytest.fixture
def client(test_engine, db_session):
    from sqlalchemy.orm import sessionmaker
    from dental_erp.core.database import get_db
    from dental_erp.main import app
    from starlette.testclient import TestClient

    # db_session seeds data; API gets its own session on same engine (StaticPool = same in-memory DB)
    ApiSession = sessionmaker(bind=test_engine)

    def override_get_db():
        session = ApiSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_user(db_session):
    from dental_erp.users.models import User
    from dental_erp.core.security import hash_password

    user = User(username="admin", hashed_password=hash_password("secret"), role="admin")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, seeded_user):
    r = client.post("/auth/login", data={"username": "admin", "password": "secret"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
