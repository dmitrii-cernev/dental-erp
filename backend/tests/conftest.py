import pytest


def _import_all_models():
    """Import all models so they register with Base.metadata."""
    import dental_erp.users.models  # noqa: F401


@pytest.fixture(scope="function")
def test_engine():
    from dental_erp.core.database import Base, make_engine

    _import_all_models()
    engine = make_engine("sqlite:///:memory:")
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
def client(db_session):
    from dental_erp.core.database import get_db
    from dental_erp.main import app
    from starlette.testclient import TestClient

    def override_get_db():
        yield db_session

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
