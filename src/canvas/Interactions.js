/**
 * Interactions.js — Pointer event handling for the canvas viewport
 *
 * Routes touch/mouse events to the active tool via ToolManager.
 * Handles drag state, preventing scroll while drawing, and pan mode.
 */

import { state } from '../store/AppState.js';
import { toolManager } from '../tools/ToolManager.js';
import { cellFromCoords } from './PatternCanvas.js';

const viewport = document.getElementById('canvas-viewport');
const grid = document.getElementById('pattern-grid');

let _isDown = false;
let _lastCell = null;

// ── Pointer coordinates → grid-relative ───────────────────────────────────────

function gridCoords(e) {
  const rect = grid.getBoundingClientRect();
  const touch = (e.touches && e.touches.length > 0)
    ? e.touches[0]
    : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null);
  const clientX = touch ? touch.clientX : (e.clientX ?? 0);
  const clientY = touch ? touch.clientY : (e.clientY ?? 0);
  const x = (clientX - rect.left) / state.zoom;
  const y = (clientY - rect.top) / state.zoom;
  return { x, y };
}

function cellFromPointerEvent(e) {
  const { x, y } = gridCoords(e);
  return cellFromCoords(x, y);
}

// ── Pan state ─────────────────────────────────────────────────────────────────

let _panStart = null;
let _panScrollStart = null;

function getClientPos(e) {
  const touch = (e.touches && e.touches.length > 0)
    ? e.touches[0]
    : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null);
  return {
    x: touch ? touch.clientX : (e.clientX ?? 0),
    y: touch ? touch.clientY : (e.clientY ?? 0),
  };
}

function startPan(e) {
  const pos = getClientPos(e);
  _panStart = pos;
  _panScrollStart = { x: viewport.scrollLeft, y: viewport.scrollTop };
  viewport.classList.add('panning');
}

function updatePan(e) {
  if (!_panStart) return;
  const pos = getClientPos(e);
  viewport.scrollLeft = _panScrollStart.x - (pos.x - _panStart.x);
  viewport.scrollTop  = _panScrollStart.y - (pos.y - _panStart.y);
}

function endPan() {
  _panStart = null;
  _panScrollStart = null;
  viewport.classList.remove('panning');
}

// ── Event handlers ─────────────────────────────────────────────────────────────

function onPointerDown(e) {
  // Middle button or space+click → pan
  if (e.button === 1 || state.activeTool === 'pan') {
    e.preventDefault();
    startPan(e);
    _isDown = true;
    return;
  }

  const cell = cellFromPointerEvent(e);
  _isDown = true;
  _lastCell = cell;

  if (cell) {
    toolManager.onPointerDown(cell, e);
  }
}

function onPointerMove(e) {
  if (!_isDown) return;

  if (state.activeTool === 'pan' || _panStart) {
    updatePan(e);
    return;
  }

  const cell = cellFromPointerEvent(e);
  if (!cell) return;

  // Avoid redundant events on same cell for performance
  if (_lastCell && cell.row === _lastCell.row && cell.col === _lastCell.col) return;
  _lastCell = cell;

  toolManager.onPointerMove(cell, e);
}

function onPointerUp(e) {
  if (!_isDown) return;
  _isDown = false;

  if (_panStart) {
    endPan();
    return;
  }

  const cell = cellFromPointerEvent(e) || _lastCell;
  toolManager.onPointerUp(cell, e);
  _lastCell = null;
}

// ── Touch handling for multi-finger pinch zoom ────────────────────────────────

let _lastPinchDist = null;

function pinchDistance(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.hypot(dx, dy);
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    _lastPinchDist = pinchDistance(e);
    return;
  }
  onPointerDown(e);
}

function onTouchMove(e) {
  if (e.touches.length === 2) {
    if (_lastPinchDist === null) return;
    const dist = pinchDistance(e);
    const ratio = dist / _lastPinchDist;
    _lastPinchDist = dist;
    state.setZoom(state.zoom * ratio);
    e.preventDefault();
    return;
  }
  e.preventDefault(); // prevent page scroll while drawing
  onPointerMove(e);
}

function onTouchEnd(e) {
  _lastPinchDist = null;
  onPointerUp(e);
}

// ── Wheel zoom ────────────────────────────────────────────────────────────────

function onWheel(e) {
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  state.setZoom(state.zoom + delta);
}

// ── Bind events ───────────────────────────────────────────────────────────────

viewport.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

viewport.addEventListener('touchstart', onTouchStart, { passive: false });
viewport.addEventListener('touchmove', onTouchMove, { passive: false });
viewport.addEventListener('touchend', onTouchEnd, { passive: true });

viewport.addEventListener('wheel', onWheel, { passive: false });

// Prevent context menu on long press / right click over grid
viewport.addEventListener('contextmenu', (e) => e.preventDefault());

