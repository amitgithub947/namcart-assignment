from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Note
from app.schemas import Note as NoteSchema

router = APIRouter()

@router.get("/{slug}", response_model=NoteSchema)
def get_public_note(slug: str, db: Session = Depends(get_db)):
    note = db.query(Note).filter(
        Note.public_slug == slug,
        Note.is_public == True
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found or not public"
        )
    
    # Check if note has expired
    if note.share_expires_at and note.share_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note has expired"
        )
    
    return note