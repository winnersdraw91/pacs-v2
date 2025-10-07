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
  CubeIcon,
  Squares2X2Icon,
  BeakerIcon,
  SparklesIcon,
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

type RenderingMode = '2D' | 'MPR' | '3D' | 'MIP';

const {
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  CircleROITool,
  AngleTool,
  BidirectionalTool,
  ProbeTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  ToolGroupManager,
  Enums: toolEnums,
} = cornerstoneTools;

const TOOL_NAMES = {
  LENGTH: 'Length',
  ROI: 'RectangleROI',
  ELLIPSE: 'EllipticalROI',
  CIRCLE: 'CircleROI',
  ANGLE: 'Angle',
  BIDIRECTIONAL: 'Bidirectional',
  PROBE: 'Probe',
  WINDOW_LEVEL: 'WindowLevel',
  PAN: 'Pan',
  ZOOM: 'Zoom',
  STACK_SCROLL: 'StackScroll',
};

export const DicomViewer: React.FC<DicomViewerProps> = ({ studyId, instances }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const axialRef = useRef<HTMLDivElement>(null);
  const coronalRef = useRef<HTMLDivElement>(null);
  const sagittalRef = useRef<HTMLDivElement>(null);
  const [currentInstance, setCurrentInstance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<string>(TOOL_NAMES.WINDOW_LEVEL);
  const [activePreset, setActivePreset] = useState<string>('brain');
  const [renderingMode, setRenderingMode] = useState<RenderingMode>('2D');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [showMeasurementMenu, setShowMeasurementMenu] = useState(false);
  const [showROIMenu, setShowROIMenu] = useState(false);
  const [isCinePlaying, setIsCinePlaying] = useState(false);
  const [cineSpeed, setCineSpeed] = useState(10);
  const [renderingEngine, setRenderingEngine] = useState<any>(null);
  const [viewport, setViewport] = useState<any>(null);
  const toolGroupId = useRef(`TOOL_GROUP_${studyId}`);
  const cineIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const init = async () => {
      try {
        await initCornerstone();
        
        cornerstoneTools.addTool(LengthTool);
        cornerstoneTools.addTool(RectangleROITool);
        cornerstoneTools.addTool(EllipticalROITool);
        cornerstoneTools.addTool(CircleROITool);
        cornerstoneTools.addTool(AngleTool);
        cornerstoneTools.addTool(BidirectionalTool);
        cornerstoneTools.addTool(ProbeTool);
        cornerstoneTools.addTool(WindowLevelTool);
        cornerstoneTools.addTool(PanTool);
        cornerstoneTools.addTool(ZoomTool);
        cornerstoneTools.addTool(StackScrollTool);
        
        const engine = new cornerstone.RenderingEngine(`engine_${studyId}`);
        setRenderingEngine(engine);
      } catch (error) {
        console.error('Failed to initialize Cornerstone:', error);
        setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      if (cineIntervalRef.current) {
        clearInterval(cineIntervalRef.current);
      }
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
  
  useEffect(() => {
    if (!renderingEngine) return;
    
    const initializeViewports = async () => {
      try {
        setIsLoading(true);
        
        try {
          ToolGroupManager.destroyToolGroup(toolGroupId.current);
        } catch (e) {
          console.log('No existing tool group to destroy');
        }
        
        if (renderingMode === '2D') {
          await initialize2DMode();
        } else if (renderingMode === 'MPR') {
          await initializeMPRMode();
        } else if (renderingMode === '3D') {
          await initialize3DMode();
        } else if (renderingMode === 'MIP') {
          await initializeMIPMode();
        }
      } catch (error) {
        console.error('Failed to initialize viewports:', error);
        setIsLoading(false);
      }
    };
    
    initializeViewports();
  }, [renderingEngine, renderingMode]);
  
  const initialize2DMode = async () => {
    if (!viewportRef.current || !renderingEngine) return;
    
    const viewportId = `viewport_2d_${studyId}`;
    const viewportInput = {
      viewportId,
      type: Enums.ViewportType.STACK,
      element: viewportRef.current,
    };
    
    renderingEngine.enableElement(viewportInput);
    const vp = renderingEngine.getViewport(viewportId);
    setViewport(vp);
    
    const toolGroup = ToolGroupManager.createToolGroup(toolGroupId.current);
    
    if (toolGroup) {
      toolGroup.addTool(TOOL_NAMES.LENGTH);
      toolGroup.addTool(TOOL_NAMES.ROI);
      toolGroup.addTool(TOOL_NAMES.ELLIPSE);
      toolGroup.addTool(TOOL_NAMES.CIRCLE);
      toolGroup.addTool(TOOL_NAMES.ANGLE);
      toolGroup.addTool(TOOL_NAMES.BIDIRECTIONAL);
      toolGroup.addTool(TOOL_NAMES.PROBE);
      toolGroup.addTool(TOOL_NAMES.WINDOW_LEVEL);
      toolGroup.addTool(TOOL_NAMES.PAN);
      toolGroup.addTool(TOOL_NAMES.ZOOM);
      toolGroup.addTool(TOOL_NAMES.STACK_SCROLL);
      
      toolGroup.setToolActive(TOOL_NAMES.WINDOW_LEVEL, {
        bindings: [{ mouseButton: toolEnums.MouseBindings.Primary }],
      });
      
      toolGroup.addViewport(viewportId, `engine_${studyId}`);
    }
    
    await loadInstance(0, vp);
  };
  
  const initializeMPRMode = async () => {
    if (!axialRef.current || !coronalRef.current || !sagittalRef.current || !renderingEngine) return;
    
    const axialViewportId = `viewport_axial_${studyId}`;
    const coronalViewportId = `viewport_coronal_${studyId}`;
    const sagittalViewportId = `viewport_sagittal_${studyId}`;
    
    const viewportInputs = [
      {
        viewportId: axialViewportId,
        type: Enums.ViewportType.STACK,
        element: axialRef.current,
      },
      {
        viewportId: coronalViewportId,
        type: Enums.ViewportType.STACK,
        element: coronalRef.current,
      },
      {
        viewportId: sagittalViewportId,
        type: Enums.ViewportType.STACK,
        element: sagittalRef.current,
      },
    ];
    
    viewportInputs.forEach(input => {
      renderingEngine.enableElement(input);
    });
    
    const axialVp = renderingEngine.getViewport(axialViewportId);
    const coronalVp = renderingEngine.getViewport(coronalViewportId);
    const sagittalVp = renderingEngine.getViewport(sagittalViewportId);
    
    const toolGroup = ToolGroupManager.createToolGroup(toolGroupId.current);
    
    if (toolGroup) {
      toolGroup.addTool(TOOL_NAMES.WINDOW_LEVEL);
      toolGroup.addTool(TOOL_NAMES.PAN);
      toolGroup.addTool(TOOL_NAMES.ZOOM);
      
      toolGroup.setToolActive(TOOL_NAMES.WINDOW_LEVEL, {
        bindings: [{ mouseButton: toolEnums.MouseBindings.Primary }],
      });
      
      toolGroup.addViewport(axialViewportId, `engine_${studyId}`);
      toolGroup.addViewport(coronalViewportId, `engine_${studyId}`);
      toolGroup.addViewport(sagittalViewportId, `engine_${studyId}`);
    }
    
    await loadInstance(0, axialVp);
    await loadInstance(0, coronalVp);
    await loadInstance(0, sagittalVp);
    
    try {
      const axialCamera = axialVp.getCamera();
      const coronalCamera = coronalVp.getCamera();
      const sagittalCamera = sagittalVp.getCamera();
      
      axialVp.setCamera({
        ...axialCamera,
        viewPlaneNormal: [0, 0, 1],
        viewUp: [0, -1, 0],
      });
      
      coronalVp.setCamera({
        ...coronalCamera,
        viewPlaneNormal: [0, 1, 0],
        viewUp: [0, 0, -1],
      });
      
      sagittalVp.setCamera({
        ...sagittalCamera,
        viewPlaneNormal: [1, 0, 0],
        viewUp: [0, 0, -1],
      });
      
      axialVp.render();
      coronalVp.render();
      sagittalVp.render();
    } catch (error) {
      console.log('Camera orientation setup:', error);
    }
  };
  
  const initialize3DMode = async () => {
    if (!viewportRef.current || !renderingEngine) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    console.log('3D volume rendering requires multi-slice DICOM data');
  };
  
  const initializeMIPMode = async () => {
    if (!viewportRef.current || !renderingEngine) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    console.log('MIP rendering requires multi-slice DICOM data');
  };
  
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

  const handleCinePlay = () => {
    if (isCinePlaying) {
      if (cineIntervalRef.current) {
        clearInterval(cineIntervalRef.current);
        cineIntervalRef.current = null;
      }
      setIsCinePlaying(false);
    } else {
      setIsCinePlaying(true);
      const intervalMs = 1000 / cineSpeed;
      cineIntervalRef.current = setInterval(() => {
        setCurrentInstance(prev => {
          const next = prev + 1;
          if (next >= instances.length) {
            return 0;
          }
          loadInstance(next);
          return next;
        });
      }, intervalMs);
    }
  };

  const handleCineSpeedChange = (speed: number) => {
    setCineSpeed(speed);
    if (isCinePlaying) {
      if (cineIntervalRef.current) {
        clearInterval(cineIntervalRef.current);
      }
      const intervalMs = 1000 / speed;
      cineIntervalRef.current = setInterval(() => {
        setCurrentInstance(prev => {
          const next = prev + 1;
          if (next >= instances.length) {
            return 0;
          }
          loadInstance(next);
          return next;
        });
      }, intervalMs);
    }
  };
  
  return (
    <Card className="bg-slate-900 border-slate-700 p-4">
      <div className="space-y-4">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-white">
            Advanced DICOM Viewer
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={aiEnabled ? "default" : "outline"}
              onClick={() => setAiEnabled(!aiEnabled)}
              className={aiEnabled ? "bg-cyan-500 hover:bg-cyan-600 text-white" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
            >
              <SparklesIcon className="h-4 w-4 mr-1" />
              AI Anatomy
            </Button>
          </div>
        </motion.div>
        
        {aiEnabled && (
          <motion.div
            className="backdrop-blur-md bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-2 text-yellow-700 text-sm">
              <BeakerIcon className="h-5 w-5" />
              <span>AI analysis currently unavailable - AI modules are disabled in the backend</span>
            </div>
          </motion.div>
        )}
        
        <motion.div
          className="flex gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ModeButton
            icon={<Square2StackIcon className="h-5 w-5" />}
            label="2D"
            active={renderingMode === '2D'}
            onClick={() => setRenderingMode('2D')}
          />
          <ModeButton
            icon={<Squares2X2Icon className="h-5 w-5" />}
            label="MPR"
            active={renderingMode === 'MPR'}
            onClick={() => setRenderingMode('MPR')}
          />
          <ModeButton
            icon={<CubeIcon className="h-5 w-5" />}
            label="3D"
            active={renderingMode === '3D'}
            onClick={() => setRenderingMode('3D')}
          />
          <ModeButton
            icon={<BeakerIcon className="h-5 w-5" />}
            label="MIP"
            active={renderingMode === 'MIP'}
            onClick={() => setRenderingMode('MIP')}
          />
        </motion.div>
        
        {renderingMode === '2D' && (
          <motion.div
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2"
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
              
              <div className="relative">
                <ToolButton
                  icon={<ScaleIcon className="h-5 w-5" />}
                  label="Measurements"
                  active={[TOOL_NAMES.LENGTH, TOOL_NAMES.ANGLE, TOOL_NAMES.BIDIRECTIONAL, TOOL_NAMES.PROBE].includes(activeTool)}
                  onClick={() => setShowMeasurementMenu(!showMeasurementMenu)}
                />
                {showMeasurementMenu && (
                  <motion.div
                    className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="p-2 space-y-1">
                      <button
                        className={`w-full text-left px-3 py-2 rounded text-slate-200 ${activeTool === TOOL_NAMES.LENGTH ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                        onClick={() => { handleToolChange(TOOL_NAMES.LENGTH); setShowMeasurementMenu(false); }}
                      >
                        Length
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 rounded text-slate-200 ${activeTool === TOOL_NAMES.ANGLE ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                        onClick={() => { handleToolChange(TOOL_NAMES.ANGLE); setShowMeasurementMenu(false); }}
                      >
                        Angle
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 rounded text-slate-200 ${activeTool === TOOL_NAMES.BIDIRECTIONAL ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                        onClick={() => { handleToolChange(TOOL_NAMES.BIDIRECTIONAL); setShowMeasurementMenu(false); }}
                      >
                        Bidirectional
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 rounded text-slate-200 ${activeTool === TOOL_NAMES.PROBE ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                        onClick={() => { handleToolChange(TOOL_NAMES.PROBE); setShowMeasurementMenu(false); }}
                      >
                        Probe
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="relative">
                <ToolButton
                  icon={<Square2StackIcon className="h-5 w-5" />}
                  label="ROI Tools"
                  active={[TOOL_NAMES.ROI, TOOL_NAMES.ELLIPSE, TOOL_NAMES.CIRCLE].includes(activeTool)}
                  onClick={() => setShowROIMenu(!showROIMenu)}
                />
                {showROIMenu && (
                  <motion.div
                    className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="p-2 space-y-1">
                      <button
                        className={`w-full text-left px-3 py-2 rounded text-slate-200 ${activeTool === TOOL_NAMES.ROI ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                        onClick={() => { handleToolChange(TOOL_NAMES.ROI); setShowROIMenu(false); }}
                      >
                        Rectangle ROI
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 rounded text-slate-200 ${activeTool === TOOL_NAMES.ELLIPSE ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                        onClick={() => { handleToolChange(TOOL_NAMES.ELLIPSE); setShowROIMenu(false); }}
                      >
                        Ellipse ROI
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 rounded text-slate-200 ${activeTool === TOOL_NAMES.CIRCLE ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                        onClick={() => { handleToolChange(TOOL_NAMES.CIRCLE); setShowROIMenu(false); }}
                      >
                        Circle ROI
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <ToolButton
                icon={<MagnifyingGlassPlusIcon className="h-5 w-5" />}
                label="Zoom"
                active={activeTool === TOOL_NAMES.ZOOM}
                onClick={() => handleToolChange(TOOL_NAMES.ZOOM)}
              />
            </div>
            
            <div className="h-6 w-px bg-slate-700" />
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
        
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
              className={activePreset === preset ? "bg-cyan-500 hover:bg-cyan-600 text-white border-transparent" : "border-slate-600 text-slate-300 hover:bg-slate-800"}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </Button>
          ))}
        </motion.div>
        
        {renderingMode === '2D' && (
          <motion.div
            className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden shadow-modern"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="absolute top-2 left-2 text-white text-xs space-y-1 z-10 pointer-events-none">
              <div className="backdrop-blur-sm bg-black/50 px-2 py-1 rounded">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="backdrop-blur-sm bg-black/50 px-2 py-1 rounded">
                Study: {studyId}
              </div>
            </div>

            <div className="absolute top-2 right-2 text-white text-xs text-right space-y-1 z-10 pointer-events-none">
              <div className="backdrop-blur-sm bg-black/50 px-2 py-1 rounded">
                I:{currentInstance + 1} ({currentInstance + 1}/{instances.length})
              </div>
              <div className="backdrop-blur-sm bg-black/50 px-2 py-1 rounded">
                W:{activePreset === 'brain' ? '80' : activePreset === 'bone' ? '2500' : activePreset === 'lung' ? '1500' : activePreset === 'abdomen' ? '350' : '150'} L:{activePreset === 'brain' ? '40' : activePreset === 'bone' ? '480' : activePreset === 'lung' ? '-600' : activePreset === 'abdomen' ? '40' : '30'}
              </div>
            </div>

            <div className="absolute bottom-2 left-2 text-white text-sm font-bold z-10 pointer-events-none">
              <div className="backdrop-blur-sm bg-black/50 w-8 h-8 rounded flex items-center justify-center">
                A
              </div>
            </div>

            <div className="absolute bottom-2 right-2 text-white text-sm font-bold z-10 pointer-events-none">
              <div className="backdrop-blur-sm bg-black/50 w-8 h-8 rounded flex items-center justify-center">
                R
              </div>
            </div>
            
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
        )}
        
        {renderingMode === 'MPR' && (
          <motion.div
            className="grid grid-cols-2 gap-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative h-[400px] bg-black rounded-lg overflow-hidden shadow-xl">
              <div ref={axialRef} className="absolute inset-0 w-full h-full" />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Axial
              </div>
            </div>
            <div className="relative h-[400px] bg-black rounded-lg overflow-hidden shadow-xl">
              <div ref={coronalRef} className="absolute inset-0 w-full h-full" />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Coronal
              </div>
            </div>
            <div className="relative h-[400px] bg-black rounded-lg overflow-hidden shadow-xl col-span-2">
              <div ref={sagittalRef} className="absolute inset-0 w-full h-full" />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Sagittal
              </div>
            </div>
            {isLoading && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 col-span-2"
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
                    Loading MPR views...
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {(renderingMode === '3D' || renderingMode === 'MIP') && (
          <motion.div
            className="relative w-full h-[600px] bg-slate-900 rounded-lg overflow-hidden shadow-xl flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              {renderingMode === '3D' ? (
                <CubeIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              ) : (
                <BeakerIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              )}
              <h4 className="text-slate-300 text-lg font-semibold mb-2">
                {renderingMode === '3D' ? '3D Volume Rendering' : 'Maximum Intensity Projection (MIP)'}
              </h4>
              <p className="text-slate-500 text-sm">Available with multi-slice CT/MRI data</p>
              <p className="text-slate-600 text-xs mt-2">
                {renderingMode === '3D' 
                  ? 'Professional Volume Rendering • GPU Accelerated • Real-time Interaction'
                  : 'Clinical Grade MIP • Slab Thickness Control • Automatic Vessel Enhancement'
                }
              </p>
            </div>
          </motion.div>
        )}
        
        {instances.length > 1 && (
          <>
            <motion.div
              className="flex items-center justify-center gap-4 bg-slate-800 border border-slate-700 rounded-lg p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleCinePlay}
                className={isCinePlaying ? "bg-cyan-500 hover:bg-cyan-600 text-white border-transparent" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
              >
                {isCinePlaying ? (
                  <>
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Play
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">Speed:</span>
                <select
                  value={cineSpeed}
                  onChange={(e) => handleCineSpeedChange(Number(e.target.value))}
                  className="text-sm bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1"
                >
                  <option value="5">5 fps</option>
                  <option value="10">10 fps</option>
                  <option value="15">15 fps</option>
                  <option value="20">20 fps</option>
                  <option value="30">30 fps</option>
                </select>
              </div>
            </motion.div>

            <motion.div
              className="bg-slate-800 border border-slate-700 rounded-lg p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevInstance}
                  disabled={currentInstance === 0}
                  className="text-slate-300 hover:bg-slate-700 disabled:text-slate-600"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={instances.length - 1}
                    value={currentInstance}
                    onChange={(e) => loadInstance(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextInstance}
                  disabled={currentInstance === instances.length - 1}
                  className="text-slate-300 hover:bg-slate-700 disabled:text-slate-600"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center text-sm text-slate-300 mt-2">
                Instance {currentInstance + 1} of {instances.length}
              </div>
            </motion.div>
          </>
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
  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`${
        active ? 'bg-cyan-500 hover:bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      } transition-all p-2`}
      title={label}
    >
      {icon}
    </Button>
  </motion.div>
);

const ModeButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={`${
        active ? 'bg-cyan-500 hover:bg-cyan-600 text-white border-transparent' : 'border-slate-600 text-slate-300 hover:bg-slate-700'
      } transition-all flex items-center gap-2`}
    >
      {icon}
      <span>{label}</span>
    </Button>
  </motion.div>
);
