/**
 * SelectTool.js — Rectangular selection, copy and paste
 *
 * Click/drag to select a region.
 * Paste from clipboard on second tap in paste mode.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';
import { showToast } from '../ui/Toast.js';

let _startCell = null;
let _pasteMode = false;

toolManager.register('select', {
  label: 'Selección',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M3 3h5M3 3v5M21 3h-5M21 3v5M3 21h5M3 21v-5M21 21h-5M21 21v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
  </svg>`,

  onActivate() {
    _pasteMode = false;
  },

  onDeactivate() {
    state.setSelection(null);
    _pasteMode = false;
    _startCell = null;
  },

  onPointerDown(cell) {
    if (!cell) return;
    if (_pasteMode && state.clipboard) {
      state.pasteAt(cell.row, cell.col);
      _pasteMode = false;
      showToast('Pegado');
      return;
    }
    _startCell = cell;
    state.setSelection({ r1: cell.row, c1: cell.col, r2: cell.row, c2: cell.col });
  },

  onPointerMove(cell) {
    if (!_startCell || !cell) return;
    state.setSelection({ r1: _startCell.row, c1: _startCell.col, r2: cell.row, c2: cell.col });
  },

  onPointerUp() {
    _startCell = null;
  },
});

// Keyboard shortcuts for copy/paste while select tool active
window.addEventListener('keydown', (e) => {
  if (state.activeTool !== 'select') return;
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'c') {
      state.copySelection();
      showToast('Copiado');
    } else if (e.key === 'v') {
      if (state.clipboard) {
        _pasteMode = true;
        showToast('Haz clic para pegar');
      }
    }
  }
});

