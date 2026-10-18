/**
 * main.js — Application bootstrap
 *
 * Import order matters for side-effect registrations:
 *  1. Tools register themselves into toolManager
 *  2. Exporters register themselves into exportManager
 *  3. UI modules bind to the DOM
 *  4. PatternCanvas + Interactions init
 */

// ── Tool registrations (side effects) ─────────────────────────────────────────
import './tools/PenTool.js';
import './tools/EraserTool.js';
import './tools/FillTool.js';
import './tools/LineTool.js';
import './tools/RectTool.js';
import './tools/CircleTool.js';
import './tools/SelectTool.js';
import './tools/PanTool.js';

// ── Exporter registrations ────────────────────────────────────────────────────
import './export/PdfExporter.js';

// ── Canvas & Interactions ─────────────────────────────────────────────────────
import { buildGrid } from './canvas/PatternCanvas.js';
import './canvas/Interactions.js';

// ── UI Modules ────────────────────────────────────────────────────────────────
import { renderToolButtons } from './ui/Toolbar.js';
import './ui/ColorPicker.js';
import './ui/DrawerMenu.js';
import './ui/InstructionsPanel.js';

// ── State ─────────────────────────────────────────────────────────────────────
import { state } from './store/AppState.js';
import { toolManager } from './tools/ToolManager.js';


// ── PWA Service Worker ────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => {
    console.warn('SW registration failed:', err);
  });
}

// ── Initialize ────────────────────────────────────────────────────────────────
renderToolButtons();
buildGrid();
toolManager.activate('pen');

console.log('TelarPaint ready');
