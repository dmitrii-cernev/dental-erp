from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from dental_erp.clients import service
from dental_erp.clients.schemas import ClientCreate, ClientRead, ClientUpdate
from dental_erp.core.database import get_db
from dental_erp.core.dependencies import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return service.create_client(db, data)


@router.get("", response_model=list[ClientRead])
def list_clients(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return service.list_clients(db)


@router.get("/{client_id}", response_model=ClientRead)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    client = service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    client = service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return service.update_client(db, client, data)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    client = service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    service.delete_client(db, client)
