/**
 * PasteTool.js — Tool to paste copied selection onto the canvas
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';
import { showToast } from '../ui/Toast.js';

let _previewOverlay = null;

function updatePastePreview(cell) {
  if (!_previewOverlay) {
    _previewOverlay = document.getElementById('paste-preview-box');
  }
  if (!_previewOverlay) return;

  if (!cell || !state.clipboard) {
    _previewOverlay.classList.add('hidden');
    return;
  }

  const { rows, cols } = state.clipboard;
  const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size')) || 28;

  _previewOverlay.style.width = `${cols * cellSize}px`;
  _previewOverlay.style.height = `${rows * cellSize}px`;
  _previewOverlay.style.left = `${cell.col * cellSize}px`;
  _previewOverlay.style.top = `${cell.row * cellSize}px`;
  _previewOverlay.classList.remove('hidden');
}

toolManager.register('paste', {
  label: 'Pegar',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" stroke-width="2"/>
    <path d="M9 14l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  onActivate() {
    if (!state.clipboard) {
      showToast('Copia una selección primero');
      toolManager.activate('select');
      return;
    }
    showToast('Toca el lienzo para pegar');
  },

  onDeactivate() {
    const box = _previewOverlay || document.getElementById('paste-preview-box');
    if (box) {
      box.classList.add('hidden');
    }
  },

  onPointerDown(cell) {
    if (!cell) return;
    if (!state.clipboard) {
      showToast('Nada que pegar');
      return;
    }
    state.pasteAt(cell.row, cell.col);
    showToast('Pegado ✓');
  },

  onPointerMove(cell) {
    updatePastePreview(cell);
  },

  onPointerUp() {
    // Keep ready for multiple pastes
  },
});

