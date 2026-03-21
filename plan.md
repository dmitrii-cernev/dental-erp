I want to build a simple ERP system for a dental clinic.

## Requirements

### Functional

- doctors can save patient visits
- store and manage workers, clients
- export PDF reports
- filter visits by date, clients etc.
- have dashboards with quick reports about revenues, clients etc.
- support Polish language(later)

### Nonfunctional

- The load is pretty small, ~2-5 DAU
- it should be generally available
- **highly durable** - we can't loose any data

## Data Models

### User

- username
- password
- role(optional)

### Client

- name/surname
- phone number
- email

### Doctors

- name/surname
- phone number
- email

### Workers

- name/surname
- phone number
- email

### Visits

- client
- doctors
- workers
- date
- services provided
- comments
- price
- status

  Should we merge the "people" entities in DB?

## API

- CRUD for each entity
- `POST /report?filters` -> generate a PDF report
- `GET /visits?filters` -> search visits
- standard login/logout

## High-level architecture

We better keep it simple.
The user login to the service, and will have access to all features.
We will have just one DB and one service that will handle everything.
The service will include the PDF creation too.
Use modular monolith architecture.

## Deep dive

Again, keep it simple. We can use monorepo for this case.
For DB we can use SQLite.
We can use Python as backend language and React for frontend.
We should think about backups. Maybe some AWS S3? Push there all updates?
However, I plan to deploy it on-prem with Docker Containers.
