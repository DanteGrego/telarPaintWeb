/**
 * LineTool.js — Bresenham line drawing with symmetry
 *
 * Press and drag to preview a line, release to commit.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

let _startCell = null;
let _lastMoveCell = null;
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

function getAllLinePoints(r0, c0, r1, c1) {
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
    const pts = bresenham(p0.r, p0.c, p1.r, p1.c);
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
  // Revert previous preview
  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const pts = getAllLinePoints(r0, c0, r1, c1);
  for (const { row, col } of pts) {
    const original = state.grid[state.idx(row, col)];
    _previewChanges.push({ row, col, original });
    state.grid[state.idx(row, col)] = state.activeColor;
  }
  // Trigger repaint
  state.dispatchEvent(new CustomEvent('gridChange', { detail: { type: 'batch' } }));
}

function commitLine(endCell) {
  if (!_startCell) return;
  const end = endCell || _lastMoveCell || _startCell;

  // Clear preview from state.grid so batchSetCells gets clean original grid to store in undo history
  for (const { row, col, original } of _previewChanges) {
    state.grid[state.idx(row, col)] = original;
  }
  _previewChanges = [];

  const pts = getAllLinePoints(_startCell.row, _startCell.col, end.row, end.col);
  const changes = pts.map(({ row, col }) => ({ row, col, value: state.activeColor }));
  state.batchSetCells(changes);

  _startCell = null;
  _lastMoveCell = null;
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
    _lastMoveCell = cell;
    _previewChanges = [];
  },

  onPointerMove(cell) {
    if (!_startCell || !cell) return;
    _lastMoveCell = cell;
    applyPreview(_startCell.row, _startCell.col, cell.row, cell.col);
  },

  onPointerUp(cell) {
    commitLine(cell);
  },

  onDeactivate() {
    // If a line was in progress or previewed, commit it immediately so it is not lost
    if (_startCell) {
      commitLine(_lastMoveCell || _startCell);
    }
  },
});
