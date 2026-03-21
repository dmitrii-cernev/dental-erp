from sqlalchemy.orm import Session

from dental_erp.clients.models import Client
from dental_erp.clients.schemas import ClientCreate, ClientUpdate


def create_client(db: Session, data: ClientCreate) -> Client:
    client = Client(**data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def get_client(db: Session, client_id: int) -> Client | None:
    return db.query(Client).filter(Client.id == client_id).first()


def list_clients(db: Session) -> list[Client]:
    return db.query(Client).all()


def update_client(db: Session, client: Client, data: ClientUpdate) -> Client:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)
    db.commit()
    db.refresh(client)
    return client


def delete_client(db: Session, client: Client) -> None:
    db.delete(client)
    db.commit()
