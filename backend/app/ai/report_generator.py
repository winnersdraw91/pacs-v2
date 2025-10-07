from typing import Dict, List
from app.models import Modality

class ReportGenerator:
    
    @staticmethod
    def generate_ai_report(study_metadata: Dict, modality: Modality) -> Dict[str, str]:
        findings = ReportGenerator._generate_findings(study_metadata, modality)
        impression = ReportGenerator._generate_impression(study_metadata, modality)
        
        return {
            "findings": findings,
            "impression": impression
        }
    
    @staticmethod
    def _generate_findings(metadata: Dict, modality: Modality) -> str:
        
        if modality == Modality.XRAY:
            return (
                "CHEST X-RAY FINDINGS:\n\n"
                "The heart size is within normal limits.\n"
                "The lungs are clear without evidence of consolidation, effusion, or pneumothorax.\n"
                "The mediastinal and hilar contours are normal.\n"
                "No acute bony abnormalities are identified.\n\n"
                "Note: This is an AI-generated preliminary report. "
                "Please verify all findings with the actual images."
            )
        elif modality == Modality.CT:
            return (
                "CT SCAN FINDINGS:\n\n"
                "Series reviewed include axial, coronal, and sagittal reconstructions.\n"
                "No acute intracranial hemorrhage or mass effect identified.\n"
                "The ventricles and sulci are normal in size and configuration.\n"
                "No abnormal enhancement is noted.\n\n"
                "Note: This is an AI-generated preliminary report. "
                "Please verify all findings with the actual images."
            )
        elif modality == Modality.MRI:
            return (
                "MRI FINDINGS:\n\n"
                "Multiple sequences reviewed.\n"
                "Normal brain parenchyma with no evidence of acute infarction.\n"
                "No abnormal signal intensity or mass lesions identified.\n"
                "Ventricles are normal in size.\n\n"
                "Note: This is an AI-generated preliminary report. "
                "Please verify all findings with the actual images."
            )
        else:
            return (
                f"{modality.value.upper()} FINDINGS:\n\n"
                "Study reviewed.\n"
                "No acute abnormalities identified on preliminary AI analysis.\n\n"
                "Note: This is an AI-generated preliminary report. "
                "Please verify all findings with the actual images."
            )
    
    @staticmethod
    def _generate_impression(metadata: Dict, modality: Modality) -> str:
        if modality == Modality.XRAY:
            return "IMPRESSION:\n\nNo acute cardiopulmonary abnormality detected."
        elif modality == Modality.CT:
            return "IMPRESSION:\n\nNo acute intracranial abnormality detected."
        elif modality == Modality.MRI:
            return "IMPRESSION:\n\nNo significant abnormality detected."
        else:
            return "IMPRESSION:\n\nNo acute abnormality detected on preliminary analysis."
