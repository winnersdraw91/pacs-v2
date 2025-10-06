import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface DicomViewerProps {
  studyId: string;
  instances: Array<{
    instance_number: number;
    url: string;
  }>;
}

export const DicomViewer: React.FC<DicomViewerProps> = ({ studyId, instances }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentInstance, setCurrentInstance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadInstance(0);
  }, []);

  useEffect(() => {
    if (imageData && canvasRef.current) {
      renderImage();
    }
  }, [imageData, zoom, pan]);

  const loadInstance = async (instanceNumber: number) => {
    if (!instances[instanceNumber]) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${window.location.origin}${instances[instanceNumber].url}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load DICOM file');

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setImageData(imgData);
        }
        URL.revokeObjectURL(url);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        console.error('Failed to load image');
        setIsLoading(false);
      };
      
      img.src = url;
      setCurrentInstance(instanceNumber);
    } catch (error) {
      console.error('Error loading DICOM instance:', error);
      setIsLoading(false);
    }
  };

  const renderImage = () => {
    if (!canvasRef.current || !imageData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-imageData.width / 2, -imageData.height / 2);
    
    ctx.putImageData(imageData, 0, 0);
    ctx.restore();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNextInstance = () => {
    if (currentInstance < instances.length - 1) {
      loadInstance(currentInstance + 1);
    }
  };

  const handlePrevInstance = () => {
    if (currentInstance > 0) {
      loadInstance(currentInstance - 1);
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">DICOM Viewer</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="absolute inset-0 w-full h-full"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white">Loading DICOM image...</div>
            </div>
          )}
        </div>

        {instances.length > 1 && (
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevInstance}
              disabled={currentInstance === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Instance {currentInstance + 1} of {instances.length}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextInstance}
              disabled={currentInstance === instances.length - 1}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
