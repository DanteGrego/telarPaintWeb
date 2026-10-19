/**
 * PenTool.js — Freehand pixel painting with symmetry
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _painting = false;

toolManager.register('pen', {
  label: 'Lápiz',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 013.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  onPointerDown(cell) {
    if (!cell) return;
    _painting = true;
    const coords = state.getSymmetricCoords(cell.row, cell.col);
    const changes = coords.map((c) => ({ row: c.row, col: c.col, value: state.activeColor }));
    state.batchSetCells(changes, { pushHistory: true });
  },

  onPointerMove(cell) {
    if (!_painting || !cell) return;
    const coords = state.getSymmetricCoords(cell.row, cell.col);
    const changes = coords.map((c) => ({ row: c.row, col: c.col, value: state.activeColor }));
    state.batchSetCells(changes, { pushHistory: false });
  },

  onPointerUp() {
    _painting = false;
  },

  onDeactivate() {
    _painting = false;
  },
});
