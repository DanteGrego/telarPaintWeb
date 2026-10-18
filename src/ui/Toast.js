/**
 * Toast.js — Non-intrusive notification toasts
 */

const toastEl = document.getElementById('toast');
let _timer = null;

/**
 * Show a toast message.
 * @param {string} message
 * @param {number} [duration=2000]
 */
export function showToast(message, duration = 2000) {
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(() => {
    toastEl.classList.remove('visible');
    _timer = null;
  }, duration);
}

