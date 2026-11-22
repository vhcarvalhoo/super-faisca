/* Service worker do Super Faísca: guarda o app no aparelho para funcionar sem internet.
   Ao publicar uma versão nova, aumente o número em VERSAO para o tablet baixar os arquivos novos. */
const VERSAO = "super-faisca-v1";
const ARQUIVOS = [
  "./", "./index.html", "./style.css", "./app.js", "./curriculo.js", "./motor.js", "./manifest.webmanifest",
  "./icones/icone-192.png", "./icones/icone-512.png", "./icones/icone-maskable-192.png",
  "./icones/icone-maskable-512.png", "./icones/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Primeiro o que está guardado (abre instantâneo e offline); se não tiver, busca na internet.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((guardado) =>
      guardado || fetch(e.request).then((resp) => {
        if (resp.ok && new URL(e.request.url).origin === self.location.origin) {
          const copia = resp.clone();
          caches.open(VERSAO).then((c) => c.put(e.request, copia));
        }
        return resp;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
