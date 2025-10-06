from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app.models import Study, User, UserRole, StudyStatus, Modality, DiagnosticCentre
from app.schemas import Study as StudySchema, StudyCreate
from app.dicom_utils import generate_study_id, save_dicom_files

router = APIRouter(prefix="/studies", tags=["studies"])

@router.post("/", response_model=StudySchema)
async def create_study(
    patient_name: str = Form(...),
    modality: Modality = Form(...),
    patient_age: Optional[int] = Form(None),
    patient_gender: Optional[str] = Form(None),
    study_type: Optional[str] = Form(None),
    study_description: Optional[str] = Form(None),
    is_urgent: bool = Form(False),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.TECHNICIAN, UserRole.DIAGNOSTIC_CENTRE, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to upload studies")
    
    centre_id = current_user.centre_id
    if not centre_id:
        raise HTTPException(status_code=400, detail="User not associated with a centre")
    
    centre = db.query(DiagnosticCentre).filter(DiagnosticCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    study_id = generate_study_id()
    while db.query(Study).filter(Study.study_id == study_id).first():
        study_id = generate_study_id()
    
    file_contents = []
    for file in files:
        content = await file.read()
        file_contents.append(content)
    
    dicom_path, num_instances = save_dicom_files(file_contents, centre.name, study_id)
    
    db_study = Study(
        study_id=study_id,
        patient_name=patient_name,
        patient_age=patient_age,
        patient_gender=patient_gender,
        modality=modality,
        study_type=study_type,
        study_description=study_description,
        is_urgent=is_urgent,
        centre_id=centre_id,
        created_by_id=current_user.id,
        dicom_files_path=dicom_path,
        num_instances=num_instances,
        status=StudyStatus.UPLOADED
    )
    
    db.add(db_study)
    db.commit()
    db.refresh(db_study)
    
    return db_study

@router.get("/", response_model=List[StudySchema])
async def list_studies(
    skip: int = 0,
    limit: int = 100,
    status: Optional[StudyStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Study)
    
    if current_user.role == UserRole.DIAGNOSTIC_CENTRE or current_user.role == UserRole.TECHNICIAN:
        if not current_user.centre_id:
            return []
        query = query.filter(Study.centre_id == current_user.centre_id)
    elif current_user.role == UserRole.RADIOLOGIST:
        pass
    
    if status:
        query = query.filter(Study.status == status)
    
    studies = query.offset(skip).limit(limit).all()
    return studies

@router.get("/{study_id}", response_model=StudySchema)
async def get_study(
    study_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    study = db.query(Study).filter(Study.study_id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    if current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.TECHNICIAN]:
        if study.centre_id != current_user.centre_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this study")
    
    return study

@router.post("/{study_id}/assign")
async def assign_study(
    study_id: str,
    radiologist_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    study = db.query(Study).filter(Study.study_id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    if current_user.role == UserRole.RADIOLOGIST:
        study.assigned_radiologist_id = current_user.id
        study.status = StudyStatus.ASSIGNED
    elif current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.ADMIN]:
        if not radiologist_id:
            raise HTTPException(status_code=400, detail="Radiologist ID required")
        radiologist = db.query(User).filter(User.id == radiologist_id, User.role == UserRole.RADIOLOGIST).first()
        if not radiologist:
            raise HTTPException(status_code=404, detail="Radiologist not found")
        study.assigned_radiologist_id = radiologist_id
        study.status = StudyStatus.ASSIGNED
    else:
        raise HTTPException(status_code=403, detail="Not authorized to assign studies")
    
    db.commit()
    db.refresh(study)
    return study

@router.patch("/{study_id}/status")
async def update_study_status(
    study_id: str,
    status: StudyStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    study = db.query(Study).filter(Study.study_id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    study.status = status
    db.commit()
    db.refresh(study)
    return study
