// Guarda la app en el celular para que abra sin internet.
// Al cambiar cualquier archivo, subir el número de versión.
const VERSION = "labores-v14";
const ARCHIVOS = ["./", "./index.html", "./config.js", "./app.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("labores-") && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Con internet: trae la versión nueva y la guarda. Sin internet: usa la guardada.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, {cache: "no-cache"}).then(r => { const copia = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("./index.html")))
  );
});
