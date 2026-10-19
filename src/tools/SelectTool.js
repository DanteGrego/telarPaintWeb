/**
 * SelectTool.js — Rectangular selection, copy and paste
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';
import { showToast } from '../ui/Toast.js';

let _startCell = null;

toolManager.register('select', {
  label: 'Selección',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M3 3h5M3 3v5M21 3h-5M21 3v5M3 21h5M3 21v-5M21 21h-5M21 21v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
  </svg>`,

  onActivate() {
    _startCell = null;
  },

  onDeactivate() {
    _startCell = null;
    state.setSelection(null);
  },

  onPointerDown(cell) {
    if (!cell) return;
    _startCell = cell;
    state.setSelection({ r1: cell.row, c1: cell.col, r2: cell.row, c2: cell.col });
  },

  onPointerMove(cell) {
    if (!_startCell || !cell) return;
    state.setSelection({ r1: _startCell.row, c1: _startCell.col, r2: cell.row, c2: cell.col });
  },

  onPointerUp(cell) {
    if (_startCell && cell) {
      state.setSelection({ r1: _startCell.row, c1: _startCell.col, r2: cell.row, c2: cell.col });
    }
    _startCell = null;
  },
});

// Keyboard shortcuts for copy/paste
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'c' && state.selection) {
      state.copySelection();
      showToast('Selección copiada ✓');
    } else if (e.key === 'v' && state.clipboard) {
      toolManager.activate('paste');
    }
  }
});
