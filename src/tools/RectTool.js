/**
 * RectTool.js — Rectangle outline or filled rectangle
 *
 * Drag to set bounds, release to commit.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _startCell = null;
let _previewChanges = [];

function getRectCells(r0, c0, r1, c1, filled) {
  const minR = Math.min(r0, r1), maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1), maxC = Math.max(c0, c1);
  const cells = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const isEdge = r === minR || r === maxR || c === minC || c === maxC;
      if (filled || isEdge) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function applyPreview(r0, c0, r1, c1) {
  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const pts = getRectCells(r0, c0, r1, c1, false);
  for (const { row, col } of pts) {
    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) continue;
    const original = state.grid[state.idx(row, col)];
    _previewChanges.push({ row, col, original });
    state.grid[state.idx(row, col)] = state.activeColor;
  }
  state.dispatchEvent(new CustomEvent('gridChange', { detail: { type: 'batch' } }));
}

toolManager.register('rect', {
  label: 'Rectángulo',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="18" height="12" rx="1" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  onPointerDown(cell) {
    if (!cell) return;
    _startCell = cell;
    _previewChanges = [];
  },

  onPointerMove(cell) {
    if (!_startCell || !cell) return;
    applyPreview(_startCell.row, _startCell.col, cell.row, cell.col);
  },

  onPointerUp(cell) {
    if (!_startCell) return;
    const end = cell || _startCell;
    for (const { row, col, original } of _previewChanges) {
      state.grid[state.idx(row, col)] = original;
    }
    _previewChanges = [];

    const pts = getRectCells(_startCell.row, _startCell.col, end.row, end.col, false)
      .filter(({ row, col }) => row >= 0 && row < state.rows && col >= 0 && col < state.cols)
      .map(({ row, col }) => ({ row, col, value: state.activeColor }));
    state.batchSetCells(pts);
    _startCell = null;
  },

  onDeactivate() {
    if (_previewChanges.length) {
      for (const { row, col, original } of _previewChanges) {
        state.grid[state.idx(row, col)] = original;
      }
      _previewChanges = [];
      state.dispatchEvent(new CustomEvent('gridChange', { detail: { type: 'batch' } }));
    }
    _startCell = null;
  },
});

