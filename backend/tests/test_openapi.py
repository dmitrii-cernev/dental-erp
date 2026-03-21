def test_openapi_lists_all_routes(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    paths = r.json()["paths"]
    for prefix in ["/auth", "/users", "/clients", "/doctors", "/workers", "/visits", "/report", "/dashboard"]:
        assert any(p.startswith(prefix) for p in paths), f"Missing prefix: {prefix}"
