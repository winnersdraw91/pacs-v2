from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import require_role
from app.models import DiagnosticCentre, UserRole, User
from app.schemas import DiagnosticCentre as DiagnosticCentreSchema, DiagnosticCentreCreate, DiagnosticCentreUpdate

router = APIRouter(prefix="/centres", tags=["centres"])

@router.post("/", response_model=DiagnosticCentreSchema)
async def create_centre(
    centre: DiagnosticCentreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    db_centre = db.query(DiagnosticCentre).filter(DiagnosticCentre.name == centre.name).first()
    if db_centre:
        raise HTTPException(status_code=400, detail="Centre name already exists")
    
    db_centre = DiagnosticCentre(**centre.dict())
    db.add(db_centre)
    db.commit()
    db.refresh(db_centre)
    return db_centre

@router.get("/", response_model=List[DiagnosticCentreSchema])
async def list_centres(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.RADIOLOGIST]))
):
    centres = db.query(DiagnosticCentre).offset(skip).limit(limit).all()
    return centres

@router.get("/{centre_id}", response_model=DiagnosticCentreSchema)
async def get_centre(
    centre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DIAGNOSTIC_CENTRE, UserRole.RADIOLOGIST]))
):
    centre = db.query(DiagnosticCentre).filter(DiagnosticCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    return centre

@router.patch("/{centre_id}", response_model=DiagnosticCentreSchema)
async def update_centre(
    centre_id: int,
    centre_update: DiagnosticCentreUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    centre = db.query(DiagnosticCentre).filter(DiagnosticCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    for key, value in centre_update.dict(exclude_unset=True).items():
        setattr(centre, key, value)
    
    db.commit()
    db.refresh(centre)
    return centre

@router.delete("/{centre_id}")
async def delete_centre(
    centre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    centre = db.query(DiagnosticCentre).filter(DiagnosticCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    db.delete(centre)
    db.commit()
    return {"message": "Centre deleted successfully"}
