import pytest


@pytest.fixture
def seeded_client(db_session):
    from dental_erp.clients.models import Client

    client = Client(name="Jan", surname="Kowalski")
    db_session.add(client)
    db_session.commit()
    db_session.refresh(client)
    return client


def test_create_client(client, auth_headers):
    r = client.post("/clients", json={"name": "Jan", "surname": "Kowalski"}, headers=auth_headers)
    assert r.status_code == 201


def test_list_clients(client, auth_headers):
    r = client.get("/clients", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_client(client, auth_headers, seeded_client):
    r = client.get(f"/clients/{seeded_client.id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["surname"] == "Kowalski"


def test_delete_client_then_404(client, auth_headers, seeded_client):
    client.delete(f"/clients/{seeded_client.id}", headers=auth_headers)
    r = client.get(f"/clients/{seeded_client.id}", headers=auth_headers)
    assert r.status_code == 404


def test_update_client(client, auth_headers, seeded_client):
    r = client.patch(
        f"/clients/{seeded_client.id}",
        json={"name": "Anna", "surname": "Kowalski"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Anna"
