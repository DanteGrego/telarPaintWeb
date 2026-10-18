/**
 * InstructionsPanel.js — Sliding panel showing weaving row instructions
 */

import { state } from '../store/AppState.js';
import { generateInstructions } from '../instructions/InstructionGenerator.js';

const btnInstructions       = document.getElementById('btn-instructions');
const btnCloseInstructions  = document.getElementById('btn-close-instructions');
const instrOverlay          = document.getElementById('instructions-overlay');
const instrPanel            = document.getElementById('instructions-panel');
const instrContent          = document.getElementById('instructions-content');

// ── Open / Close ──────────────────────────────────────────────────────────────

function openPanel() {
  renderInstructions();
  instrPanel.classList.remove('hidden');
  instrOverlay.classList.remove('hidden');
  instrOverlay.setAttribute('aria-hidden', 'false');
}

function closePanel() {
  instrPanel.classList.add('hidden');
  instrOverlay.classList.add('hidden');
  instrOverlay.setAttribute('aria-hidden', 'true');
}

btnInstructions.addEventListener('click', openPanel);
btnCloseInstructions.addEventListener('click', closePanel);
instrOverlay.addEventListener('click', closePanel);

// ── Render ────────────────────────────────────────────────────────────────────

function renderInstructions() {
  const instructions = generateInstructions();
  instrContent.innerHTML = '';

  if (instructions.length === 0) {
    instrContent.innerHTML = '<p style="color:var(--text-muted);padding:8px">No hay datos de patrón</p>';
    return;
  }

  const colorA = state.colorA;
  const colorB = state.colorB;

  for (const instr of instructions) {
    const div = document.createElement('div');
    div.className = 'instruction-row' + (instr.repeated ? ' repeated' : '');

    // Label
    const label = document.createElement('span');
    label.className = 'row-label';
    if (instr.rowStart === instr.rowEnd) {
      label.textContent = `Fila ${instr.rowStart}:`;
    } else {
      label.textContent = `Filas ${instr.rowStart}–${instr.rowEnd}:`;
    }

    // Detail: colored segments
    const detail = document.createElement('span');
    detail.className = 'row-detail';

    const segParts = instr.segments.map((seg, i) => {
      const sp = document.createElement('span');
      sp.className = 'instruction-segment ' + (seg.color === 'A' ? 'seg-a' : 'seg-b');

      const swatch = document.createElement('span');
      swatch.style.cssText = `
        display:inline-block;
        width:10px;height:10px;
        border-radius:2px;
        background:${seg.color === 'A' ? colorA : colorB};
        border:1px solid rgba(255,255,255,0.2);
        vertical-align:middle;
        margin-right:3px;
      `;

      sp.appendChild(swatch);
      sp.appendChild(document.createTextNode(
        `${seg.count} ${seg.color === 'A' ? 'arriba' : 'abajo'}${i < instr.segments.length - 1 ? ', ' : ''}`
      ));
      return sp;
    });

    if (instr.repeated) {
      const repeatLabel = document.createElement('em');
      repeatLabel.style.cssText = 'font-size:11px;color:var(--accent);display:block;margin-bottom:2px';
      repeatLabel.textContent = `× ${instr.rowEnd - instr.rowStart + 1} filas — `;
      detail.appendChild(repeatLabel);
    }

    segParts.forEach((sp) => detail.appendChild(sp));

    div.appendChild(label);
    div.appendChild(detail);
    instrContent.appendChild(div);
  }
}

// Re-render when panel is open and grid changes
state.addEventListener('gridChange', () => {
  if (!instrPanel.classList.contains('hidden')) {
    renderInstructions();
  }
});

