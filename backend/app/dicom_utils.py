import os
import random
import string
from pathlib import Path
from typing import List
import pydicom
from pydicom.dataset import Dataset
from app.database import settings

def generate_study_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(8))

def save_dicom_files(files: List[bytes], centre_name: str, study_id: str) -> tuple[str, int]:
    study_path = Path(settings.STORAGE_PATH) / centre_name / study_id
    study_path.mkdir(parents=True, exist_ok=True)
    
    num_saved = 0
    for idx, file_data in enumerate(files):
        try:
            ds = pydicom.dcmread(pydicom.filebase.DicomBytesIO(file_data))
            file_path = study_path / f"instance_{idx:04d}.dcm"
            ds.save_as(file_path)
            num_saved += 1
        except Exception as e:
            print(f"Error saving DICOM file {idx}: {e}")
            continue
    
    return str(study_path), num_saved

def read_dicom_file(file_path: str) -> Dataset:
    return pydicom.dcmread(file_path)

def get_dicom_metadata(file_path: str) -> dict:
    ds = read_dicom_file(file_path)
    metadata = {
        "patient_name": str(ds.get("PatientName", "")),
        "patient_id": str(ds.get("PatientID", "")),
        "study_date": str(ds.get("StudyDate", "")),
        "modality": str(ds.get("Modality", "")),
        "study_description": str(ds.get("StudyDescription", "")),
    }
    return metadata

def list_dicom_files(study_path: str) -> List[str]:
    path = Path(study_path)
    if not path.exists():
        return []
    return [str(f) for f in path.glob("*.dcm")]
