/**
 * FillTool.js — Flood fill (bote de pintura)
 *
 * BFS flood fill starting from the tapped cell,
 * replacing all connected cells of the same value.
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';

toolManager.register('fill', {
  label: 'Relleno',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <path d="M19 11L8.93 1.93a1 1 0 00-1.41 0L3.93 5.51a1 1 0 000 1.41L7 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M19 11l-8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M11 19c0 1.66-1.34 3-3 3s-3-1.34-3-3c0-2 3-5.5 3-5.5s3 3.5 3 5.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M20 11l-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M22 13l-9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  onPointerDown(cell) {
    if (!cell) return;
    const { row, col } = cell;
    const targetValue = state.getCell(row, col);
    const fillValue = state.activeColor;
    if (targetValue === fillValue) return;

    const changes = [];
    const { rows, cols, grid } = state;
    const visited = new Uint8Array(rows * cols);

    const queue = [row * cols + col];
    visited[queue[0]] = 1;

    while (queue.length) {
      const idx = queue.shift();
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      changes.push({ row: r, col: c, value: fillValue });

      const neighbors = [
        [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const ni = nr * cols + nc;
        if (!visited[ni] && grid[ni] === targetValue) {
          visited[ni] = 1;
          queue.push(ni);
        }
      }
    }

    state.batchSetCells(changes);
  },
});

