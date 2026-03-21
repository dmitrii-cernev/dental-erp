from sqlalchemy.orm import Session

from dental_erp.core.security import verify_password
from dental_erp.users.models import User


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
