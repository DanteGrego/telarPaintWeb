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

    // Row label: "1" or "2-5"
    const label = document.createElement('span');
    label.className = 'row-label';
    label.textContent = instr.rowStart === instr.rowEnd
      ? `${instr.rowStart}`
      : `${instr.rowStart}-${instr.rowEnd}`;

    const dash = document.createElement('span');
    dash.className = 'row-dash';
    dash.textContent = ' - ';

    // Segments: "4↑ 2↓ 4↑" with each arrow colored
    const detail = document.createElement('span');
    detail.className = 'row-detail';

    instr.segments.forEach((seg, i) => {
      const sp = document.createElement('span');
      sp.className = 'instruction-segment';
      const mainColor = seg.color === 'A' ? colorA : colorB;
      const oppColor = seg.color === 'A' ? colorB : colorA;

      sp.style.color = mainColor;
      sp.style.fontWeight = '800';
      sp.style.fontSize = '16px';
      // Border with opposite yarn color for maximum visibility on any background
      sp.style.webkitTextStroke = `1px ${oppColor}`;
      sp.style.textStroke = `1px ${oppColor}`;
      sp.style.paintOrder = 'stroke fill';
      sp.style.textShadow = `
        -1px -1px 0 ${oppColor},
         1px -1px 0 ${oppColor},
        -1px  1px 0 ${oppColor},
         1px  1px 0 ${oppColor},
         0px -1px 0 ${oppColor},
         0px  1px 0 ${oppColor},
        -1px  0px 0 ${oppColor},
         1px  0px 0 ${oppColor}
      `;
      sp.textContent = `${seg.count}${seg.color === 'A' ? '↑' : '↓'}`;
      if (i < instr.segments.length - 1) {
        sp.style.marginRight = '8px';
      }
      detail.appendChild(sp);
    });

    div.appendChild(label);
    div.appendChild(dash);
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

