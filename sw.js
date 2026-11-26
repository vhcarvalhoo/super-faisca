/* Service worker do Super Faísca: guarda o app no aparelho para funcionar sem internet.
   Ao publicar uma versão nova, aumente o número em VERSAO para o tablet baixar os arquivos novos. */
const VERSAO = "super-faisca-v9";
const ARQUIVOS = [
  "./", "./index.html", "./style.css", "./app.js", "./curriculo.js", "./curriculo_extra.js", "./motor.js", "./conta.js", "./config.js", "./vozes.js",
  "./manifest.webmanifest", "./privacidade.html",
  "./personagens/faisca-basico.webp", "./personagens/faisca-esportivo.webp", "./personagens/faisca-heroi.webp",
  "./personagens/fada-basica.webp", "./personagens/fada-princesa.webp", "./personagens/fada-astronauta.webp",
  "./icones/icone-192.png", "./icones/icone-512.png", "./icones/icone-maskable-192.png",
  "./icones/icone-maskable-512.png", "./icones/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      // apaga versões antigas do app, mas nunca as vozes gravadas (cache próprio, cuidado pelo vozes.js)
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO && n !== "super-faisca-vozes").map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Primeiro o que está guardado (abre instantâneo e offline); se não tiver, busca na internet.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith("admin.html")) return; // login e painel: sempre pela internet
  if (url.pathname.includes("/vozes/")) return; // vozes gravadas: o vozes.js busca e guarda no cache dele
  // config.js: tenta a versão mais nova primeiro (para mudanças de preço/Pix chegarem logo)
  if (url.pathname.endsWith("config.js")) {
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSAO).then((k) => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
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
