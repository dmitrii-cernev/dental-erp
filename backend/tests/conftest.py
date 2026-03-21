import pytest


@pytest.fixture(scope="function")
def test_engine():
    from dental_erp.core.database import Base, make_engine

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
