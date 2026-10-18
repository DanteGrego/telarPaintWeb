/**
 * Toolbar.js — Renders tool buttons and binds toolbar controls
 */

import { state } from '../store/AppState.js';
import { toolManager } from '../tools/ToolManager.js';

const toolButtonsEl = document.getElementById('tool-buttons');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomReset = document.getElementById('btn-zoom-reset');
const btnSwapColors = document.getElementById('btn-swap-colors');

// ── Tool Buttons ───────────────────────────────────────────────────────────────

export function renderToolButtons() {
  toolButtonsEl.innerHTML = '';
  for (const [name, tool] of toolManager.getAll()) {
    const btn = document.createElement('button');
    btn.className = 'icon-btn' + (state.activeTool === name ? ' active' : '');
    btn.title = tool.label;
    btn.setAttribute('aria-label', tool.label);
    btn.innerHTML = tool.icon;
    btn.dataset.tool = name;
    btn.addEventListener('click', () => {
      toolManager.activate(name);
    });
    toolButtonsEl.appendChild(btn);
  }
}

function updateToolButtons() {
  for (const btn of toolButtonsEl.querySelectorAll('.icon-btn')) {
    btn.classList.toggle('active', btn.dataset.tool === state.activeTool);
  }
}

// ── Undo / Redo ───────────────────────────────────────────────────────────────

function updateHistoryButtons() {
  btnUndo.disabled = !state.canUndo;
  btnRedo.disabled = !state.canRedo;
}

btnUndo.addEventListener('click', () => state.undo());
btnRedo.addEventListener('click', () => state.redo());

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') { e.preventDefault(); state.undo(); }
    if (e.key === 'y') { e.preventDefault(); state.redo(); }
    if (e.key === 'Z' && e.shiftKey) { e.preventDefault(); state.redo(); }
  }
});

// ── Zoom ──────────────────────────────────────────────────────────────────────

btnZoomIn.addEventListener('click', () => state.setZoom(state.zoom + 0.25));
btnZoomOut.addEventListener('click', () => state.setZoom(state.zoom - 0.25));
btnZoomReset.addEventListener('click', () => state.setZoom(1));

// ── Color swap ────────────────────────────────────────────────────────────────

btnSwapColors.addEventListener('click', () => state.swapColors());

// ── Subscriptions ─────────────────────────────────────────────────────────────

state.addEventListener('toolChange', updateToolButtons);
state.addEventListener('historyChange', updateHistoryButtons);

// Initialize
updateHistoryButtons();

