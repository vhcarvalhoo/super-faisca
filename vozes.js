/* Vozes gravadas (Azure, voz Francisca) do Super Faísca.
   As falas ficam em vozes/: um índice (indice.json) e pacotes de áudio de até 3 MB.
   Cada fala é dividida em frases; a gravação só toca se TODAS as frases existirem.
   Se faltar alguma (por exemplo, uma frase com o nome da criança), o app usa a voz do aparelho.
   Os pacotes ficam guardados no aparelho (cache "super-faisca-vozes") para funcionar sem internet. */
"use strict";

const Vozes = (() => {
  const PASTA = "vozes/";
  const CACHE = "super-faisca-vozes";
  let indice = null;
  let carregando = null;
  const pacotes = {};
  let audio = null;
  let rodada = 0;

  /** Divide em frases: "Oi! Tudo bem? Vamos." -> ["Oi!", "Tudo bem?", "Vamos."].
      Não corta números como 1.000 e junta pontuações seguidas ("...", "?!"). */
  function partes(txt) {
    const s = String(txt ?? "").replace(/\s+/g, " ").trim();
    const fim = ".!?…";
    const out = [];
    let ini = 0;
    for (let i = 0; i < s.length; i++) {
      if (!fim.includes(s[i])) continue;
      if (s[i] === "." && /\d/.test(s[i - 1] || "") && /\d/.test(s[i + 1] || "")) continue;
      while (i + 1 < s.length && fim.includes(s[i + 1])) i++;
      if (i + 1 < s.length && s[i + 1] !== " ") continue;
      const p = s.slice(ini, i + 1).trim();
      if (p) out.push(p);
      ini = i + 1;
    }
    const resto = s.slice(ini).trim();
    if (resto) out.push(resto);
    return out;
  }
  /** Chave de busca no índice. Falas devagar (sílabas) são gravadas à parte. */
  const chave = (parte, lento) => (lento ? "lento|" : "") + parte.toLowerCase();

  async function abrirCache() {
    try { return "caches" in window ? await caches.open(CACHE) : null; } catch (e) { return null; }
  }
  /** Busca na internet e guarda; sem internet, usa o que já está guardado. */
  async function buscar(nome, { primeiroRede = false } = {}) {
    const url = new URL(PASTA + nome, location.href).href;
    const cache = await abrirCache();
    if (!primeiroRede && cache) { const r = await cache.match(url); if (r) return r; }
    try {
      const r = await fetch(url, { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      if (cache) await cache.put(url, r.clone());
      return r;
    } catch (e) {
      if (cache) { const r = await cache.match(url); if (r) return r; }
      return null;
    }
  }

  /** Carrega o índice (uma vez). Se a pasta vozes/ não existir, fica tudo na voz do aparelho. */
  function carregar() {
    if (!carregando) {
      carregando = buscar("indice.json", { primeiroRede: true })
        .then((r) => (r ? r.json() : null))
        .then((j) => {
          indice = j && j.falas ? j : null;
          if (indice) limparPacotesAntigos();
          return indice;
        })
        .catch(() => null);
    }
    return carregando;
  }
  async function limparPacotesAntigos() {
    const cache = await abrirCache();
    if (!cache) return;
    const atuais = new Set(indice.pacotes.map((p) => new URL(PASTA + p, location.href).href));
    for (const req of await cache.keys()) {
      if (/\/vozes\/.+\.(mp3|bin)$/.test(req.url) && !atuais.has(req.url)) cache.delete(req);
    }
  }
  const prontos = {};
  function pacote(i) {
    if (!pacotes[i]) {
      pacotes[i] = buscar(indice.pacotes[i])
        .then((r) => (r ? r.arrayBuffer() : null))
        .catch(() => null)
        .then((b) => { if (b) prontos[i] = b; else delete pacotes[i]; return b; });
    }
    return pacotes[i];
  }

  const disponivel = () => !!indice;
  /** true se todas as frases da fala foram gravadas. */
  function tem(txt, lento) {
    if (!indice) return false;
    const ps = partes(txt);
    return ps.length > 0 && ps.every((p) => indice.falas[chave(p, lento)]);
  }
  /** true se a fala foi gravada E o áudio já está no aparelho (toca na hora).
      Se o pacote ainda não chegou, começa a baixar e devolve false: desta vez fala a voz do aparelho. */
  function pronta(txt, lento) {
    if (!tem(txt, lento)) return false;
    let ok = true;
    for (const p of partes(txt)) {
      const pac = indice.falas[chave(p, lento)][0];
      if (!prontos[pac]) { ok = false; pacote(pac); }
    }
    return ok;
  }
  /** Toca as frases em sequência. Devolve false se não conseguiu tocar (aí o app usa a voz do aparelho). */
  async function tocar(txt, lento) {
    parar();
    const minha = ++rodada;
    for (const p of partes(txt)) {
      const [pac, ini, tam] = indice.falas[chave(p, lento)];
      const buf = prontos[pac] || (await pacote(pac));
      if (minha !== rodada) return true;
      if (!buf) return false;
      const url = URL.createObjectURL(new Blob([buf.slice(ini, ini + tam)], { type: indice.tipo || "audio/mpeg" }));
      const ok = await new Promise((res) => {
        audio = new Audio(url);
        audio.onended = () => res(true);
        audio.onerror = () => res(false);
        audio.play().catch(() => res(false));
      });
      URL.revokeObjectURL(url);
      if (minha !== rodada) return true;
      if (!ok) return false;
    }
    return true;
  }
  function parar() {
    rodada++;
    if (audio) { audio.onended = audio.onerror = null; audio.pause(); audio = null; }
  }
  /** Baixa o primeiro pacote (as falas mais comuns) em segundo plano. */
  async function preparar() {
    await carregar();
    if (indice && indice.pacotes.length && !navigator.connection?.saveData) pacote(0);
  }

  return { partes, chave, carregar, preparar, disponivel, tem, pronta, tocar, parar };
})();
