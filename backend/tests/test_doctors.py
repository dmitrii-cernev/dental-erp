import pytest


@pytest.fixture
def seeded_doctor(db_session):
    from dental_erp.doctors.models import Doctor

    doctor = Doctor(name="Adam", surname="Nowak")
    db_session.add(doctor)
    db_session.commit()
    db_session.refresh(doctor)
    return doctor


def test_create_doctor(client, auth_headers):
    r = client.post("/doctors", json={"name": "Adam", "surname": "Nowak"}, headers=auth_headers)
    assert r.status_code == 201


def test_list_doctors(client, auth_headers):
    r = client.get("/doctors", headers=auth_headers)
    assert r.status_code == 200


def test_get_doctor(client, auth_headers, seeded_doctor):
    r = client.get(f"/doctors/{seeded_doctor.id}", headers=auth_headers)
    assert r.status_code == 200


def test_delete_doctor_then_404(client, auth_headers, seeded_doctor):
    client.delete(f"/doctors/{seeded_doctor.id}", headers=auth_headers)
    r = client.get(f"/doctors/{seeded_doctor.id}", headers=auth_headers)
    assert r.status_code == 404


def test_update_doctor(client, auth_headers, seeded_doctor):
    r = client.patch(
        f"/doctors/{seeded_doctor.id}",
        json={"name": "Marek", "surname": "Nowak"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["name"] == "Marek"
