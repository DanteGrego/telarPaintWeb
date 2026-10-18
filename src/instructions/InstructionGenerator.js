/**
 * InstructionGenerator.js — Generates weaving instructions from the pattern grid
 *
 * Reads the grid row by row, compresses runs within each row,
 * then groups consecutive identical rows into repetitions.
 *
 * Returns an array of instruction objects:
 * {
 *   rowStart: number,
 *   rowEnd: number,
 *   segments: [{ color: 'A'|'B', count: number }, ...],
 *   repeated: boolean
 * }
 */

import { state, CELL_A } from '../store/AppState.js';

/**
 * Compress a flat row array into run-length encoded segments.
 * @param {Uint8Array|number[]} row
 * @returns {{ color: 'A'|'B', count: number }[]}
 */
function encodeRow(row) {
  const segments = [];
  let current = row[0];
  let count = 1;
  for (let i = 1; i < row.length; i++) {
    if (row[i] === current) {
      count++;
    } else {
      segments.push({ color: current === CELL_A ? 'A' : 'B', count });
      current = row[i];
      count = 1;
    }
  }
  segments.push({ color: current === CELL_A ? 'A' : 'B', count });
  return segments;
}

/**
 * Stringify segments for equality comparison.
 * @param {{ color: string, count: number }[]} segs
 * @returns {string}
 */
function segKey(segs) {
  return segs.map((s) => `${s.count}${s.color}`).join(',');
}

/**
 * Generate weaving instructions from current state.
 * @returns {{ rowStart: number, rowEnd: number, segments: object[], repeated: boolean }[]}
 */
export function generateInstructions() {
  const { rows, cols, grid } = state;
  if (rows === 0 || cols === 0) return [];

  // Step 1: encode each row
  const encoded = [];
  for (let r = 0; r < rows; r++) {
    const rowData = grid.subarray(r * cols, r * cols + cols);
    encoded.push({ segments: encodeRow(rowData), key: '' });
  }
  for (const e of encoded) e.key = segKey(e.segments);

  // Step 2: group consecutive identical rows
  const instructions = [];
  let i = 0;
  while (i < encoded.length) {
    let j = i + 1;
    while (j < encoded.length && encoded[j].key === encoded[i].key) j++;
    instructions.push({
      rowStart: i + 1,   // 1-indexed for display
      rowEnd: j,
      segments: encoded[i].segments,
      repeated: j - i > 1,
    });
    i = j;
  }

  return instructions;
}

/**
 * Format a single instruction using arrow symbols.
 * Single row:    "1 - 4↑ 2↓ 4↑"
 * Repeated rows: "2-5 - 4↑ 2↓ 4↑"
 *
 * @param {{ rowStart, rowEnd, segments, repeated }} instr
 * @returns {string}
 */
export function formatInstruction(instr) {
  const segText = instr.segments
    .map((s) => `${s.count}${s.color === 'A' ? '↑' : '↓'}`)
    .join(' ');

  const rowLabel = instr.rowStart === instr.rowEnd
    ? `${instr.rowStart}`
    : `${instr.rowStart}-${instr.rowEnd}`;

  return `${rowLabel} - ${segText}`;
}
