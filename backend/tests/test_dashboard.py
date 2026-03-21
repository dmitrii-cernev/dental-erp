from freezegun import freeze_time


def test_dashboard_structure(client, seeded_user):
    with freeze_time("2026-04-15 12:00:00"):
        # Create token inside frozen time so it won't appear expired
        r = client.post("/auth/login", data={"username": "admin", "password": "secret"})
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        r = client.get("/dashboard/stats", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert "total_visits_today" in data
        assert "total_visits_this_month" in data
        assert "revenue_today" in data
        assert "revenue_this_month" in data
        assert "total_clients" in data
        assert "visits_by_status" in data


def test_dashboard_visit_counts(client, seeded_user, db_session):
    from datetime import datetime
    from dental_erp.clients.models import Client
    from dental_erp.visits.models import Visit

    c = Client(name="Test", surname="User")
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)

    v1 = Visit(client_id=c.id, date=datetime(2026, 4, 15, 10, 0), price=100)
    v2 = Visit(client_id=c.id, date=datetime(2026, 4, 5, 10, 0), price=50)
    db_session.add(v1)
    db_session.add(v2)
    db_session.commit()

    with freeze_time("2026-04-15 12:00:00"):
        r = client.post("/auth/login", data={"username": "admin", "password": "secret"})
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        r = client.get("/dashboard/stats", headers=headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total_visits_today"] == 1
        assert data["total_visits_this_month"] == 2
        assert data["total_clients"] == 1
