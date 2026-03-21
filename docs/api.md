# Dental ERP — API Reference

Base URL: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs` (Swagger UI)

All endpoints except `/health` and `POST /auth/login` require a Bearer token.

---

## Authentication

### POST /auth/login

Obtain a JWT access token. Accepts `application/x-www-form-urlencoded` (compatible with Swagger UI "Authorize").

**Request** (form data)
| Field | Type | Required |
|-------|------|----------|
| `username` | string | ✓ |
| `password` | string | ✓ |

**Response 200**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

**Errors:** `401` wrong credentials

---

## System

### GET /health

Health check. No auth required.

**Response 200**
```json
{ "status": "ok" }
```

---

## Users

> Manage system login accounts. Roles: `admin`, `staff`.

### GET /users/me
Returns the currently authenticated user.

**Response 200** → `UserRead`

### GET /users
List all users.

**Response 200** → `UserRead[]`

### POST /users
Create a user.

**Body**
```json
{ "username": "nurse1", "password": "secret", "role": "staff" }
```

**Response 201** → `UserRead`
**Errors:** `409` username already exists

### GET /users/{id}
**Response 200** → `UserRead`  **Errors:** `404`

### PATCH /users/{id}
Update role or active status.

**Body** (all fields optional)
```json
{ "role": "admin", "is_active": false }
```

**Response 200** → `UserRead`  **Errors:** `404`

### DELETE /users/{id}
**Response 204**  **Errors:** `404`

#### UserRead schema
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-03-21T10:00:00"
}
```

---

## Clients

> Dental clinic patients.

All person endpoints share the same body shape (`PersonBase`):

| Field | Type | Required |
|-------|------|----------|
| `name` | string | ✓ |
| `surname` | string | ✓ |
| `phone` | string | — |
| `email` | string (email) | — |

### POST /clients
**Response 201** → `ClientRead`

### GET /clients
**Response 200** → `ClientRead[]`

### GET /clients/{id}
**Response 200** → `ClientRead`  **Errors:** `404`

### PATCH /clients/{id}
All fields optional.
**Response 200** → `ClientRead`  **Errors:** `404`

### DELETE /clients/{id}
**Response 204**  **Errors:** `404`

#### ClientRead schema
```json
{
  "id": 1,
  "name": "Jan",
  "surname": "Kowalski",
  "phone": "+48 600 000 000",
  "email": "jan@example.com",
  "created_at": "2026-03-21T10:00:00"
}
```

---

## Doctors

Same CRUD shape as Clients. Prefix: `/doctors`.

---

## Workers

Same CRUD shape as Clients. Prefix: `/workers`.

---

## Visits

### POST /visits
Create a visit.

**Body**
```json
{
  "client_id": 1,
  "date": "2026-04-15T10:00:00",
  "doctor_ids": [1, 2],
  "worker_ids": [3],
  "services_provided": "Filling, X-ray",
  "comments": "Patient anxious",
  "price": "250.00",
  "status": "scheduled"
}
```

| Field | Type | Default |
|-------|------|---------|
| `client_id` | int | required |
| `date` | datetime (ISO 8601) | required |
| `doctor_ids` | int[] | `[]` |
| `worker_ids` | int[] | `[]` |
| `services_provided` | string | null |
| `comments` | string | null |
| `price` | decimal string | `"0"` |
| `status` | `VisitStatus` | `"scheduled"` |

**Response 201** → `VisitRead`
**Errors:** `404` client not found

### GET /visits
List visits with optional filters.

**Query parameters** (all optional)
| Param | Type | Description |
|-------|------|-------------|
| `date_from` | `YYYY-MM-DD` | inclusive lower bound on `date` |
| `date_to` | `YYYY-MM-DD` | inclusive upper bound on `date` |
| `client_id` | int | filter by client |
| `doctor_id` | int | filter by assigned doctor |
| `status` | `VisitStatus` | filter by status |

**Response 200** → `VisitRead[]`

### GET /visits/{id}
**Response 200** → `VisitRead`  **Errors:** `404`

### PATCH /visits/{id}
Update any visit fields. Pass only the fields to change.

**Body** (all optional)
```json
{
  "status": "completed",
  "price": "300.00",
  "doctor_ids": [1],
  "worker_ids": []
}
```

**Response 200** → `VisitRead`  **Errors:** `404`

### DELETE /visits/{id}
**Response 204**  **Errors:** `404`

#### VisitStatus values
| Value | Meaning |
|-------|---------|
| `scheduled` | Upcoming appointment |
| `completed` | Visit finished |
| `cancelled` | Cancelled by clinic or patient |
| `no_show` | Patient did not attend |

#### VisitRead schema
```json
{
  "id": 1,
  "client_id": 1,
  "date": "2026-04-15T10:00:00",
  "services_provided": "Filling",
  "comments": null,
  "price": "250.00",
  "status": "completed",
  "created_at": "2026-03-21T09:00:00",
  "doctors": [
    { "id": 1, "name": "Adam", "surname": "Nowak", "phone": null, "email": null, "created_at": "..." }
  ],
  "workers": []
}
```

---

## Reports

### POST /report
Generate a PDF report of visits matching the given filters.

**Body** (all optional)
```json
{
  "date_from": "2026-04-01",
  "date_to": "2026-04-30",
  "client_id": 1,
  "doctor_id": 2
}
```

**Response 200**
`Content-Type: application/pdf`
`Content-Disposition: attachment; filename=report.pdf`

The PDF contains a table with columns: Date, Client, Doctors, Services, Status, Price — and a totals row.

---

## Dashboard

### GET /dashboard/stats
Aggregated statistics for the current day and month, computed at request time.

**Response 200**
```json
{
  "total_visits_today": 3,
  "total_visits_this_month": 47,
  "revenue_today": "750.00",
  "revenue_this_month": "12350.00",
  "total_clients": 128,
  "visits_by_status": {
    "scheduled": 12,
    "completed": 30,
    "cancelled": 3,
    "no_show": 2
  }
}
```

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `204` | No Content (successful delete) |
| `401` | Unauthorized — missing or expired token |
| `404` | Resource not found |
| `409` | Conflict — e.g. duplicate username |
| `422` | Validation error — malformed request body |
