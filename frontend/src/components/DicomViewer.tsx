import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ScaleIcon,
  CursorArrowRaysIcon,
  Square2StackIcon,
} from '@heroicons/react/24/outline';
import * as cornerstone from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { initCornerstone, WINDOW_LEVEL_PRESETS } from '@/lib/cornerstoneInit';

interface DicomViewerProps {
  studyId: string;
  instances: Array<{
    instance_number: number;
    url: string;
  }>;
}

const {
  LengthTool,
  RectangleROITool,
  AngleTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  ToolGroupManager,
  Enums: toolEnums,
} = cornerstoneTools;

const TOOL_NAMES = {
  LENGTH: 'Length',
  ROI: 'RectangleROI',
  ANGLE: 'Angle',
  WINDOW_LEVEL: 'WindowLevel',
  PAN: 'Pan',
  ZOOM: 'Zoom',
};

export const DicomViewer: React.FC<DicomViewerProps> = ({ studyId, instances }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [currentInstance, setCurrentInstance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<string>(TOOL_NAMES.WINDOW_LEVEL);
  const [activePreset, setActivePreset] = useState<string>('brain');
  const [renderingEngine, setRenderingEngine] = useState<any>(null);
  const [viewport, setViewport] = useState<any>(null);
  const toolGroupId = useRef(`TOOL_GROUP_${studyId}`);
  
  useEffect(() => {
    const init = async () => {
      try {
        await initCornerstone();
        
        cornerstoneTools.addTool(LengthTool);
        cornerstoneTools.addTool(RectangleROITool);
        cornerstoneTools.addTool(AngleTool);
        cornerstoneTools.addTool(WindowLevelTool);
        cornerstoneTools.addTool(PanTool);
        cornerstoneTools.addTool(ZoomTool);
        
        const engine = new cornerstone.RenderingEngine(`engine_${studyId}`);
        setRenderingEngine(engine);
        
        if (viewportRef.current) {
          const viewportInput = {
            viewportId: `viewport_${studyId}`,
            type: Enums.ViewportType.STACK,
            element: viewportRef.current,
          };
          
          engine.enableElement(viewportInput);
          const vp = engine.getViewport(viewportInput.viewportId);
          setViewport(vp);
          
          const toolGroup = ToolGroupManager.createToolGroup(toolGroupId.current);
          
          if (toolGroup) {
            toolGroup.addTool(TOOL_NAMES.LENGTH);
            toolGroup.addTool(TOOL_NAMES.ROI);
            toolGroup.addTool(TOOL_NAMES.ANGLE);
            toolGroup.addTool(TOOL_NAMES.WINDOW_LEVEL);
            toolGroup.addTool(TOOL_NAMES.PAN);
            toolGroup.addTool(TOOL_NAMES.ZOOM);
            
            toolGroup.setToolActive(TOOL_NAMES.WINDOW_LEVEL, {
              bindings: [{ mouseButton: toolEnums.MouseBindings.Primary }],
            });
            
            toolGroup.addViewport(viewportInput.viewportId, `engine_${studyId}`);
          }
          
          await loadInstance(0, vp);
        }
      } catch (error) {
        console.error('Failed to initialize viewer:', error);
        setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      if (renderingEngine) {
        renderingEngine.destroy();
      }
      try {
        ToolGroupManager.destroyToolGroup(toolGroupId.current);
      } catch (e) {
        console.log('Tool group cleanup:', e);
      }
    };
  }, []);
  
  const loadInstance = async (instanceNumber: number, viewportOverride?: any) => {
    if (!instances[instanceNumber]) return;
    
    const vp = viewportOverride || viewport;
    if (!vp) return;
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://app-vatkjvnd.fly.dev';
      
      const response = await fetch(`${apiUrl}${instances[instanceNumber].url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to load DICOM file');
      
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/dicom' });
      const imageId = cornerstoneDICOMImageLoader.wadouri.fileManager.add(blob);
      
      console.log('Setting stack with imageId:', imageId);
      await vp.setStack([imageId]);
      console.log('Stack set, rendering viewport...');
      vp.render();
      console.log('Viewport rendered successfully');
      
      setCurrentInstance(instanceNumber);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading DICOM instance:', error);
      setIsLoading(false);
    }
  };
  
  const handleToolChange = (toolName: string) => {
    const toolGroup = ToolGroupManager.getToolGroup(toolGroupId.current);
    if (!toolGroup) return;
    
    Object.values(TOOL_NAMES).forEach(tool => {
      toolGroup.setToolPassive(tool);
    });
    
    toolGroup.setToolActive(toolName, {
      bindings: [{ mouseButton: toolEnums.MouseBindings.Primary }],
    });
    
    setActiveTool(toolName);
  };
  
  const handlePresetChange = (preset: string) => {
    if (!viewport) return;
    
    const presetValues = WINDOW_LEVEL_PRESETS[preset as keyof typeof WINDOW_LEVEL_PRESETS];
    if (presetValues) {
      viewport.setProperties({
        voiRange: {
          lower: presetValues.windowCenter - presetValues.windowWidth / 2,
          upper: presetValues.windowCenter + presetValues.windowWidth / 2,
        },
      });
      viewport.render();
      setActivePreset(preset);
    }
  };
  
  const handleReset = () => {
    if (!viewport) return;
    viewport.resetCamera();
    viewport.render();
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
    <Card className="backdrop-blur-sm bg-white/90 border-white/20 p-4">
      <div className="space-y-4">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold bg-gradient-modern bg-clip-text text-transparent">
            Advanced DICOM Viewer
          </h3>
        </motion.div>
        
        <motion.div
          className="flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex gap-1">
            <ToolButton
              icon={<CursorArrowRaysIcon className="h-5 w-5" />}
              label="Window/Level"
              active={activeTool === TOOL_NAMES.WINDOW_LEVEL}
              onClick={() => handleToolChange(TOOL_NAMES.WINDOW_LEVEL)}
            />
            <ToolButton
              icon={<ScaleIcon className="h-5 w-5" />}
              label="Measure"
              active={activeTool === TOOL_NAMES.LENGTH}
              onClick={() => handleToolChange(TOOL_NAMES.LENGTH)}
            />
            <ToolButton
              icon={<Square2StackIcon className="h-5 w-5" />}
              label="ROI"
              active={activeTool === TOOL_NAMES.ROI}
              onClick={() => handleToolChange(TOOL_NAMES.ROI)}
            />
            <ToolButton
              icon={<MagnifyingGlassPlusIcon className="h-5 w-5" />}
              label="Zoom"
              active={activeTool === TOOL_NAMES.ZOOM}
              onClick={() => handleToolChange(TOOL_NAMES.ZOOM)}
            />
          </div>
          
          <div className="h-6 w-px bg-white/20" />
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="hover:bg-white/20"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
        
        <motion.div
          className="flex gap-2 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {Object.keys(WINDOW_LEVEL_PRESETS).map(preset => (
            <Button
              key={preset}
              size="sm"
              variant={activePreset === preset ? "default" : "outline"}
              onClick={() => handlePresetChange(preset)}
              className={activePreset === preset ? "bg-gradient-modern text-white" : ""}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </Button>
          ))}
        </motion.div>
        
        <motion.div
          className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden shadow-modern"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div
            ref={viewportRef}
            className="absolute inset-0 w-full h-full"
          />
          {isLoading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="text-white text-sm"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Loading DICOM image...
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        {instances.length > 1 && (
          <motion.div
            className="flex items-center justify-between backdrop-blur-sm bg-white/50 rounded-lg p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevInstance}
                disabled={currentInstance === 0}
                className="hover:bg-gradient-modern hover:text-white transition-all"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </motion.div>
            <motion.span
              className="text-sm font-medium"
              key={currentInstance}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              Instance {currentInstance + 1} of {instances.length}
            </motion.span>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextInstance}
                disabled={currentInstance === instances.length - 1}
                className="hover:bg-gradient-modern hover:text-white transition-all"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Card>
  );
};

const ToolButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`${
        active ? 'bg-gradient-modern text-white' : 'hover:bg-white/20'
      } transition-all`}
      title={label}
    >
      {icon}
    </Button>
  </motion.div>
);
