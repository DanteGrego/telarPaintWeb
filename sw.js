const CACHE_NAME = 'telarpaint-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/src/main.js',
  '/src/store/AppState.js',
  '/src/store/Storage.js',
  '/src/canvas/PatternCanvas.js',
  '/src/canvas/Interactions.js',
  '/src/tools/ToolManager.js',
  '/src/tools/PenTool.js',
  '/src/tools/EraserTool.js',
  '/src/tools/FillTool.js',
  '/src/tools/LineTool.js',
  '/src/tools/RectTool.js',
  '/src/tools/CircleTool.js',
  '/src/tools/SelectTool.js',
  '/src/tools/PasteTool.js',
  '/src/tools/PanTool.js',
  '/src/instructions/InstructionGenerator.js',
  '/src/export/ExportManager.js',
  '/src/export/PdfExporter.js',
  '/src/ui/Toolbar.js',
  '/src/ui/ColorPicker.js',
  '/src/ui/DrawerMenu.js',
  '/src/ui/InstructionsPanel.js',
  '/src/ui/Toast.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

