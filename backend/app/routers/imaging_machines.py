from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_active_user
from app.models import ImagingMachine, User, UserRole
from app.schemas import (
    ImagingMachine as ImagingMachineSchema,
    ImagingMachineCreate,
    ImagingMachineUpdate
)

router = APIRouter(prefix="/imaging-machines", tags=["imaging-machines"])

@router.post("/", response_model=ImagingMachineSchema)
async def create_imaging_machine(
    machine: ImagingMachineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.DIAGNOSTIC_CENTRE]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role == UserRole.DIAGNOSTIC_CENTRE and current_user.centre_id != machine.centre_id:
        raise HTTPException(status_code=403, detail="Not authorized to create machines for other centres")
    
    db_machine = ImagingMachine(**machine.dict())
    db.add(db_machine)
    db.commit()
    db.refresh(db_machine)
    return db_machine

@router.get("/", response_model=List[ImagingMachineSchema])
async def list_imaging_machines(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(ImagingMachine)
    
    if current_user.role == UserRole.DIAGNOSTIC_CENTRE:
        if not current_user.centre_id:
            raise HTTPException(status_code=400, detail="User not associated with a centre")
        query = query.filter(ImagingMachine.centre_id == current_user.centre_id)
    
    machines = query.offset(skip).limit(limit).all()
    return machines

@router.get("/{machine_id}", response_model=ImagingMachineSchema)
async def get_imaging_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    machine = db.query(ImagingMachine).filter(ImagingMachine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Imaging machine not found")
    
    if current_user.role == UserRole.DIAGNOSTIC_CENTRE and current_user.centre_id != machine.centre_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return machine

@router.patch("/{machine_id}", response_model=ImagingMachineSchema)
async def update_imaging_machine(
    machine_id: int,
    machine_update: ImagingMachineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    machine = db.query(ImagingMachine).filter(ImagingMachine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Imaging machine not found")
    
    if current_user.role == UserRole.DIAGNOSTIC_CENTRE and current_user.centre_id != machine.centre_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in machine_update.dict(exclude_unset=True).items():
        setattr(machine, key, value)
    
    db.commit()
    db.refresh(machine)
    return machine

@router.delete("/{machine_id}")
async def delete_imaging_machine(
    machine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    machine = db.query(ImagingMachine).filter(ImagingMachine.id == machine_id).first()
    if not machine:
        raise HTTPException(status_code=404, detail="Imaging machine not found")
    
    if current_user.role == UserRole.DIAGNOSTIC_CENTRE and current_user.centre_id != machine.centre_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(machine)
    db.commit()
    return {"message": "Imaging machine deleted successfully"}
