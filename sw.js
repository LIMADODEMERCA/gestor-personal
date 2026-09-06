// Service worker mínimo: solo cachea el "cascarón" de la app (HTML, manifest, íconos)
// para que abra instantáneamente y sea instalable. Los datos siguen viniendo de
// Supabase por internet — esto NO guarda gastos/tareas offline, solo la interfaz.

const CACHE_NAME = "mi-gestor-shell-v1";
const ARCHIVOS_SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear llamadas a Supabase (API ni Storage) — esas siempre van a la red.
  if (url.hostname.endsWith("supabase.co")) return;

  event.respondWith(
    caches.match(event.request).then((cacheada) => {
      return (
        cacheada ||
        fetch(event.request).catch(() => {
          if (event.request.mode === "navigate") return caches.match("./index.html");
        })
      );
    })
  );
});
