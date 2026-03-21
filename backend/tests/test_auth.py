def test_login_returns_token(client, seeded_user):
    r = client.post("/auth/login", data={"username": "admin", "password": "secret"})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_login_wrong_password_returns_401(client, seeded_user):
    r = client.post("/auth/login", data={"username": "admin", "password": "wrong"})
    assert r.status_code == 401


def test_protected_route_no_token_returns_401(client):
    r = client.get("/users/me")
    assert r.status_code == 401
