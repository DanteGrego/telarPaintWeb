/**
 * EraserTool.js — Paints cells with color B (background/abajo)
 */

import { state, CELL_B } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _erasing = false;

toolManager.register('eraser', {
  label: 'Borrador',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M20 20H7L3 16l10-10 7 7-3.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.5 17.5l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  onPointerDown(cell) {
    if (!cell) return;
    _erasing = true;
    state.setCell(cell.row, cell.col, CELL_B);
  },

  onPointerMove(cell) {
    if (!_erasing || !cell) return;
    state.setCell(cell.row, cell.col, CELL_B, { pushHistory: false });
  },

  onPointerUp() {
    _erasing = false;
  },
});

