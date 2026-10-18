/**
 * CircleTool.js — Circle outline using Bresenham midpoint algorithm
 *
 * Drag from center to define radius, release to commit.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _startCell = null;
let _previewChanges = [];

function circlePoints(cr, cc, radius) {
  const pts = new Set();
  const add = (r, c) => pts.add(`${r},${c}`);

  let x = radius, y = 0, p = 1 - radius;
  while (x >= y) {
    [x, -x].forEach((dx) => [y, -y].forEach((dy) => {
      add(cr + dx, cc + dy);
      add(cr + dy, cc + dx);
    }));
    y++;
    if (p <= 0) p += 2 * y + 1;
    else { x--; p += 2 * y - 2 * x + 1; }
  }
  return Array.from(pts).map((s) => {
    const [r, c] = s.split(',').map(Number);
    return { row: r, col: c };
  });
}

function applyPreview(r0, c0, r1, c1) {
  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const radius = Math.round(Math.hypot(r1 - r0, c1 - c0));
  const pts = circlePoints(r0, c0, radius);
  for (const { row, col } of pts) {
    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) continue;
    const original = state.grid[state.idx(row, col)];
    _previewChanges.push({ row, col, original });
    state.grid[state.idx(row, col)] = state.activeColor;
  }
  state.dispatchEvent(new CustomEvent('gridChange', { detail: { type: 'batch' } }));
}

toolManager.register('circle', {
  label: 'Círculo',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
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

    const radius = Math.round(Math.hypot(end.row - _startCell.row, end.col - _startCell.col));
    const pts = circlePoints(_startCell.row, _startCell.col, radius)
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

