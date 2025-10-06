from pathlib import Path
from typing import Dict, List
import pydicom
import numpy as np
from PIL import Image

class ImageProcessor:
    
    @staticmethod
    def preprocess_dicom(file_path: str) -> Dict:
        try:
            ds = pydicom.dcmread(file_path)
            
            pixel_array = ds.pixel_array
            
            metadata = {
                "modality": str(ds.get("Modality", "")),
                "study_description": str(ds.get("StudyDescription", "")),
                "series_description": str(ds.get("SeriesDescription", "")),
                "patient_position": str(ds.get("PatientPosition", "")),
                "image_shape": pixel_array.shape if hasattr(pixel_array, 'shape') else None,
            }
            
            return {
                "success": True,
                "metadata": metadata,
                "pixel_array_shape": pixel_array.shape if hasattr(pixel_array, 'shape') else None
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def normalize_image(pixel_array: np.ndarray) -> np.ndarray:
        pixel_array = pixel_array.astype(np.float32)
        pixel_array = (pixel_array - pixel_array.min()) / (pixel_array.max() - pixel_array.min())
        return pixel_array
    
    @staticmethod
    def extract_thumbnail(file_path: str, size: tuple = (256, 256)) -> bytes:
        try:
            ds = pydicom.dcmread(file_path)
            pixel_array = ds.pixel_array
            
            normalized = ImageProcessor.normalize_image(pixel_array)
            img_8bit = (normalized * 255).astype(np.uint8)
            
            pil_img = Image.fromarray(img_8bit)
            pil_img.thumbnail(size, Image.Resampling.LANCZOS)
            
            from io import BytesIO
            buffer = BytesIO()
            pil_img.save(buffer, format='PNG')
            return buffer.getvalue()
        except Exception as e:
            raise Exception(f"Error extracting thumbnail: {e}")
