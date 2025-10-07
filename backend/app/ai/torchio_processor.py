import torchio as tio
import numpy as np
import torch
from typing import Dict, List, Optional, Tuple
import pydicom
from pathlib import Path

class TorchIOProcessor:
    
    def __init__(self):
        self.preprocessing_transform = tio.Compose([
            tio.RescaleIntensity((-1, 1)),
            tio.Resize((256, 256, 1)),
            tio.RandomNoise(p=0.3),
            tio.RandomFlip(axes=(0, 1), p=0.3),
        ])
        
        self.augmentation_transform = tio.Compose([
            tio.RandomAffine(
                scales=(0.9, 1.1),
                degrees=(-10, 10),
                translation=(-10, 10),
                p=0.5
            ),
            tio.RandomElasticDeformation(p=0.3),
            tio.RandomGamma(p=0.3),
        ])
    
    def process_3d_volume(self, file_paths: List[str]) -> Dict:
        try:
            if len(file_paths) == 1:
                ds = pydicom.dcmread(file_paths[0])
                pixel_array = ds.pixel_array
                
                if len(pixel_array.shape) == 2:
                    pixel_array = np.expand_dims(pixel_array, axis=-1)
                
                subject = tio.Subject(
                    image=tio.ScalarImage(tensor=torch.from_numpy(pixel_array).float().unsqueeze(0))
                )
            else:
                volumes = []
                for file_path in file_paths[:10]:
                    ds = pydicom.dcmread(file_path) 
                    volumes.append(ds.pixel_array)
                
                volume_3d = np.stack(volumes, axis=-1)
                subject = tio.Subject(
                    image=tio.ScalarImage(tensor=torch.from_numpy(volume_3d).float().unsqueeze(0))
                )
            
            transformed = self.preprocessing_transform(subject)
            
            return {
                "success": True,
                "processed_shape": transformed.image.data.shape,
                "spatial_shape": transformed.image.spatial_shape,
                "orientation": str(transformed.image.orientation),
                "spacing": transformed.image.spacing.tolist()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def extract_brain_regions(self, subject: tio.Subject) -> Dict:
        try:
            image_data = subject.image.data.squeeze()
            
            threshold = torch.quantile(image_data, 0.7)
            brain_mask = image_data > threshold
            
            regions = {}
            
            center = torch.tensor(image_data.shape) // 2
            center_region = image_data[
                center[0]-32:center[0]+32,
                center[1]-32:center[1]+32
            ]
            regions["central"] = {
                "mean_intensity": float(center_region.mean()),
                "volume": int(torch.sum(center_region > threshold)),
                "coordinates": center.tolist()
            }
            
            left_hemisphere = image_data[:, :image_data.shape[1]//2]
            right_hemisphere = image_data[:, image_data.shape[1]//2:]
            
            regions["left_hemisphere"] = {
                "mean_intensity": float(left_hemisphere.mean()),
                "volume": int(torch.sum(left_hemisphere > threshold))
            }
            
            regions["right_hemisphere"] = {
                "mean_intensity": float(right_hemisphere.mean()), 
                "volume": int(torch.sum(right_hemisphere > threshold))
            }
            
            asymmetry_score = abs(regions["left_hemisphere"]["mean_intensity"] - 
                                regions["right_hemisphere"]["mean_intensity"])
            
            return {
                "success": True,
                "regions": regions,
                "asymmetry_score": float(asymmetry_score),
                "total_brain_volume": int(torch.sum(brain_mask))
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def detect_anomalies(self, subject: tio.Subject, modality: str = "CT") -> Dict:
        try:
            image_data = subject.image.data.squeeze()
            
            anomalies = []
            
            mean_val = torch.mean(image_data)
            std_val = torch.std(image_data)
            
            outlier_mask = torch.abs(image_data - mean_val) > 3 * std_val
            outlier_regions = torch.nonzero(outlier_mask)
            
            if len(outlier_regions) > 100:
                anomalies.append({
                    "type": "intensity_outliers",
                    "description": f"Detected {len(outlier_regions)} pixels with unusual intensity values",
                    "severity": "moderate" if len(outlier_regions) < 1000 else "high",
                    "modality": modality
                })
            
            gradient_x = torch.diff(image_data, dim=0, prepend=image_data[:1])
            gradient_y = torch.diff(image_data, dim=1, prepend=image_data[:, :1])
            gradient_magnitude = torch.sqrt(gradient_x**2 + gradient_y**2)
            
            edge_threshold = torch.quantile(gradient_magnitude, 0.95)
            strong_edges = gradient_magnitude > edge_threshold
            
            if torch.sum(strong_edges) > image_data.numel() * 0.05:
                anomalies.append({
                    "type": "enhanced_edges",
                    "description": "Areas with significantly enhanced edge definition detected",
                    "severity": "low",
                    "modality": modality
                })
            
            return {
                "success": True,
                "anomalies": anomalies,
                "statistics": {
                    "mean_intensity": float(mean_val),
                    "std_intensity": float(std_val),
                    "outlier_pixels": int(len(outlier_regions)),
                    "edge_pixels": int(torch.sum(strong_edges))
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
