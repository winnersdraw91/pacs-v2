import { init as csInit } from '@cornerstonejs/core';
import { init as csToolsInit } from '@cornerstonejs/tools';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';

let initialized = false;

export async function initCornerstone() {
  if (initialized) return;
  
  try {
    await csInit();
    await csToolsInit();
    
    dicomImageLoaderInit();
    
    initialized = true;
    console.log('Cornerstone initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Cornerstone:', error);
    throw error;
  }
}

export const WINDOW_LEVEL_PRESETS = {
  brain: { windowWidth: 80, windowCenter: 40 },
  bone: { windowWidth: 2000, windowCenter: 400 },
  lung: { windowWidth: 1500, windowCenter: -600 },
  abdomen: { windowWidth: 350, windowCenter: 40 },
  liver: { windowWidth: 150, windowCenter: 60 },
};
