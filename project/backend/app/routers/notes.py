from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import secrets
import string
from app.database import get_db
from app.models import User, Note
from app.schemas import Note as NoteSchema, NoteCreate, NoteUpdate, ShareNoteRequest, ShareNoteResponse
from app.dependencies import get_current_user

router = APIRouter()

def generate_slug() -> str:
    """Generate a random slug for public sharing"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(12))

@router.get("/notes", response_model=List[NoteSchema])
def get_notes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = db.query(Note).filter(Note.owner_id == current_user.id).order_by(Note.updated_at.desc()).all()
    return notes

@router.post("/notes", response_model=NoteSchema)
def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_note = Note(
        title=note_data.title,
        content=note_data.content,
        owner_id=current_user.id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@router.get("/notes/{note_id}", response_model=NoteSchema)
def get_note(
    note_id: str,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.owner_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Set ETag header for concurrency control
    response.headers["ETag"] = f'"{note.version}"'
    return note

@router.put("/notes/{note_id}", response_model=NoteSchema)
def update_note(
    note_id: str,
    note_data: NoteUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.owner_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Check If-Match header for optimistic concurrency control
    if_match = request.headers.get("If-Match")
    if if_match:
        expected_version = if_match.strip('"')
        if str(note.version) != expected_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Version conflict. Expected version {expected_version}, but current version is {note.version}",
            )
    
    # Update note fields
    update_data = note_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(note, field, value)
    
    # Increment version for concurrency control
    note.version += 1
    note.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(note)
    return note

@router.patch("/notes/{note_id}", response_model=NoteSchema)
def patch_note(
    note_id: str,
    note_data: NoteUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Same as PUT for this implementation
    return update_note(note_id, note_data, request, current_user, db)

@router.delete("/notes/{note_id}")
def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.owner_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}

@router.post("/notes/{note_id}/share", response_model=ShareNoteResponse)
def share_note(
    note_id: str,
    share_data: ShareNoteRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.owner_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    # Generate unique slug if not already public
    if not note.is_public or not note.public_slug:
        while True:
            slug = generate_slug()
            existing = db.query(Note).filter(Note.public_slug == slug).first()
            if not existing:
                note.public_slug = slug
                break
    
    # Set expiration if provided
    if share_data.expires_in_hours:
        note.share_expires_at = datetime.utcnow() + timedelta(hours=share_data.expires_in_hours)
    else:
        note.share_expires_at = None
    
    note.is_public = True
    note.version += 1
    note.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(note)
    
    # Build public URL
    base_url = str(request.base_url).rstrip('/')
    public_url = f"{base_url}/s/{note.public_slug}"
    
    return ShareNoteResponse(public_url=public_url)

@router.delete("/notes/{note_id}/share")
def unshare_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(Note).filter(
        Note.id == note_id,
        Note.owner_id == current_user.id
    ).first()
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    note.is_public = False
    note.public_slug = None
    note.share_expires_at = None
    note.version += 1
    note.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Note unshared successfully"}