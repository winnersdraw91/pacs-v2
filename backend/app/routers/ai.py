from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app.models import Study, Report, User, UserRole, StudyStatus
from app.dicom_utils import list_dicom_files
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

try:
    from app.ai.image_processor import MONAIImageProcessor
    from app.ai.torchio_processor import TorchIOProcessor
    from app.ai.report_ai_generator import MedicalReportGenerator
    
    monai_processor = MONAIImageProcessor()
    torchio_processor = TorchIOProcessor()
    report_generator = MedicalReportGenerator()
    AI_AVAILABLE = True
    logger.info("AI modules loaded successfully")
except ImportError as e:
    logger.warning(f"AI modules not available: {e}. AI functionality will be disabled.")
    AI_AVAILABLE = False
    monai_processor = None
    torchio_processor = None
    report_generator = None

def process_study_with_ai(study_id: int, db: Session):
    if not AI_AVAILABLE:
        logger.warning("AI processing skipped - AI modules not available")
        return
    
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
        
        preprocessing_result = monai_processor.preprocess_dicom_with_monai(first_file)
        if not preprocessing_result.get('success'):
            logger.error(f"Preprocessing failed: {preprocessing_result.get('error')}")
            return
        
        tensor = preprocessing_result['tensor']
        metadata = preprocessing_result['metadata']
        
        anatomical_analysis = monai_processor.detect_anatomical_structures(tensor)
        pathology_analysis = monai_processor.analyze_pathology_features(
            tensor, 
            metadata.get('modality', study.modality.value)
        )
        
        patient_info = {
            "age": study.patient_age,
            "gender": study.patient_gender,
            "name": study.patient_name
        }
        
        report_result = report_generator.generate_report_from_ai_findings(
            modality=study.modality.value,
            findings=pathology_analysis.get('findings', []),
            anatomical_structures=anatomical_analysis.get('structures', []),
            patient_info=patient_info,
            study_description=study.study_description or ""
        )
        
        if report_result.get('success'):
            ai_report_data = report_result['report']
            
            existing_ai_report = db.query(Report).filter(
                Report.study_id == study_id,
                Report.is_ai_generated == True
            ).first()
            
            if existing_ai_report:
                existing_ai_report.findings = ai_report_data.get('findings', '')
                existing_ai_report.impression = ai_report_data.get('impression', '')
            else:
                ai_report = Report(
                    study_id=study_id,
                    findings=ai_report_data.get('findings', ''),
                    impression=ai_report_data.get('impression', ''),
                    report_type="AI Preliminary Report",
                    is_ai_generated=True,
                    is_verified=False
                )
                db.add(ai_report)
            db.commit()
    except Exception as e:
        logger.error(f"Error processing study with AI: {e}")
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

@router.post("/analyze-study/{study_id}")
async def analyze_study_with_ai(
    study_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not AI_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="AI functionality not available. AI dependencies not installed."
        )
    
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    if current_user.role not in [UserRole.RADIOLOGIST, UserRole.ADMIN]:
        if current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.TECHNICIAN]:
            if study.centre_id != current_user.centre_id:
                raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        dicom_files = list_dicom_files(study.dicom_files_path)
        if not dicom_files:
            raise HTTPException(status_code=404, detail="No DICOM files found")
        
        first_file = dicom_files[0]
        preprocessing_result = monai_processor.preprocess_dicom_with_monai(first_file)
        
        if not preprocessing_result.get('success'):
            raise HTTPException(
                status_code=500, 
                detail=f"Preprocessing failed: {preprocessing_result.get('error')}"
            )
        
        tensor = preprocessing_result['tensor']
        metadata = preprocessing_result['metadata']
        
        anatomical_analysis = monai_processor.detect_anatomical_structures(tensor)
        pathology_analysis = monai_processor.analyze_pathology_features(
            tensor, 
            metadata.get('modality', study.modality.value)
        )
        
        torchio_result = torchio_processor.process_3d_volume(dicom_files[:5])
        
        return {
            "study_id": study_id,
            "analysis_complete": True,
            "preprocessing": {
                "success": True,
                "image_shape": list(preprocessing_result.get('metadata', {}).get('image_shape', [])),
                "device": preprocessing_result.get('device')
            },
            "anatomical_structures": anatomical_analysis,
            "pathology_findings": pathology_analysis,
            "torchio_processing": torchio_result
        }
    except Exception as e:
        logger.error(f"Error in AI analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

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
