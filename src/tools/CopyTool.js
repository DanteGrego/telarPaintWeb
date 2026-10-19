/**
 * CopyTool.js — Direct toolbar action to copy current selection
 */

import { state } from '../store/AppState.js';
import { toolManager } from './ToolManager.js';
import { showToast } from '../ui/Toast.js';

toolManager.register('copy', {
  label: 'Copiar selección',
  icon: `<svg viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
  </svg>`,

  onActivate() {
    if (state.selection) {
      state.copySelection();
      showToast('Selección copiada ✓');
      toolManager.activate('paste');
    } else {
      showToast('Arrastra para seleccionar un área primero');
      toolManager.activate('select');
    }
  },
});

