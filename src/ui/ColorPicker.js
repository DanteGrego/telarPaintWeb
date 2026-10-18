/**
 * ColorPicker.js — Manages color A/B pickers and active color switching
 */

import { state, CELL_A, CELL_B } from '../store/AppState.js';

const colorAPicker = document.getElementById('color-a-picker');
const colorBPicker = document.getElementById('color-b-picker');
const swatchA = document.getElementById('color-a-swatch');
const swatchB = document.getElementById('color-b-swatch');

function updateSwatches() {
  swatchA.style.backgroundColor = state.colorA;
  colorAPicker.value = state.colorA;
  swatchB.style.backgroundColor = state.colorB;
  colorBPicker.value = state.colorB;

  swatchA.classList.toggle('active-color', state.activeColor === CELL_A);
  swatchB.classList.toggle('active-color', state.activeColor === CELL_B);
}

// Clicking the swatch opens the native color picker
swatchA.addEventListener('click', () => {
  state.setActiveColor(CELL_A);
  colorAPicker.click();
});

swatchB.addEventListener('click', () => {
  state.setActiveColor(CELL_B);
  colorBPicker.click();
});

// Color input changes
colorAPicker.addEventListener('input', () => state.setColorA(colorAPicker.value));
colorBPicker.addEventListener('input', () => state.setColorB(colorBPicker.value));

// State subscriptions
state.addEventListener('colorsChange', updateSwatches);
state.addEventListener('activeColorChange', updateSwatches);

// Initialize
updateSwatches();

