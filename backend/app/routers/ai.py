from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app.models import Study, Report, User, UserRole, StudyStatus
from app.ai.image_processor import ImageProcessor
from app.ai.report_generator import ReportGenerator
from app.dicom_utils import list_dicom_files

router = APIRouter(prefix="/ai", tags=["ai"])

def process_study_with_ai(study_id: int, db: Session):
    try:
        study = db.query(Study).filter(Study.id == study_id).first()
        if not study:
            return
        
        if not study.dicom_files_path:
            return
        
        dicom_files = list_dicom_files(study.dicom_files_path)
        if not dicom_files:
            return
        
        first_file = dicom_files[0]
        processed_data = ImageProcessor.preprocess_dicom(first_file)
        
        if processed_data.get("success"):
            metadata = processed_data.get("metadata", {})
            
            ai_report_data = ReportGenerator.generate_ai_report(metadata, study.modality)
            
            existing_ai_report = db.query(Report).filter(
                Report.study_id == study_id,
                Report.is_ai_generated == True
            ).first()
            
            if not existing_ai_report:
                ai_report = Report(
                    study_id=study_id,
                    findings=ai_report_data["findings"],
                    impression=ai_report_data["impression"],
                    report_type="AI Preliminary Report",
                    is_ai_generated=True,
                    is_verified=False
                )
                db.add(ai_report)
                db.commit()
    except Exception as e:
        print(f"Error processing study with AI: {e}")
        db.rollback()

@router.post("/process-study/{study_id}")
async def trigger_ai_processing(
    study_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.RADIOLOGIST, UserRole.TECHNICIAN]))
):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    background_tasks.add_task(process_study_with_ai, study_id, db)
    
    return {"message": "AI processing triggered", "study_id": study.study_id}

@router.get("/report/{study_id}")
async def get_ai_report(
    study_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    ai_report = db.query(Report).filter(
        Report.study_id == study_id,
        Report.is_ai_generated == True
    ).first()
    
    if not ai_report:
        raise HTTPException(status_code=404, detail="AI report not found")
    
    return ai_report
