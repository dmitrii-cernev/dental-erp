from sqlalchemy.orm import Session

from dental_erp.core.security import hash_password
from dental_erp.users.models import User
from dental_erp.users.schemas import UserCreate, UserUpdate


def create_user(db: Session, data: UserCreate) -> User:
    user = User(username=data.username, hashed_password=hash_password(data.password), role=data.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def list_users(db: Session) -> list[User]:
    return db.query(User).all()


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
