/**
 * AppState.js — Central reactive state store
 *
 * Holds pattern grid, colors, active tool, undo/redo history.
 * Emits events via a simple EventTarget so modules stay decoupled.
 */

export const CELL_A = 0; // color A (foreground / arriba)
export const CELL_B = 1; // color B (background / abajo)

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 20;
const HISTORY_LIMIT = 200;

class AppState extends EventTarget {
  constructor() {
    super();

    this.id = null;           // saved pattern ID (for IndexedDB)
    this.title = 'Sin título';
    this.cols = DEFAULT_COLS;
    this.rows = DEFAULT_ROWS;

    /** @type {Uint8Array} Flat row-major grid: 0=A, 1=B */
    this.grid = new Uint8Array(DEFAULT_COLS * DEFAULT_ROWS).fill(CELL_B);

    this.colorA = '#1a1a2e';
    this.colorB = '#e8d5b7';

    this.activeTool = 'pen';
    this.activeColor = CELL_A; // which color is "drawing" (A or B)

    this.zoom = 1;

    /** Selection: { r1, c1, r2, c2 } or null */
    this.selection = null;

    /** Clipboard: { cols, rows, data: Uint8Array } */
    this.clipboard = null;

    // Undo/redo stacks — each entry is a serialized grid snapshot
    this._undoStack = [];
    this._redoStack = [];
  }

  // ── Grid Helpers ──────────────────────────────────────────

  idx(row, col) {
    return row * this.cols + col;
  }

  getCell(row, col) {
    return this.grid[this.idx(row, col)];
  }

  /** Set a single cell, pushing history */
  setCell(row, col, value, { pushHistory = true } = {}) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    if (pushHistory) this._pushHistory();
    this.grid[this.idx(row, col)] = value;
    this._emit('gridChange', { type: 'cell', row, col, value });
  }

  /** Batch-set cells from an array of { row, col, value } without repeated history pushes */
  batchSetCells(changes) {
    this._pushHistory();
    for (const { row, col, value } of changes) {
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) continue;
      this.grid[this.idx(row, col)] = value;
    }
    this._emit('gridChange', { type: 'batch' });
  }

  /** Replace entire grid (used by undo/redo) */
  _setGrid(grid) {
    this.grid = grid;
    this._emit('gridChange', { type: 'full' });
  }

  // ── Resize ────────────────────────────────────────────────

  resize(newCols, newRows) {
    this._pushHistory();
    const newGrid = new Uint8Array(newCols * newRows).fill(CELL_B);
    const copyRows = Math.min(this.rows, newRows);
    const copyCols = Math.min(this.cols, newCols);
    for (let r = 0; r < copyRows; r++) {
      for (let c = 0; c < copyCols; c++) {
        newGrid[r * newCols + c] = this.grid[r * this.cols + c];
      }
    }
    this.cols = newCols;
    this.rows = newRows;
    this.grid = newGrid;
    this._emit('gridChange', { type: 'resize' });
    this._emit('dimensionsChange');
  }

  addRows(count = 10) {
    this.resize(this.cols, this.rows + count);
  }

  // ── Colors & Tool ─────────────────────────────────────────

  setColorA(hex) { this.colorA = hex; this._emit('colorsChange'); }
  setColorB(hex) { this.colorB = hex; this._emit('colorsChange'); }

  swapColors() {
    [this.colorA, this.colorB] = [this.colorB, this.colorA];
    this._emit('colorsChange');
  }

  setActiveTool(name) {
    this.activeTool = name;
    this._emit('toolChange', { tool: name });
  }

  setActiveColor(which) {
    this.activeColor = which; // CELL_A or CELL_B
    this._emit('activeColorChange', { which });
  }

  setZoom(z) {
    this.zoom = Math.max(0.25, Math.min(4, z));
    this._emit('zoomChange', { zoom: this.zoom });
  }

  // ── Selection & Clipboard ─────────────────────────────────

  setSelection(sel) {
    this.selection = sel;
    this._emit('selectionChange', { selection: sel });
  }

  copySelection() {
    const sel = this.selection;
    if (!sel) return;
    const r1 = Math.min(sel.r1, sel.r2);
    const r2 = Math.max(sel.r1, sel.r2);
    const c1 = Math.min(sel.c1, sel.c2);
    const c2 = Math.max(sel.c1, sel.c2);
    const rows = r2 - r1 + 1;
    const cols = c2 - c1 + 1;
    const data = new Uint8Array(rows * cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        data[r * cols + c] = this.getCell(r1 + r, c1 + c);
      }
    }
    this.clipboard = { rows, cols, data };
    this._emit('clipboardChange');
  }

  pasteAt(startRow, startCol) {
    if (!this.clipboard) return;
    const { rows, cols, data } = this.clipboard;
    const changes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dr = startRow + r;
        const dc = startCol + c;
        if (dr < this.rows && dc < this.cols) {
          changes.push({ row: dr, col: dc, value: data[r * cols + c] });
        }
      }
    }
    this.batchSetCells(changes);
  }

  // ── Pattern Meta ──────────────────────────────────────────

  setTitle(title) {
    this.title = title || 'Sin título';
    this._emit('titleChange', { title: this.title });
  }

  /** Reset to a fresh pattern */
  reset(cols = DEFAULT_COLS, rows = DEFAULT_ROWS, title = 'Sin título') {
    this.cols = cols;
    this.rows = rows;
    this.grid = new Uint8Array(cols * rows).fill(CELL_B);
    this.title = title;
    this.id = null;
    this.selection = null;
    this._undoStack = [];
    this._redoStack = [];
    this._emit('gridChange', { type: 'full' });
    this._emit('dimensionsChange');
    this._emit('titleChange', { title });
    this._emit('historyChange');
  }

  /** Load a saved pattern object into state */
  loadPattern(pattern) {
    this.id = pattern.id;
    this.title = pattern.title;
    this.cols = pattern.cols;
    this.rows = pattern.rows;
    this.colorA = pattern.colorA;
    this.colorB = pattern.colorB;
    this.grid = new Uint8Array(pattern.grid);
    this.selection = null;
    this._undoStack = [];
    this._redoStack = [];
    this._emit('gridChange', { type: 'full' });
    this._emit('dimensionsChange');
    this._emit('colorsChange');
    this._emit('titleChange', { title: this.title });
    this._emit('historyChange');
  }

  /** Serialize current state for persistence */
  serialize() {
    return {
      id: this.id,
      title: this.title,
      cols: this.cols,
      rows: this.rows,
      colorA: this.colorA,
      colorB: this.colorB,
      grid: Array.from(this.grid),
      updatedAt: Date.now(),
    };
  }

  // ── Undo / Redo ───────────────────────────────────────────

  _pushHistory() {
    this._undoStack.push(this.grid.slice());
    if (this._undoStack.length > HISTORY_LIMIT) this._undoStack.shift();
    this._redoStack = [];
    this._emit('historyChange');
  }

  undo() {
    if (!this._undoStack.length) return;
    this._redoStack.push(this.grid.slice());
    this._setGrid(this._undoStack.pop());
    this._emit('historyChange');
  }

  redo() {
    if (!this._redoStack.length) return;
    this._undoStack.push(this.grid.slice());
    this._setGrid(this._redoStack.pop());
    this._emit('historyChange');
  }

  get canUndo() { return this._undoStack.length > 0; }
  get canRedo() { return this._redoStack.length > 0; }

  // ── Internals ─────────────────────────────────────────────

  _emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

// Singleton
export const state = new AppState();

