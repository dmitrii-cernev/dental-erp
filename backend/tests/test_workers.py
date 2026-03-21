import pytest


@pytest.fixture
def seeded_worker(db_session):
    from dental_erp.workers.models import Worker

    worker = Worker(name="Maria", surname="Wiśniewska")
    db_session.add(worker)
    db_session.commit()
    db_session.refresh(worker)
    return worker


def test_create_worker(client, auth_headers):
    r = client.post("/workers", json={"name": "Maria", "surname": "Wiśniewska"}, headers=auth_headers)
    assert r.status_code == 201


def test_list_workers(client, auth_headers):
    r = client.get("/workers", headers=auth_headers)
    assert r.status_code == 200


def test_get_worker(client, auth_headers, seeded_worker):
    r = client.get(f"/workers/{seeded_worker.id}", headers=auth_headers)
    assert r.status_code == 200


def test_delete_worker_then_404(client, auth_headers, seeded_worker):
    client.delete(f"/workers/{seeded_worker.id}", headers=auth_headers)
    r = client.get(f"/workers/{seeded_worker.id}", headers=auth_headers)
    assert r.status_code == 404


def test_update_worker(client, auth_headers, seeded_worker):
    r = client.patch(
        f"/workers/{seeded_worker.id}",
        json={"name": "Zofia", "surname": "Wiśniewska"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Zofia"
