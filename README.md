# TelarPaint

**Diseñador de patrones para telar de peine** — PWA offline-first.

## Características

- 🎨 Lienzo bicolor punto a punto con cuadrícula dinámica
- 🖊️ Herramientas: lápiz, borrador, relleno, línea, rectángulo, círculo, selección, paneo
- ↩️ Deshacer / rehacer ilimitado
- 📋 Instrucciones de tejido automáticas (fila por fila con agrupación de repeticiones)
- 📄 Exportación a PDF (con diseño + instrucciones)
- 💾 Guardado local con IndexedDB (sin servidor, sin cuenta)
- 📱 PWA: instalable, funciona 100% sin internet
- 🔍 Zoom y paneo táctil (pinch-to-zoom)

## Estructura del Proyecto

```
telarPaintWeb/
├── index.html
├── manifest.json
├── sw.js                         # Service Worker (cache-first)
├── src/
│   ├── main.js                   # Bootstrap
│   ├── styles/main.css
│   ├── store/
│   │   ├── AppState.js           # Estado reactivo + historial
│   │   └── Storage.js            # IndexedDB
│   ├── canvas/
│   │   ├── PatternCanvas.js      # Renderer CSS Grid
│   │   └── Interactions.js       # Eventos táctiles/ratón
│   ├── tools/                    # Herramientas (registro abierto)
│   │   ├── ToolManager.js
│   │   ├── PenTool.js
│   │   ├── EraserTool.js
│   │   ├── FillTool.js
│   │   ├── LineTool.js
│   │   ├── RectTool.js
│   │   ├── CircleTool.js
│   │   ├── SelectTool.js
│   │   └── PanTool.js
│   ├── instructions/
│   │   └── InstructionGenerator.js
│   ├── export/
│   │   ├── ExportManager.js      # Registro abierto de exportadores
│   │   └── PdfExporter.js
│   └── ui/
│       ├── Toolbar.js
│       ├── ColorPicker.js
│       ├── DrawerMenu.js
│       └── InstructionsPanel.js
└── assets/icons/
```

## Cómo usar

### Desarrollo local

Cualquier servidor HTTP estático funciona. Ejemplo con Python:

```bash
python -m http.server 8080
```

O con Node.js:

```bash
npx serve .
```

Luego abre `http://localhost:8080` en el navegador.

> **Nota**: El Service Worker requiere HTTPS en producción o `localhost` en desarrollo.

### Extensibilidad (Open-Closed Principle)

**Agregar una nueva herramienta:**

```js
// src/tools/MyTool.js
import { toolManager } from './ToolManager.js';
toolManager.register('myTool', {
  label: 'Mi Herramienta',
  icon: `<svg>...</svg>`,
  onPointerDown(cell, e) { /* ... */ },
  onPointerMove(cell, e) { /* ... */ },
  onPointerUp(cell, e)   { /* ... */ },
});
```

Luego importa el archivo en `src/main.js`.

**Agregar un nuevo formato de exportación:**

```js
// src/export/SvgExporter.js
import { exportManager } from './ExportManager.js';
exportManager.register('svg', {
  label: 'Exportar SVG',
  async export(state) { /* ... */ },
});
```

## Atajos de teclado

| Acción | Atajo |
|--------|-------|
| Deshacer | `Ctrl+Z` |
| Rehacer | `Ctrl+Y` / `Ctrl+Shift+Z` |
| Copiar selección | `Ctrl+C` (con herramienta Selección activa) |
| Pegar selección | `Ctrl+V` (luego clic en destino) |
| Zoom | `Ctrl+Rueda` / Pellizco táctil |

