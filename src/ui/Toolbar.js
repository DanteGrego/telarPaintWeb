/**
 * Toolbar.js — Renders tool buttons and binds toolbar controls
 */

import { state } from '../store/AppState.js';
import { toolManager } from '../tools/ToolManager.js';
import { showToast } from './Toast.js';

const toolButtonsEl = document.getElementById('tool-buttons');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomReset = document.getElementById('btn-zoom-reset');
const btnSwapColors = document.getElementById('btn-swap-colors');

const floatZoomIn = document.getElementById('btn-float-zoom-in');
const floatZoomOut = document.getElementById('btn-float-zoom-out');
const floatZoomReset = document.getElementById('btn-float-zoom-reset');
const floatZoomText = document.getElementById('float-zoom-text');

const btnSymH = document.getElementById('btn-sym-h');
const btnSymV = document.getElementById('btn-sym-v');

const selectionBar = document.getElementById('selection-bar');
const btnCopySel = document.getElementById('btn-copy-selection');
const btnPasteSel = document.getElementById('btn-paste-selection');
const btnClearSel = document.getElementById('btn-clear-selection');

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

    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
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

// ── Symmetry Controls ─────────────────────────────────────────────────────────

if (btnSymH) {
  btnSymH.addEventListener('click', () => {
    state.toggleSymmetryH();
    showToast(state.symH ? 'Simetría columna activada' : 'Simetría columna desactivada');
  });
}

if (btnSymV) {
  btnSymV.addEventListener('click', () => {
    state.toggleSymmetryV();
    showToast(state.symV ? 'Simetría fila activada' : 'Simetría fila desactivada');
  });
}

function updateSymmetryButtons() {
  if (btnSymH) btnSymH.classList.toggle('active', state.symH);
  if (btnSymV) btnSymV.classList.toggle('active', state.symV);
}

// ── Selection Bar Controls ───────────────────────────────────────────────────

function updateSelectionBar() {
  if (!selectionBar) return;
  if (state.selection && state.activeTool === 'select') {
    selectionBar.classList.remove('hidden');
    // Enable or disable paste in selection bar based on clipboard
    if (btnPasteSel) {
      btnPasteSel.disabled = !state.clipboard;
    }
  } else {
    selectionBar.classList.add('hidden');
  }
}

if (btnCopySel) {
  btnCopySel.addEventListener('pointerdown', (e) => e.stopPropagation());
  btnCopySel.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.selection) {
      state.copySelection();
      showToast('Selección copiada ✓');
      toolManager.activate('paste');
    }
  });
}

if (btnPasteSel) {
  btnPasteSel.addEventListener('pointerdown', (e) => e.stopPropagation());
  btnPasteSel.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.clipboard) {
      toolManager.activate('paste');
    }
  });
}

if (btnClearSel) {
  btnClearSel.addEventListener('pointerdown', (e) => e.stopPropagation());
  btnClearSel.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.setSelection(null);
  });
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

function updateZoomDisplay() {
  const pct = `${Math.round(state.zoom * 100)}%`;
  if (floatZoomText) floatZoomText.textContent = pct;
}

if (btnZoomIn) btnZoomIn.addEventListener('click', () => state.setZoom(state.zoom + 0.25));
if (btnZoomOut) btnZoomOut.addEventListener('click', () => state.setZoom(state.zoom - 0.25));
if (btnZoomReset) btnZoomReset.addEventListener('click', () => state.setZoom(1));

if (floatZoomIn) floatZoomIn.addEventListener('click', () => state.setZoom(state.zoom + 0.25));
if (floatZoomOut) floatZoomOut.addEventListener('click', () => state.setZoom(state.zoom - 0.25));
if (floatZoomReset) floatZoomReset.addEventListener('click', () => state.setZoom(1));

// ── Color swap ────────────────────────────────────────────────────────────────

btnSwapColors.addEventListener('click', () => state.swapColors());

// ── Subscriptions ─────────────────────────────────────────────────────────────

state.addEventListener('toolChange', () => {
  updateToolButtons();
  updateSelectionBar();
});
state.addEventListener('historyChange', updateHistoryButtons);
state.addEventListener('symmetryChange', updateSymmetryButtons);
state.addEventListener('selectionChange', updateSelectionBar);
state.addEventListener('zoomChange', updateZoomDisplay);

// Initialize
updateHistoryButtons();
updateSymmetryButtons();
updateZoomDisplay();
