/**
 * PatternCanvas.js — Renders the pattern grid using CSS Grid cells
 *
 * Each cell is a <div> whose background-color reflects the current grid state.
 * Re-render is incremental: only changed cells are updated in the DOM.
 */

import { state, CELL_A } from '../store/AppState.js';

const GRID_EL = document.getElementById('pattern-grid');

// Track rendered cell elements for O(1) access
let _cells = []; // flat array matching state.grid

// ── Build / Rebuild DOM ────────────────────────────────────────────────────────

export function buildGrid() {
  GRID_EL.style.gridTemplateColumns = `repeat(${state.cols}, var(--cell-size))`;
  GRID_EL.style.gridTemplateRows    = `repeat(${state.rows}, var(--cell-size))`;

  // Reuse existing cells where possible, create/remove as needed
  const needed = state.cols * state.rows;

  // Remove extras
  while (_cells.length > needed) {
    const el = _cells.pop();
    el.remove();
  }

  // Add missing
  const frag = document.createDocumentFragment();
  while (_cells.length < needed) {
    const el = document.createElement('div');
    el.className = 'grid-cell';
    el.setAttribute('role', 'gridcell');
    _cells.push(el);
    frag.appendChild(el);
  }
  GRID_EL.appendChild(frag);

  // Paint all cells
  paintAll();
  updateSymmetryGuides();
}

// ── Symmetry Guides ────────────────────────────────────────────────────────────

export function updateSymmetryGuides() {
  const guideV = document.getElementById('sym-guide-v');
  const guideH = document.getElementById('sym-guide-h');
  if (!guideV || !guideH) return;

  const size = getCellSize();
  const totalW = state.cols * size;
  const totalH = state.rows * size;

  if (state.symH) {
    guideV.classList.remove('hidden');
    guideV.style.left = `${totalW / 2}px`;
    guideV.style.height = `${totalH}px`;
  } else {
    guideV.classList.add('hidden');
  }

  if (state.symV) {
    guideH.classList.remove('hidden');
    guideH.style.top = `${totalH / 2}px`;
    guideH.style.width = `${totalW}px`;
  } else {
    guideH.classList.add('hidden');
  }
}

// ── Full repaint ───────────────────────────────────────────────────────────────

export function paintAll() {
  const colorA = state.colorA;
  const colorB = state.colorB;
  const grid = state.grid;
  const n = _cells.length;
  for (let i = 0; i < n; i++) {
    _cells[i].style.backgroundColor = grid[i] === CELL_A ? colorA : colorB;
  }
}

// ── Incremental cell update ────────────────────────────────────────────────────

export function paintCell(row, col) {
  const i = row * state.cols + col;
  if (i < 0 || i >= _cells.length) return;
  const el = _cells[i];
  el.style.backgroundColor = state.grid[i] === CELL_A ? state.colorA : state.colorB;
}

// ── Apply zoom ─────────────────────────────────────────────────────────────────

export function applyZoom(zoom) {
  GRID_EL.style.transform = `scale(${zoom})`;
}

// ── Selection highlight ────────────────────────────────────────────────────────

export function renderSelection(sel) {
  // Clear previous
  for (const el of _cells) el.classList.remove('selected');
  if (!sel || state.activeTool !== 'select') return;
  const r1 = Math.min(sel.r1, sel.r2);
  const r2 = Math.max(sel.r1, sel.r2);
  const c1 = Math.min(sel.c1, sel.c2);
  const c2 = Math.max(sel.c1, sel.c2);
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const el = _cells[r * state.cols + c];
      if (el) el.classList.add('selected');
    }
  }
}

// ── Cell element lookup ────────────────────────────────────────────────────────

/** Return { row, col } from a pointer event target or null */
export function cellFromEvent(e) {
  let target = e.target;
  if (!target.classList.contains('grid-cell')) {
    target = target.closest('.grid-cell');
    if (!target) return null;
  }
  const i = _cells.indexOf(target);
  if (i < 0) return null;
  return { row: Math.floor(i / state.cols), col: i % state.cols };
}

/** Return { row, col } from coordinates relative to grid element */
export function cellFromCoords(x, y) {
  const size = getCellSize();
  const col = Math.floor(x / size);
  const row = Math.floor(y / size);
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return null;
  return { row, col };
}

function getCellSize() {
  const cssVal = getComputedStyle(document.documentElement).getPropertyValue('--cell-size').trim();
  return parseFloat(cssVal) || 28;
}

// ── Reactive subscriptions ─────────────────────────────────────────────────────

state.addEventListener('gridChange', (e) => {
  const { type, row, col } = e.detail;
  if (type === 'cell') {
    paintCell(row, col);
  } else if (type === 'batch') {
    paintAll();
  } else if (type === 'resize') {
    buildGrid();
  } else if (type === 'full') {
    buildGrid();
  }
});

state.addEventListener('colorsChange', () => paintAll());
state.addEventListener('zoomChange', (e) => applyZoom(e.detail.zoom));
state.addEventListener('selectionChange', (e) => renderSelection(e.detail.selection));
state.addEventListener('dimensionsChange', () => buildGrid());
state.addEventListener('symmetryChange', () => updateSymmetryGuides());
state.addEventListener('toolChange', () => {
  renderSelection(state.selection);
  if (state.activeTool !== 'paste') {
    const box = document.getElementById('paste-preview-box');
    if (box) box.classList.add('hidden');
  }
});

