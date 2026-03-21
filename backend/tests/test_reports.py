import pytest
from datetime import datetime


@pytest.fixture
def seeded_visits_for_report(db_session):
    from dental_erp.clients.models import Client
    from dental_erp.doctors.models import Doctor
    from dental_erp.visits.models import Visit

    client = Client(name="Jan", surname="Kowalski")
    doctor = Doctor(name="Adam", surname="Nowak")
    db_session.add(client)
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(client)
    db_session.refresh(doctor)

    visits = [
        Visit(client_id=client.id, date=datetime(2026, 4, 10, 10, 0), price=100, status="completed"),
        Visit(client_id=client.id, date=datetime(2026, 4, 20, 10, 0), price=200, status="completed"),
    ]
    for v in visits:
        db_session.add(v)
    db_session.commit()
    return visits


def test_pdf_builder_returns_pdf_bytes():
    from dental_erp.reports.pdf_builder import build_pdf

    result = build_pdf(
        [{"date": "2026-04-01", "client": "Jan K.", "doctors": ["Dr. Nowak"], "services_provided": "Cleaning", "status": "completed", "price": "150.00"}],
        "Test Report",
    )
    assert result[:4] == b"%PDF"


def test_report_endpoint_returns_pdf(client, auth_headers, seeded_visits_for_report):
    r = client.post(
        "/report",
        json={"date_from": "2026-04-01", "date_to": "2026-04-30"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"


def test_report_endpoint_empty_range(client, auth_headers):
    r = client.post("/report", json={}, headers=auth_headers)
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"
