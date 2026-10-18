/**
 * DrawerMenu.js — Side drawer for pattern settings, save/load, export
 */

import { state } from '../store/AppState.js';
import { savePattern, listPatterns, loadPattern, deletePattern } from '../store/Storage.js';
import { exportManager } from '../export/ExportManager.js';
import { showToast } from './Toast.js';

const btnMenu          = document.getElementById('btn-menu');
const btnCloseDrawer   = document.getElementById('btn-close-drawer');
const drawerOverlay    = document.getElementById('drawer-overlay');
const drawer           = document.getElementById('drawer');

const inputTitle       = document.getElementById('input-title');
const inputCols        = document.getElementById('input-cols');
const inputRows        = document.getElementById('input-rows');
const btnNewPattern    = document.getElementById('btn-new-pattern');
const btnSave          = document.getElementById('btn-save');
const savedList        = document.getElementById('saved-patterns-list');
const btnExportPdf     = document.getElementById('btn-export-pdf');
const titleDisplay     = document.getElementById('pattern-title-display');

// ── Drawer open/close ─────────────────────────────────────────────────────────

function openDrawer() {
  drawer.classList.remove('hidden');
  drawerOverlay.classList.remove('hidden');
  drawerOverlay.setAttribute('aria-hidden', 'false');
  syncInputsFromState();
  refreshSavedList();
}

function closeDrawer() {
  drawer.classList.add('hidden');
  drawerOverlay.classList.add('hidden');
  drawerOverlay.setAttribute('aria-hidden', 'true');
}

btnMenu.addEventListener('click', openDrawer);
btnCloseDrawer.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// ── Sync inputs ───────────────────────────────────────────────────────────────

function syncInputsFromState() {
  inputTitle.value = state.title === 'Sin título' ? '' : state.title;
  inputCols.value = state.cols;
  inputRows.value = state.rows;
}

// Live title sync
inputTitle.addEventListener('input', () => {
  state.setTitle(inputTitle.value || 'Sin título');
});

state.addEventListener('titleChange', ({ detail }) => {
  titleDisplay.textContent = detail.title;
  document.title = `${detail.title} — TelarPaint`;
});

// ── New pattern ───────────────────────────────────────────────────────────────

btnNewPattern.addEventListener('click', () => {
  const cols = Math.max(1, Math.min(200, parseInt(inputCols.value) || 20));
  const rows = Math.max(1, Math.min(500, parseInt(inputRows.value) || 20));
  const title = inputTitle.value.trim() || 'Sin título';
  if (!confirm('¿Crear un nuevo patrón? Se perderán los cambios no guardados.')) return;
  state.reset(cols, rows, title);
  closeDrawer();
  showToast('Nuevo patrón creado');
});

// ── Save ──────────────────────────────────────────────────────────────────────

btnSave.addEventListener('click', async () => {
  try {
    const data = state.serialize();
    const saved = await savePattern(data);
    state.id = saved.id;
    showToast('Patrón guardado ✓');
    refreshSavedList();
  } catch (err) {
    console.error(err);
    showToast('Error al guardar');
  }
});

// ── Saved list ────────────────────────────────────────────────────────────────

async function refreshSavedList() {
  try {
    const patterns = await listPatterns();
    savedList.innerHTML = '';
    if (patterns.length === 0) {
      savedList.innerHTML = '<p style="color:var(--text-muted);font-size:12px">No hay patrones guardados</p>';
      return;
    }
    for (const p of patterns) {
      const item = document.createElement('div');
      item.className = 'saved-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'saved-item-name';
      nameSpan.textContent = `${p.title} (${p.cols}×${p.rows})`;
      nameSpan.title = `Última edición: ${new Date(p.updatedAt).toLocaleString('es')}`;
      nameSpan.addEventListener('click', async () => {
        try {
          const full = await loadPattern(p.id);
          state.loadPattern(full);
          closeDrawer();
          showToast(`Cargado: ${full.title}`);
        } catch (err) {
          showToast('Error al cargar');
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'saved-item-delete';
      delBtn.textContent = '✕';
      delBtn.title = 'Eliminar';
      delBtn.setAttribute('aria-label', `Eliminar ${p.title}`);
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`¿Eliminar "${p.title}"?`)) return;
        await deletePattern(p.id);
        if (state.id === p.id) state.id = null;
        showToast('Eliminado');
        refreshSavedList();
      });

      item.appendChild(nameSpan);
      item.appendChild(delBtn);
      savedList.appendChild(item);
    }
  } catch (err) {
    console.error(err);
  }
}

// ── Export ────────────────────────────────────────────────────────────────────

btnExportPdf.addEventListener('click', async () => {
  closeDrawer();
  showToast('Generando PDF…', 4000);
  try {
    await exportManager.run('pdf', state);
  } catch (err) {
    console.error(err);
    showToast('Error al generar PDF');
  }
});

