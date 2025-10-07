from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app.models import Report, Study, User, UserRole, StudyStatus
from app.schemas import Report as ReportSchema, ReportCreate

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/", response_model=ReportSchema)
async def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.RADIOLOGIST, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create reports")
    
    study = db.query(Study).filter(Study.id == report.study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    db_report = Report(
        study_id=report.study_id,
        findings=report.findings,
        impression=report.impression,
        report_type=report.report_type,
        is_ai_generated=report.is_ai_generated,
        created_by_id=current_user.id
    )
    
    db.add(db_report)
    study.status = StudyStatus.REPORT_GENERATED
    db.commit()
    db.refresh(db_report)
    
    return db_report

@router.get("/", response_model=List[ReportSchema])
async def list_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Report)
    
    if current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.TECHNICIAN]:
        if not current_user.centre_id:
            return []
        query = query.join(Study).filter(Study.centre_id == current_user.centre_id)
    
    reports = query.offset(skip).limit(limit).all()
    return reports

@router.get("/{report_id}", response_model=ReportSchema)
async def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.TECHNICIAN]:
        study = db.query(Study).filter(Study.id == report.study_id).first()
        if study and study.centre_id != current_user.centre_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this report")
    
    return report

@router.patch("/{report_id}/verify", response_model=ReportSchema)
async def verify_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RADIOLOGIST, UserRole.ADMIN]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.is_verified = True
    report.verified_by_id = current_user.id
    from datetime import datetime
    report.verified_at = datetime.utcnow()
    
    study = db.query(Study).filter(Study.id == report.study_id).first()
    if study:
        study.status = StudyStatus.VERIFIED
    
    db.commit()
    db.refresh(report)
    return report

@router.patch("/{report_id}", response_model=ReportSchema)
async def update_report(
    report_id: int,
    report_update: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.RADIOLOGIST, UserRole.ADMIN]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    for key, value in report_update.dict(exclude_unset=True).items():
        setattr(report, key, value)
    
    db.commit()
    db.refresh(report)
    return report
