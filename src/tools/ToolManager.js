/**
 * ToolManager.js — Open/Closed plugin registry for drawing tools
 *
 * Register a tool:
 *   toolManager.register('myTool', { label, icon, onPointerDown, onPointerMove, onPointerUp })
 *
 * Each tool receives (cell, event) where cell = { row, col } | null
 */

import { state } from '../store/AppState.js';

class ToolManager {
  constructor() {
    /** @type {Map<string, object>} */
    this._tools = new Map();
  }

  /**
   * Register a tool implementation.
   * @param {string} name - Unique tool identifier
   * @param {{ label: string, icon: string, onActivate?: fn, onDeactivate?: fn,
   *           onPointerDown?: fn, onPointerMove?: fn, onPointerUp?: fn }} impl
   */
  register(name, impl) {
    this._tools.set(name, impl);
  }

  get(name) {
    return this._tools.get(name);
  }

  getAll() {
    return this._tools;
  }

  getActive() {
    return this._tools.get(state.activeTool);
  }

  activate(name) {
    const prev = this.getActive();
    if (prev?.onDeactivate) prev.onDeactivate();
    state.setActiveTool(name);
    const next = this._tools.get(name);
    if (next?.onActivate) next.onActivate();
  }

  onPointerDown(cell, e) {
    const tool = this.getActive();
    if (tool?.onPointerDown) tool.onPointerDown(cell, e);
  }

  onPointerMove(cell, e) {
    const tool = this.getActive();
    if (tool?.onPointerMove) tool.onPointerMove(cell, e);
  }

  onPointerUp(cell, e) {
    const tool = this.getActive();
    if (tool?.onPointerUp) tool.onPointerUp(cell, e);
  }
}

export const toolManager = new ToolManager();

