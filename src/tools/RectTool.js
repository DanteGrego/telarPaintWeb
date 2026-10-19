/**
 * RectTool.js — Rectangle outline drawing with symmetry
 *
 * Drag to set bounds, release to commit.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _startCell = null;
let _lastMoveCell = null;
let _previewChanges = [];

function getRectCells(r0, c0, r1, c1) {
  const minR = Math.min(r0, r1), maxR = Math.max(r0, r1);
  const minC = Math.min(c0, c1), maxC = Math.max(c0, c1);
  const cells = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (r === minR || r === maxR || c === minC || c === maxC) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

function getAllRectPoints(r0, c0, r1, c1) {
  const pairs = [
    { p0: { r: r0, c: c0 }, p1: { r: r1, c: c1 } }
  ];

  const symH = state.symH;
  const symV = state.symV;
  const cols = state.cols;
  const rows = state.rows;

  if (symH) {
    pairs.push({
      p0: { r: r0, c: cols - 1 - c0 },
      p1: { r: r1, c: cols - 1 - c1 }
    });
  }
  if (symV) {
    pairs.push({
      p0: { r: rows - 1 - r0, c: c0 },
      p1: { r: rows - 1 - r1, c: c1 }
    });
  }
  if (symH && symV) {
    pairs.push({
      p0: { r: rows - 1 - r0, c: cols - 1 - c0 },
      p1: { r: rows - 1 - r1, c: cols - 1 - c1 }
    });
  }

  const seen = new Set();
  const allPoints = [];

  for (const { p0, p1 } of pairs) {
    const pts = getRectCells(p0.r, p0.c, p1.r, p1.c);
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

  const pts = getAllRectPoints(r0, c0, r1, c1);
  for (const { row, col } of pts) {
    const original = state.grid[state.idx(row, col)];
    _previewChanges.push({ row, col, original });
    state.grid[state.idx(row, col)] = state.activeColor;
  }
  state.dispatchEvent(new CustomEvent('gridChange', { detail: { type: 'batch' } }));
}

function commitRect(endCell) {
  if (!_startCell) return;
  const end = endCell || _lastMoveCell || _startCell;

  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const pts = getAllRectPoints(_startCell.row, _startCell.col, end.row, end.col);
  const changes = pts.map(({ row, col }) => ({ row, col, value: state.activeColor }));
  state.batchSetCells(changes);

  _startCell = null;
  _lastMoveCell = null;
}

toolManager.register('rect', {
  label: 'Rectángulo',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="18" height="12" rx="1" stroke="currentColor" stroke-width="2"/>
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
    commitRect(cell);
  },

  onDeactivate() {
    if (_startCell) {
      commitRect(_lastMoveCell || _startCell);
    }
  },
});
