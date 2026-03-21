def test_create_user(client, auth_headers):
    r = client.post(
        "/users",
        json={"username": "nurse1", "password": "pass", "role": "staff"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert "password" not in r.json()


def test_duplicate_user_returns_409(client, auth_headers, seeded_user):
    r = client.post(
        "/users",
        json={"username": "admin", "password": "x", "role": "staff"},
        headers=auth_headers,
    )
    assert r.status_code == 409


def test_list_users(client, auth_headers, seeded_user):
    r = client.get("/users", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_get_user_not_found(client, auth_headers):
    r = client.get("/users/99999", headers=auth_headers)
    assert r.status_code == 404


def test_update_user(client, auth_headers, seeded_user):
    r = client.patch(f"/users/{seeded_user.id}", json={"role": "staff"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["role"] == "staff"


def test_delete_user(client, auth_headers, seeded_user):
    r = client.delete(f"/users/{seeded_user.id}", headers=auth_headers)
    assert r.status_code == 204
