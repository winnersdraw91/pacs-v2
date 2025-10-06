from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pydicom
import numpy as np
from PIL import Image
import torch
import torchio as tio
from monai.transforms import (
    Compose, Resize, NormalizeIntensity, ToTensor, 
    RandRotate90, RandFlip, RandGaussianNoise
)
from monai.networks.nets import BasicUNet
from monai.data import MetaTensor
import cv2
from skimage import measure, morphology

class MONAIImageProcessor:
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.preprocessing_transforms = Compose([
            ToTensor(),
            Resize((256, 256)),
            NormalizeIntensity(nonzero=True),
        ])
        
        self.augmentation_transforms = Compose([
            RandRotate90(prob=0.3, spatial_axes=(0, 1)),
            RandFlip(prob=0.3, spatial_axis=0),
            RandGaussianNoise(prob=0.3, std=0.1)
        ])
    
    def preprocess_dicom_with_monai(self, file_path: str) -> Dict:
        try:
            ds = pydicom.dcmread(file_path)
            pixel_array = ds.pixel_array
            
            if len(pixel_array.shape) == 2:
                pixel_array = np.expand_dims(pixel_array, axis=0)
            
            tensor = self.preprocessing_transforms(pixel_array)
            
            metadata = {
                "modality": str(ds.get("Modality", "")),
                "study_description": str(ds.get("StudyDescription", "")),
                "series_description": str(ds.get("SeriesDescription", "")),
                "patient_position": str(ds.get("PatientPosition", "")),
                "image_shape": tensor.shape,
                "spacing": getattr(ds, 'PixelSpacing', None),
                "slice_thickness": getattr(ds, 'SliceThickness', None),
            }
            
            return {
                "success": True,
                "tensor": tensor,
                "metadata": metadata,
                "device": str(self.device)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def detect_anatomical_structures(self, tensor: torch.Tensor) -> Dict:
        try:
            if len(tensor.shape) == 3:
                tensor = tensor.unsqueeze(0)
            
            tensor = tensor.to(self.device)
            
            with torch.no_grad():
                binary_mask = tensor > tensor.mean()
                
                connected_components = measure.label(binary_mask.cpu().numpy().squeeze())
                regions = measure.regionprops(connected_components)
                
                structures = []
                for region in regions[:5]:
                    if region.area > 100:
                        structures.append({
                            "area": int(region.area),
                            "centroid": [float(x) for x in region.centroid],
                            "bbox": [int(x) for x in region.bbox],
                            "eccentricity": float(region.eccentricity)
                        })
                
                return {
                    "success": True,
                    "structures_detected": len(structures),
                    "structures": structures,
                    "processed_shape": list(tensor.shape)
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def analyze_pathology_features(self, tensor: torch.Tensor, modality: str) -> Dict:
        try:
            tensor_np = tensor.cpu().numpy().squeeze() if isinstance(tensor, torch.Tensor) else tensor
            
            findings = []
            
            mean_intensity = float(np.mean(tensor_np))
            std_intensity = float(np.std(tensor_np))
            
            high_intensity_regions = np.sum(tensor_np > (mean_intensity + 2 * std_intensity))
            low_intensity_regions = np.sum(tensor_np < (mean_intensity - 2 * std_intensity))
            
            if modality.upper() == 'CT':
                if high_intensity_regions > tensor_np.size * 0.05:
                    findings.append({
                        "type": "high_density_regions",
                        "description": "Multiple high-density areas identified",
                        "confidence": 0.75,
                        "location": "distributed"
                    })
                
                if low_intensity_regions > tensor_np.size * 0.1:
                    findings.append({
                        "type": "hypodense_areas", 
                        "description": "Hypodense regions detected",
                        "confidence": 0.65,
                        "location": "various"
                    })
            
            elif modality.upper() in ['MR', 'MRI']:
                gradient_magnitude = np.gradient(tensor_np)
                edge_strength = np.mean(np.abs(gradient_magnitude[0]) + np.abs(gradient_magnitude[1]))
                
                if edge_strength > np.mean(tensor_np) * 0.3:
                    findings.append({
                        "type": "tissue_contrast_changes",
                        "description": "Enhanced tissue contrast variations",
                        "confidence": 0.70,
                        "location": "multiple_regions"
                    })
            
            return {
                "success": True,
                "modality": modality,
                "findings": findings,
                "statistics": {
                    "mean_intensity": mean_intensity,
                    "std_intensity": std_intensity,
                    "high_intensity_pixels": int(high_intensity_regions),
                    "low_intensity_pixels": int(low_intensity_regions)
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
