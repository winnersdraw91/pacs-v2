import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import * as dicomParser from 'dicom-parser';

interface DicomViewerProps {
  studyId: string;
  instances: Array<{
    instance_number: number;
    url: string;
  }>;
}

export const DicomViewer: React.FC<DicomViewerProps> = ({ instances }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentInstance, setCurrentInstance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [windowCenter, setWindowCenter] = useState(40);
  const [windowWidth, setWindowWidth] = useState(400);
  const imageDataRef = useRef<{
    pixelData: Uint16Array | Int16Array;
    width: number;
    height: number;
    minPixelValue: number;
    maxPixelValue: number;
  } | null>(null);

  useEffect(() => {
    loadInstance(0);
  }, []);

  useEffect(() => {
    if (imageDataRef.current && canvasRef.current) {
      renderImage();
    }
  }, [zoom, pan, windowCenter, windowWidth]);

  const loadInstance = async (instanceNumber: number) => {
    if (!instances[instanceNumber]) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://app-vatkjvnd.fly.dev';
      const response = await fetch(`${apiUrl}${instances[instanceNumber].url}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load DICOM file');

      const arrayBuffer = await response.arrayBuffer();
      const byteArray = new Uint8Array(arrayBuffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) {
        throw new Error('No pixel data found in DICOM file');
      }

      const rows = dataSet.uint16('x00280010');
      const cols = dataSet.uint16('x00280011');
      const bitsAllocated = dataSet.uint16('x00280100');
      const pixelRepresentation = dataSet.uint16('x00280103');

      let pixelData: Uint16Array | Int16Array;
      if (bitsAllocated === 16) {
        if (pixelRepresentation === 0) {
          pixelData = new Uint16Array(
            arrayBuffer,
            pixelDataElement.dataOffset,
            pixelDataElement.length / 2
          );
        } else {
          pixelData = new Int16Array(
            arrayBuffer,
            pixelDataElement.dataOffset,
            pixelDataElement.length / 2
          );
        }
      } else {
        pixelData = new Uint16Array(
          arrayBuffer,
          pixelDataElement.dataOffset,
          pixelDataElement.length / 2
        );
      }

      const minPixelValue = Math.min(...Array.from(pixelData));
      const maxPixelValue = Math.max(...Array.from(pixelData));

      imageDataRef.current = {
        pixelData,
        width: cols || 256,
        height: rows || 256,
        minPixelValue,
        maxPixelValue
      };

      setWindowCenter((minPixelValue + maxPixelValue) / 2);
      setWindowWidth(maxPixelValue - minPixelValue);
      setCurrentInstance(instanceNumber);
      setIsLoading(false);
      
      if (canvasRef.current) {
        renderImage();
      }
    } catch (error) {
      console.error('Error loading DICOM instance:', error);
      setIsLoading(false);
    }
  };

  const renderImage = () => {
    if (!canvasRef.current || !imageDataRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { pixelData, width, height } = imageDataRef.current;

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const windowMin = windowCenter - windowWidth / 2;
    const windowMax = windowCenter + windowWidth / 2;

    for (let i = 0; i < pixelData.length; i++) {
      let pixelValue = pixelData[i];
      
      if (pixelValue <= windowMin) {
        pixelValue = 0;
      } else if (pixelValue >= windowMax) {
        pixelValue = 255;
      } else {
        pixelValue = ((pixelValue - windowMin) / windowWidth) * 255;
      }

      const idx = i * 4;
      data[idx] = pixelValue;
      data[idx + 1] = pixelValue;
      data[idx + 2] = pixelValue;
      data[idx + 3] = 255;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);
    
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
