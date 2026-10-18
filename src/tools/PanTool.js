/**
 * PanTool.js — Hand/pan tool for scrolling the viewport
 *
 * Actual panning logic is handled in Interactions.js by checking state.activeTool === 'pan'.
 * This module just registers the tool so it appears in the toolbar.
 */

import { toolManager } from './ToolManager.js';

const viewport = document.getElementById('canvas-viewport');

toolManager.register('pan', {
  label: 'Mover',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M9 11V6a2 2 0 014 0v4M9 11V9a2 2 0 00-4 0v6a7 7 0 0014 0V11a2 2 0 00-4 0v1M9 11h6"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  onActivate()   { viewport.classList.add('panning'); },
  onDeactivate() { viewport.classList.remove('panning'); },
});

