/**
 * CircleTool.js — Circle outline drawing with symmetry
 *
 * Drag from center to define radius, release to commit.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _startCell = null;
let _lastMoveCell = null;
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

function getAllCirclePoints(r0, c0, radius) {
  const centers = [
    { r: r0, c: c0 }
  ];

  const symH = state.symH;
  const symV = state.symV;
  const cols = state.cols;
  const rows = state.rows;

  if (symH) {
    centers.push({ r: r0, c: cols - 1 - c0 });
  }
  if (symV) {
    centers.push({ r: rows - 1 - r0, c: c0 });
  }
  if (symH && symV) {
    centers.push({ r: rows - 1 - r0, c: cols - 1 - c0 });
  }

  const seen = new Set();
  const allPoints = [];

  for (const center of centers) {
    const pts = circlePoints(center.r, center.c, radius);
    for (const p of pts) {
      if (p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols) {
        const key = `${p.row},${p.col}`;
        if (!seen.has(key)) {
          seen.add(key);
          allPoints.push(p);
        }
      }
    }
  }

  return allPoints;
}

function applyPreview(r0, c0, r1, c1) {
  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const radius = Math.round(Math.hypot(r1 - r0, c1 - c0));
  const pts = getAllCirclePoints(r0, c0, radius);
  for (const { row, col } of pts) {
    const original = state.grid[state.idx(row, col)];
    _previewChanges.push({ row, col, original });
    state.grid[state.idx(row, col)] = state.activeColor;
  }
  state.dispatchEvent(new CustomEvent('gridChange', { detail: { type: 'batch' } }));
}

function commitCircle(endCell) {
  if (!_startCell) return;
  const end = endCell || _lastMoveCell || _startCell;

  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const radius = Math.round(Math.hypot(end.row - _startCell.row, end.col - _startCell.col));
  const pts = getAllCirclePoints(_startCell.row, _startCell.col, radius);
  const changes = pts.map(({ row, col }) => ({ row, col, value: state.activeColor }));
  state.batchSetCells(changes);

  _startCell = null;
  _lastMoveCell = null;
}

toolManager.register('circle', {
  label: 'Círculo',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  onPointerDown(cell) {
    if (!cell) return;
    _startCell = cell;
    _lastMoveCell = cell;
    _previewChanges = [];
  },

  onPointerMove(cell) {
    if (!_startCell || !cell) return;
    _lastMoveCell = cell;
    applyPreview(_startCell.row, _startCell.col, cell.row, cell.col);
  },

  onPointerUp(cell) {
    commitCircle(cell);
  },

  onDeactivate() {
    if (_startCell) {
      commitCircle(_lastMoveCell || _startCell);
    }
  },
});
