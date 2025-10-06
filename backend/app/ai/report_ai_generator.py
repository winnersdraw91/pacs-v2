from typing import Dict, List, Optional
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class MedicalReportGenerator:
    
    def __init__(self, model_name: str = "BioMistral/BioMistral-7B"):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Initializing Medical Report Generator on {self.device}")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                "meta-llama/Llama-2-7b-chat-hf",
                trust_remote_code=True
            )
            self.model = None
            self.model_loaded = False
            logger.info("Report generator initialized (model will load on first use)")
        except Exception as e:
            logger.warning(f"Could not load model: {e}. Using template-based generation.")
            self.tokenizer = None
            self.model = None
            self.model_loaded = False
    
    def _load_model_if_needed(self):
        if not self.model_loaded and self.tokenizer is not None:
            try:
                self.model = AutoModelForCausalLM.from_pretrained(
                    "meta-llama/Llama-2-7b-chat-hf",
                    torch_dtype=torch.float16 if self.device.type == 'cuda' else torch.float32,
                    device_map="auto" if self.device.type == 'cuda' else None,
                    trust_remote_code=True
                )
                self.model_loaded = True
                logger.info("Model loaded successfully")
            except Exception as e:
                logger.warning(f"Could not load model: {e}")
                self.model_loaded = False
    
    def generate_report_from_ai_findings(
        self,
        modality: str,
        findings: List[Dict],
        anatomical_structures: List[Dict],
        patient_info: Dict,
        study_description: str = ""
    ) -> Dict:
        try:
            if self.model is not None:
                self._load_model_if_needed()
            
            if self.model_loaded and self.model is not None:
                report = self._generate_with_llm(
                    modality, findings, anatomical_structures, patient_info, study_description
                )
            else:
                report = self._generate_template_based(
                    modality, findings, anatomical_structures, patient_info, study_description
                )
            
            return {
                "success": True,
                "report": report,
                "generated_at": datetime.utcnow().isoformat(),
                "method": "llm" if self.model_loaded else "template"
            }
        except Exception as e:
            logger.error(f"Error generating report: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_with_llm(
        self,
        modality: str,
        findings: List[Dict],
        anatomical_structures: List[Dict],
        patient_info: Dict,
        study_description: str
    ) -> Dict:
        findings_text = "\n".join([
            f"- {f.get('type', 'Unknown')}: {f.get('description', '')} (Confidence: {f.get('confidence', 0):.2f})"
            for f in findings
        ])
        
        structures_text = "\n".join([
            f"- Structure at {s.get('centroid', 'unknown location')}, Area: {s.get('area', 0)} pixels"
            for s in anatomical_structures[:5]
        ])
        
        prompt = f"""As a medical imaging AI assistant, generate a structured radiology report based on the following information:

Modality: {modality}
Study Description: {study_description}
Patient Age: {patient_info.get('age', 'Unknown')}
Patient Gender: {patient_info.get('gender', 'Unknown')}

Anatomical Structures Detected:
{structures_text}

AI-Detected Findings:
{findings_text}

Please provide a structured report with the following sections:
1. CLINICAL INDICATION
2. TECHNIQUE
3. FINDINGS
4. IMPRESSION

Format the response as a professional radiology report."""

        inputs = self.tokenizer(prompt, return_tensors="pt", max_length=2048, truncation=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.7,
                do_sample=True,
                top_p=0.9
            )
        
        report_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return self._parse_report_sections(report_text)
    
    def _generate_template_based(
        self,
        modality: str,
        findings: List[Dict],
        anatomical_structures: List[Dict],
        patient_info: Dict,
        study_description: str
    ) -> Dict:
        clinical_indication = study_description or f"{modality} imaging study for diagnostic evaluation"
        
        technique = self._generate_technique_section(modality)
        
        findings_section = self._generate_findings_section(
            modality, findings, anatomical_structures
        )
        
        impression = self._generate_impression_section(findings)
        
        return {
            "clinical_indication": clinical_indication,
            "technique": technique,
            "findings": findings_section,
            "impression": impression,
            "recommendations": self._generate_recommendations(findings),
            "ai_confidence": self._calculate_overall_confidence(findings)
        }
    
    def _generate_technique_section(self, modality: str) -> str:
        techniques = {
            "CT": "Non-contrast CT examination of the specified region was performed with multiplanar reformations. Images were acquired with standard radiation dose optimization.",
            "MRI": "MRI examination was performed using standard imaging sequences including T1-weighted, T2-weighted, and FLAIR sequences as appropriate.",
            "XR": "Digital radiographic images were obtained in standard projections.",
            "US": "Real-time ultrasound examination was performed using appropriate transducer selection.",
            "PET": "PET-CT examination was performed following standard imaging protocols."
        }
        return techniques.get(modality.upper(), f"{modality} imaging was performed according to standard departmental protocols.")
    
    def _generate_findings_section(
        self,
        modality: str,
        findings: List[Dict],
        anatomical_structures: List[Dict]
    ) -> str:
        if not findings and not anatomical_structures:
            return "The examination demonstrates normal anatomical structures without significant abnormalities detected by automated analysis."
        
        findings_text = []
        
        if anatomical_structures:
            findings_text.append(
                f"Anatomical structures are visualized. {len(anatomical_structures)} distinct regions identified with normal morphology."
            )
        
        if findings:
            for finding in findings:
                finding_type = finding.get('type', 'Unknown finding')
                description = finding.get('description', '')
                confidence = finding.get('confidence', 0)
                location = finding.get('location', 'unspecified location')
                
                if confidence >= 0.7:
                    findings_text.append(
                        f"{description} in {location} (AI detection confidence: {confidence:.1%})."
                    )
                elif confidence >= 0.5:
                    findings_text.append(
                        f"Possible {description.lower()} in {location} (AI detection confidence: {confidence:.1%}). Clinical correlation recommended."
                    )
        
        if not findings_text:
            findings_text.append("No significant abnormalities detected by automated image analysis.")
        
        return " ".join(findings_text)
    
    def _generate_impression_section(self, findings: List[Dict]) -> str:
        if not findings:
            return "No acute abnormalities detected by AI analysis. Normal examination. Clinical correlation advised for final interpretation."
        
        high_confidence_findings = [f for f in findings if f.get('confidence', 0) >= 0.7]
        
        if high_confidence_findings:
            impression_parts = []
            for finding in high_confidence_findings[:3]:
                impression_parts.append(finding.get('description', 'Abnormality detected'))
            
            impression = ". ".join(impression_parts) + "."
            impression += " Radiologist review and clinical correlation recommended."
            return impression
        else:
            return "Several areas flagged for radiologist review. Clinical correlation and expert interpretation recommended."
    
    def _generate_recommendations(self, findings: List[Dict]) -> str:
        if not findings:
            return "No immediate follow-up recommended based on AI analysis. Routine clinical management."
        
        high_severity = any(f.get('severity', '') == 'high' for f in findings)
        moderate_severity = any(f.get('severity', '') == 'moderate' for f in findings)
        
        if high_severity:
            return "Recommend urgent radiologist review and clinical correlation. Consider appropriate clinical follow-up as indicated."
        elif moderate_severity:
            return "Recommend radiologist review and clinical correlation. Follow-up as clinically indicated."
        else:
            return "Routine radiologist review recommended. Clinical correlation as needed."
    
    def _calculate_overall_confidence(self, findings: List[Dict]) -> float:
        if not findings:
            return 0.9
        
        confidences = [f.get('confidence', 0.5) for f in findings]
        return sum(confidences) / len(confidences) if confidences else 0.5
    
    def _parse_report_sections(self, report_text: str) -> Dict:
        sections = {
            "clinical_indication": "",
            "technique": "",
            "findings": "",
            "impression": "",
            "recommendations": "Radiologist review recommended.",
            "ai_confidence": 0.75
        }
        
        lines = report_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if 'CLINICAL INDICATION' in line.upper():
                current_section = 'clinical_indication'
            elif 'TECHNIQUE' in line.upper():
                current_section = 'technique'
            elif 'FINDINGS' in line.upper():
                current_section = 'findings'
            elif 'IMPRESSION' in line.upper():
                current_section = 'impression'
            elif current_section and line:
                sections[current_section] += line + " "
        
        for key in sections:
            if isinstance(sections[key], str):
                sections[key] = sections[key].strip()
        
        return sections
    
    def enhance_radiologist_draft(
        self,
        draft_report: Dict,
        ai_findings: List[Dict]
    ) -> Dict:
        try:
            enhanced_findings = draft_report.get('findings', '')
            
            missed_findings = []
            for ai_finding in ai_findings:
                if ai_finding.get('confidence', 0) >= 0.6:
                    finding_desc = ai_finding.get('description', '')
                    if finding_desc.lower() not in enhanced_findings.lower():
                        missed_findings.append(ai_finding)
            
            if missed_findings:
                suggestions = "\n\nAI-Detected Additional Findings for Consideration:\n"
                for finding in missed_findings[:3]:
                    suggestions += f"- {finding.get('description', '')} (Confidence: {finding.get('confidence', 0):.1%})\n"
                
                enhanced_findings += suggestions
            
            return {
                "success": True,
                "enhanced_report": {
                    **draft_report,
                    "findings": enhanced_findings,
                    "ai_assisted": True
                },
                "suggestions_added": len(missed_findings)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
