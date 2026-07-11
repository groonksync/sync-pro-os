// Service Worker básico para habilitar la instalación de la PWA en Chrome
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Passthrough para cumplir con los criterios de instalación de Chrome
});
