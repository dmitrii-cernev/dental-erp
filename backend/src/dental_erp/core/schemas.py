from pydantic import BaseModel, EmailStr


class PersonBase(BaseModel):
    name: str
    surname: str
    phone: str | None = None
    email: EmailStr | None = None
