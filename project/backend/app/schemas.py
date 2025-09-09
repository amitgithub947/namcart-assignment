from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

# User schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class User(UserBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Note schemas
class NoteBase(BaseModel):
    title: str = ""
    content: str = ""

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_archived: Optional[bool] = None

class ShareNoteRequest(BaseModel):
    expires_in_hours: Optional[int] = None

class ShareNoteResponse(BaseModel):
    public_url: str

class Note(NoteBase):
    id: uuid.UUID
    is_archived: bool
    is_public: bool
    public_slug: Optional[str]
    share_expires_at: Optional[datetime]
    version: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None