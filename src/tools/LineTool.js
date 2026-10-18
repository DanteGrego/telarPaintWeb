/**
 * LineTool.js — Bresenham line drawing
 *
 * Press and drag to preview a line, release to commit.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _startCell = null;
let _previewChanges = [];

function bresenham(r0, c0, r1, c1) {
  const points = [];
  let dr = Math.abs(r1 - r0), dc = Math.abs(c1 - c0);
  let sr = r0 < r1 ? 1 : -1, sc = c0 < c1 ? 1 : -1;
  let err = dr - dc;
  let r = r0, c = c0;
  while (true) {
    points.push({ row: r, col: c });
    if (r === r1 && c === c1) break;
    const e2 = 2 * err;
    if (e2 > -dc) { err -= dc; r += sr; }
    if (e2 < dr)  { err += dr; c += sc; }
  }
  return points;
}

function applyPreview(r0, c0, r1, c1) {
  // Revert previous preview
  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const pts = bresenham(r0, c0, r1, c1);
  for (const { row, col } of pts) {
    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) continue;
    const original = state.grid[state.idx(row, col)];
    _previewChanges.push({ row, col, original });
    state.grid[state.idx(row, col)] = state.activeColor;
  }
  // Trigger repaint
  state.dispatchEvent(new CustomEvent('gridChange', { detail: { type: 'batch' } }));
}

toolManager.register('line', {
  label: 'Línea',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M5 19L19 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <circle cx="5" cy="19" r="2" fill="currentColor"/>
    <circle cx="19" cy="5" r="2" fill="currentColor"/>
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
    // Clear preview and commit
    for (const { row, col, original } of _previewChanges) {
      state.grid[state.idx(row, col)] = original;
    }
    _previewChanges = [];

    const pts = bresenham(_startCell.row, _startCell.col, end.row, end.col);
    const changes = pts
      .filter(({ row, col }) => row >= 0 && row < state.rows && col >= 0 && col < state.cols)
      .map(({ row, col }) => ({ row, col, value: state.activeColor }));
    state.batchSetCells(changes);
    _startCell = null;
  },

  onDeactivate() {
    // Clean up any dangling preview
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

