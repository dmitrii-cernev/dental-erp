import pytest


@pytest.fixture
def client():
    from dental_erp.main import app
    from starlette.testclient import TestClient

    with TestClient(app) as c:
        yield c
