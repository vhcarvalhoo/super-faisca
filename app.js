/* Super Faísca — Letras & Números (interface)
   O conteúdo das lições vem de curriculo.js e curriculo_extra.js. Aqui ficam o
   desenho das telas, a voz, as legendas, os sons e o fluxo estilo "trilha".
   Regra de ouro: tudo o que é falado também aparece escrito na tela. */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const embaralhar = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let EST = null;          // estado vindo do servidor
let trilhaAtual = "leitura";
let L = null;            // lição em andamento
let segundosPendentes = 0;

/* ------------------------------------------------------------ voz */
const Voz = {
  voz: null,
  /** Vozes em português, da mais natural para a mais robótica. */
  lista() {
    if (!("speechSynthesis" in window)) return [];
    const nota = (v) => (/pt[-_]BR/i.test(v.lang) ? 4 : 0)
      + (/natural|online|neural|network|enhanced|premium|aprimorad|wavenet/i.test(v.name + " " + v.voiceURI) ? 6 : 0)
      + (/francisca|thalita|antonio|luciana|felipe|google/i.test(v.name) ? 2 : 0) + (v.localService === false ? 1 : 0);
    return speechSynthesis.getVoices().filter((v) => /^pt/i.test(v.lang)).sort((a, b) => nota(b) - nota(a));
  },
  ehNatural: (v) => /natural|online|neural|network|enhanced|premium|aprimorad|wavenet/i.test(v.name + " " + v.voiceURI),
  escolher() {
    const vs = this.lista();
    const preferida = EST?.config?.voz_nome;
    this.voz = vs.find((v) => v.name === preferida) || vs[0] || null;
  },
  /** Voz gravada (Azure): usada quando existe, a não ser que os pais escolham uma voz do aparelho. */
  usarGravada() { const n = EST?.config?.voz_nome || ""; return n === "" || n === VOZ_GRAVADA; },
  init() {
    Vozes.carregar().then(() => { if ($("#cfg-voz-nome")) preencherVozes(); });
    Vozes.preparar(); // baixa as gravações em segundo plano
    if (!("speechSynthesis" in window)) return;
    this.escolher();
    speechSynthesis.onvoiceschanged = () => { this.escolher(); if ($("#cfg-voz-nome")) preencherVozes(); };
  },
  async falar(txt, { rate } = {}) {
    if (!txt) return;
    Legenda.mostrar(txt);
    // 1) gravação do Azure, se esta fala foi gravada. Se o áudio ainda está baixando,
    //    espera um pouco por ele antes de cair na voz do aparelho.
    const lento = !!rate && rate < 0.8;
    const minha = ++this.vez;
    const gravada = somLigado() && this.usarGravada() && (Vozes.pronta(txt, lento) || (await Vozes.esperar(txt, lento, 3000)));
    if (minha !== this.vez) return; // outra fala começou enquanto esperava
    if (gravada) {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
      const btn = $("#btn-ouvir");
      btn?.classList.add("falando");
      const ok = await Vozes.tocar(txt, lento);
      btn?.classList.remove("falando");
      if (ok) { Legenda.terminou(txt); return; }
    }
    // 2) voz do aparelho
    Vozes.parar();
    return new Promise((res) => {
      const fimLegenda = () => { Legenda.terminou(txt); res(); };
      // sem som (ou aparelho sem voz): só o texto, com tempo para ler
      if (!somLigado() || !("speechSynthesis" in window)) { setTimeout(fimLegenda, 700 + txt.length * 45); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = "pt-BR";
      if (this.voz) u.voice = this.voz;
      u.rate = rate || (EST?.config?.voz_velocidade ?? 0.85);
      u.pitch = 1; // tom natural: subir o tom deixa a voz mais "robô"
      const btn = $("#btn-ouvir");
      let feito = false;
      const fim = () => { if (feito) return; feito = true; btn?.classList.remove("falando"); fimLegenda(); };
      u.onend = fim; u.onerror = fim;
      setTimeout(fim, 1800 + txt.length * 110); // segurança: alguns navegadores não disparam onend
      btn?.classList.add("falando");
      setTimeout(() => speechSynthesis.speak(u), 60);
    });
  },
  vez: 0, // conta as falas: uma fala que ficou esperando o áudio não toca por cima da seguinte
  parar() { this.vez++; Vozes.parar(); if ("speechSynthesis" in window) speechSynthesis.cancel(); },
};
const VOZ_GRAVADA = "__gravada__";

/* ------------------------------------------------------------ legendas */
const Legenda = {
  base: "", timer: null, timerGlobal: null,
  naLicao: () => $("#tela-licao").classList.contains("ativa"),
  /** Texto fixo da pergunta atual (volta para ele depois de falas curtas). */
  definirBase(txt) { this.base = txt; clearTimeout(this.timer); $("#legenda-licao").textContent = txt; },
  mostrar(txt) {
    if (!txt) return;
    txt = String(txt);
    clearTimeout(this.timer);
    if (this.naLicao()) { $("#legenda-licao").textContent = txt; return; }
    const g = $("#legenda-global");
    $("p", g).textContent = txt;
    g.classList.add("mostrar");
    clearTimeout(this.timerGlobal);
    this.timerGlobal = setTimeout(() => g.classList.remove("mostrar"), Math.max(3500, txt.length * 90));
  },
  terminou(txt) {
    if (!this.naLicao() || txt === this.base) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { if (this.naLicao() && this.base) $("#legenda-licao").textContent = this.base; }, 1600);
  },
  limpar() { this.base = ""; $("#legenda-licao").textContent = ""; },
};
const somLigado = () => EST?.config?.som !== false;
function atualizarBotoesSom() { $$(".btn-som-toggle").forEach((b) => { b.textContent = somLigado() ? "🔊" : "🔇"; b.title = somLigado() ? "Desligar o som" : "Ligar o som"; }); }

/* ------------------------------------------------------------ personagem */
const P = () => {
  const fada = EST?.personagem === "fada";
  const nome = fada ? (EST?.config?.nome_fada || "Lumi") : (EST?.config?.nome_heroi || "Faísca");
  return { fada, nome, artigo: fada ? "a" : "o", oNome: `${fada ? "A" : "O"} ${nome}`, quem: fada ? "a fada" : "o herói", doQuem: fada ? "da sua fada" : "do seu herói",
    titulo: fada ? "Minha fada" : "Meu herói", icone: fada ? "🧚" : "🦸" };
};

/* ------------------------------------------------------------ sons */
const Som = {
  ctx: null,
  tocar(notas, tipo = "sine", dur = 0.13, vol = 0.18) {
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = this.ctx.currentTime;
      notas.forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = tipo; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t0 + i * dur);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + i * dur + dur * 1.6);
        o.connect(g).connect(this.ctx.destination);
        o.start(t0 + i * dur); o.stop(t0 + i * dur + dur * 1.7);
      });
    } catch (e) { /* sem áudio */ }
  },
  certo() { this.tocar([523, 659, 784], "triangle", 0.09); },
  erro() { this.tocar([262, 220], "sine", 0.14, 0.12); },
  toque() { this.tocar([880], "sine", 0.05, 0.08); },
  fim() { this.tocar([523, 659, 784, 1047, 784, 1047], "triangle", 0.12); },
};

/* ------------------------------------------------------------ util */
// Tudo roda no aparelho: a "API" é o motor local (motor.js), sem servidor.
const api = (path, body) => Motor.api(path, body || {});
function mostrar(id) {
  if (id === "tela-licao") { clearTimeout(Legenda.timerGlobal); $("#legenda-global").classList.remove("mostrar"); }
  $$(".tela").forEach((t) => t.classList.remove("ativa"));
  $("#" + id).classList.add("ativa");
  $("#" + id).scrollTop = 0;
}
/* Cada personagem é uma imagem (personagens/<roupa>.webp) com camadas de efeito
   atrás (aura, asas, brilho) e na frente (faíscas e corações em órbita, estrelas). */
const IMG_INICIAL = { faisca: "faisca-basico", fada: "fada-basica" };
const NOME_PERSONAGEM = { faisca: "Super Faísca", fada: "Fada Lumi" };
const ASAS_SVG = `<svg class="asas-svg" viewBox="0 0 200 120" aria-hidden="true">
  <g class="asa-e"><path d="M98 60 C70 0 10 4 14 40 C18 66 60 70 98 60 Z"/><path d="M98 64 C66 72 30 100 46 114 C62 124 88 96 98 64 Z"/></g>
  <g class="asa-d"><path d="M102 60 C130 0 190 4 186 40 C182 66 140 70 102 60 Z"/><path d="M102 64 C134 72 170 100 154 114 C138 124 112 96 102 64 Z"/></g></svg>`;
function montarHeroi(quem, img, efeitos = []) {
  const ef = (id) => efeitos.includes(id);
  const orbita = ef("orbita") ? "⚡" : ef("coracoes") ? "💖" : "";
  return `<div class="heroi ${quem} ${efeitos.map((e) => "ef-" + e).join(" ")}">
    <div class="ef-fundo">${ef("asas") ? ASAS_SVG : ""}</div>
    <img src="personagens/${img}.webp" alt="${NOME_PERSONAGEM[quem]}" draggable="false">
    <div class="ef-frente">${orbita ? `<div class="orbita">${[0, 1, 2].map((i) => `<span style="--i:${i}"><i>${orbita}</i></span>`).join("")}</div>` : ""}
      ${ef("dourado") || ef("aurora") ? `<i class="brilho b1"></i><i class="brilho b2"></i><i class="brilho b3"></i><i class="brilho b4"></i>` : ""}</div>
  </div>`;
}
/** Desenha o personagem certo em cada espaço (.heroi-slot). Espaços com data-personagem
    (login e escolha) mostram sempre a roupa inicial, sem efeitos. */
function desenharHerois() {
  const atual = EST?.personagem || "faisca";
  $$(".heroi-slot").forEach((s) => {
    const fixo = !!s.dataset.personagem;
    const quem = s.dataset.personagem || atual;
    const img = fixo ? IMG_INICIAL[quem] : EST?.roupa?.img || IMG_INICIAL[quem];
    const efeitos = fixo ? [] : (EST?.poderes || []);
    const chave = `${quem}|${img}|${efeitos.join(",")}`;
    if (s.dataset.desenhado === chave && s.firstElementChild) return;
    s.innerHTML = montarHeroi(quem, img, efeitos);
    s.dataset.desenhado = chave;
  });
}
/** Barra "Nível N" com o progresso até o próximo prêmio. */
function barraNivel(evo, { etapas = false } = {}) {
  const prox = evo.proximo;
  const pct = prox ? ((evo.licoes_feitas % 10) / 10) * 100 : 100;
  const roupas = evo.roupas.filter((r) => r.tipo === "roupa");
  return `<div class="barra-nivel">
    <div class="bn-topo"><b>Nível ${evo.nivel}</b>${etapas ? "" : `<span>${evo.licoes_feitas} ${evo.licoes_feitas === 1 ? "missão" : "missões"}</span>`}</div>
    <div class="bn-trilho"><div class="bn-cheio" style="width:${pct}%"></div></div>
    ${etapas ? `<div class="bn-etapas">${roupas.map((r) => `<span class="${r.tem ? "ok" : ""}" title="${r.nome}">${r.icone}</span>`).join("")}</div>`
      : prox ? `<small>${prox.faltam === 1 ? "Falta 1 missão" : `Faltam ${prox.faltam} missões`} para: ${prox.icone} ${prox.nome}</small>` : `<small>Você ganhou tudo! Novas roupas em breve.</small>`}
  </div>`;
}
function desenharEscolha() {
  $$(".escolha-nivel").forEach((el) => { el.innerHTML = barraNivel(EST.inicio_trilhas[el.dataset.trilha], { etapas: true }); });
}

/* ------------------------------------------------------------ poderes */
/* Efeitos rápidos que aparecem por cima da tela (não atrapalham o toque). */
const Poderes = {
  seq: 0,
  tem: (id) => !!EST?.poderes?.includes(id),
  /** Cria um efeito centrado no elemento `alvo` e apaga depois de `ms`. */
  fx(alvo, classe, html, ms = 1400) {
    if (!alvo || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = alvo.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "fx " + classe;
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top + r.height / 2}px`;
    el.innerHTML = html;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
  },
  acerto() {
    this.seq++;
    const h = $("#heroi-licao");
    if (this.tem("rastro")) this.fx(h, "fx-rastro", `<i></i><span>⚡</span><span>⚡</span><span>⚡</span>`, 1100);
    if (this.tem("petalas")) {
      const p = Array.from({ length: 9 }, (_, i) => `<span style="left:${8 + i * 10 + Math.random() * 6}vw;animation-delay:${Math.random() * 0.4}s">🌸</span>`).join("");
      this.fx(document.body, "fx-petalas", p, 2000);
    }
    if (this.seq % 3 === 0) {
      if (this.tem("escudo")) this.fx(h, "fx-escudo", `<svg viewBox="0 0 100 100"><polygon points="50,4 92,27 92,73 50,96 8,73 8,27"/></svg>`, 1600);
      if (this.tem("bolha")) this.fx(h, "fx-bolha", `<div></div><span>🔤</span><span>🔢</span><span>⭐</span>`, 1800);
    }
  },
  erro() {
    this.seq = 0;
    if (this.tem("pistas")) {
      const s = Array.from({ length: 8 }, (_, i) => `<span style="--a:${i * 45}deg">✨</span>`).join("");
      this.fx($("#pergunta"), "fx-pistas", s, 1300);
    }
  },
  fim() {
    const slot = $("#tela-fim .heroi-slot");
    if (!this.tem("pulo") || !slot) return;
    slot.classList.remove("pulo-relampago"); void slot.offsetWidth; slot.classList.add("pulo-relampago");
    setTimeout(() => slot.classList.remove("pulo-relampago"), 1400);
    this.fx(slot, "fx-pulo", `<svg viewBox="0 0 200 100"><path d="M10 95 Q100 -30 190 95"/></svg><span>⚡</span><span>⚡</span><span>⚡</span>`, 1500);
  },
};

function aplicarCapa() {
  const raiz = document.documentElement;
  raiz.style.setProperty("--capa", EST.roupa?.cor || "#2563eb");
  raiz.dataset.nivel = EST.nivel || 1;
  raiz.dataset.personagem = EST.personagem || "faisca";
  $$(".nome-heroi").forEach((e) => (e.textContent = P().nome));
  $$(".artigo-nome").forEach((e) => (e.textContent = P().oNome));
  atualizarBotoesSom();
  desenharHerois();
}
function reagir(classe) {
  const h = $("#heroi-licao");
  h.classList.remove("feliz", "pensando"); void h.offsetWidth; h.classList.add(classe);
  setTimeout(() => h.classList.remove(classe), 1100);
  if (classe === "feliz") Poderes.acerto(); else if (classe === "pensando") Poderes.erro();
}
const nomeHeroi = () => P().nome;
const nomeCrianca = () => EST.config.nome_crianca || "";

/* ------------------------------------------------------------ tempo de tela */
function tempoEsgotado() {
  return EST && EST.hoje.segundos >= (EST.config.minutos_dia || 15) * 60;
}
setInterval(() => {
  if (document.visibilityState !== "visible" || !EST) return;
  const tela = $(".tela.ativa")?.id;
  if (tela !== "tela-licao" && tela !== "tela-mapa") return;
  segundosPendentes += 10; EST.hoje.segundos += 10;
  if (segundosPendentes >= 30) { api("/api/tempo", { segundos: segundosPendentes }); segundosPendentes = 0; }
}, 10000);

/* ------------------------------------------------------------ início e mapa */
async function carregar() {
  EST = await api("/api/estado");
  Voz.escolher();
  aplicarCapa();
}

async function comecar() {
  Som.toque();
  await carregar();
  Conta.checarEmSegundoPlano();
  if (!EST.config.personagem) { mostrar("tela-escolha"); desenharHerois(); desenharEscolha(); Voz.falar("Quem vai jogar? Escolha o seu personagem."); return; }
  if (tempoEsgotado()) return mostrarPausa();
  mostrar("tela-mapa");
  renderMapa();
  const nome = nomeCrianca();
  Voz.falar(`Oi${nome ? ", " + nome : ""}! Eu sou ${P().artigo} ${P().nome}. Escolha uma missão!`);
}

async function escolherPersonagem(p) {
  Som.certo();
  EST = await api("/api/config", { personagem: p });
  aplicarCapa();
  mostrar("tela-mapa");
  renderMapa();
  Voz.falar(p === "fada" ? "Oi! Eu sou a Fada Lumi. Vamos aprender juntas? Escolha uma missão!" : "Oi! Eu sou o Super Faísca. Vamos aprender juntos? Escolha uma missão!");
}

const CORES_UNIDADE = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#eab308", "#06b6d4"];

function renderMapa() {
  $("#st-xp").textContent = EST.xp;
  $("#st-seq").textContent = EST.sequencia;
  const meta = EST.config.meta_licoes || 2;
  $("#st-meta").innerHTML = Array.from({ length: meta }, (_, i) => `<i class="${i < EST.hoje.licoes ? "ok" : ""}"></i>`).join("");
  $("#btn-revisao").classList.toggle("escondido", !EST.revisao_disponivel);
  $$(".aba").forEach((a) => a.classList.toggle("ativa", a.dataset.trilha === trilhaAtual));

  const cam = $("#caminho");
  cam.innerHTML = "";
  let i = 0, atual = null;
  EST.trilhas[trilhaAtual].forEach((u, ui) => {
    const cor = CORES_UNIDADE[ui % CORES_UNIDADE.length];
    const feitas = u.lessons.filter((l) => l.done).length;
    cam.insertAdjacentHTML("beforeend",
      `<div class="unidade-banner" style="background:${cor}"><span>${u.title}</span><small>${feitas}/${u.lessons.length} ${u.done ? "✅" : ""}</small></div>`);
    u.lessons.forEach((l) => {
      const desloc = Math.round(Math.sin(i * 0.9) * 80);
      i++;
      const ehAtual = l.unlocked && !l.done && !atual;
      const wrap = document.createElement("div");
      wrap.className = "no-wrap";
      wrap.style.transform = `translateX(${desloc}px)`;
      const curto = [...l.icon].length <= 2 || /\p{Extended_Pictographic}/u.test(l.icon);
      const estrelas = l.done ? `<span class="no-estrelas">${"⭐".repeat(l.stars)}${"<span style='filter:grayscale(1);opacity:.35'>⭐</span>".repeat(3 - l.stars)}</span>` : "";
      wrap.innerHTML = `${ehAtual ? '<div class="balao-comecar">COMEÇAR</div>' : ""}
        <button class="no ${l.unlocked ? "" : "bloq"} ${ehAtual ? "atual" : ""} ${curto ? "" : "pequeno-txt"}" style="background:${cor}">
          ${l.unlocked ? l.icon : "🔒"}${estrelas}</button>
        <div class="no-rotulo">${l.title}</div>`;
      const btn = $(".no", wrap);
      btn.onclick = () => {
        if (!l.unlocked) { Som.erro(); btn.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], 300); Voz.falar("Termine a missão anterior para abrir esta!"); return; }
        Som.toque(); abrirLicao(l.id);
      };
      if (ehAtual) atual = wrap;
      cam.appendChild(wrap);
    });
  });
  // rola só na vertical até a próxima missão (nunca para os lados)
  const tela = $("#tela-mapa");
  tela.scrollLeft = 0;
  if (atual) setTimeout(() => {
    const alvo = atual.getBoundingClientRect().top - tela.getBoundingClientRect().top + tela.scrollTop - tela.clientHeight / 2 + 60;
    tela.scrollTo({ top: Math.max(0, alvo), left: 0, behavior: "smooth" });
  }, 200);
}

/* ------------------------------------------------------------ lição */
async function abrirLicao(id) {
  if (tempoEsgotado()) return mostrarPausa();
  const d = await api("/api/licao/iniciar", { id });
  if (!d.questions || !d.questions.length) return;
  L = { id: d.id, title: d.title, fila: d.questions.map((q) => ({ ...q })), pos: 0, resultados: [], inicio: Date.now() };
  Poderes.seq = 0;
  mostrar("tela-licao");
  desenharHerois();
  proxima();
}

function proxima() {
  esconderFeedback();
  Voz.parar();
  if (L.pos >= L.fila.length) return finalizar();
  const q = L.fila[L.pos];
  q._tent = 0; q._ok = false; q._dica = null;
  $("#barra-progresso").style.width = `${(L.pos / L.fila.length) * 100}%`;
  const el = $("#pergunta");
  el.innerHTML = "";
  Legenda.definirBase(q.type === "syllable_hear" ? `${q.speech} ${q.say}` : q.speech);
  (R[q.type] || R.desconhecido)(q, el);
  if (!q._falaPropria) falarPergunta(q);
}

async function falarPergunta(q) {
  await Voz.falar(q.speech);
  if (q.type === "syllable_hear") { await sleep(200); await Voz.falar(q.say, { rate: 0.7 }); }
}

function registrar(q, tentativas) {
  if (q._repeticao) return;
  L.resultados.push({ skill: q.skill, tentativas: tentativas ?? q._tent, avaliada: q.type !== "intro_letter" });
}
function repetirNoFim(q) {
  if (q._repeticao) return;
  const c = JSON.parse(JSON.stringify(q));
  Object.keys(c).filter((k) => k.startsWith("_")).forEach((k) => delete c[k]);
  c._repeticao = true;
  L.fila.push(c);
}

const ELOGIOS = ["Muito bem!", "Isso aí!", "Incrível!", "Mandou bem!", "Super!", "Que demais!", "Uau!", "Perfeito!"];

/** Resposta padrão de múltipla escolha. */
async function responder(q, certo, botao, { aoAcertar, revelar, falarResposta } = {}) {
  if (q._ok || L._travado) return;
  q._tent++;
  if (certo) {
    q._ok = true;
    botao?.classList.add("certa");
    Som.certo(); reagir("feliz");
    registrar(q);
    aoAcertar && aoAcertar();
    const elogio = ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)];
    mostrarFeedback("ok", "🎉", elogio, true);
    L._travado = true;
    if (falarResposta) await Voz.falar(falarResposta);
    await Voz.falar(elogio);
    await sleep(500);
    if (L && L.fila[L.pos] === q) avancar();
    return;
  }
  botao?.classList.add("errada");
  Som.erro(); reagir("pensando");
  if (q._tent >= 2) {
    q._ok = true;
    registrar(q);
    repetirNoFim(q);
    revelar && revelar();
    mostrarFeedback("erro", "💡", "Olha a resposta certa!", true);
    if (falarResposta) Voz.falar(`A resposta é... ${falarResposta}`);
  } else {
    mostrarFeedback("erro", "💪", "Quase! Tente de novo", false);
    await Voz.falar("Quase! Tente de novo.");
    if (q._dica) q._dica(); else falarPergunta(q);
    setTimeout(() => { if (!q._ok) esconderFeedback(); }, 900);
  }
}

function avancar() {
  L._travado = false;
  L.pos++;
  proxima();
}

function mostrarFeedback(tipo, icone, msg, comBotao) {
  const f = $("#feedback");
  f.className = "feedback mostrar " + (tipo === "erro" ? "erro " : "") + (comBotao ? "com-btn" : "");
  $("#fb-icone").textContent = icone;
  $("#fb-msg").textContent = msg;
}
function esconderFeedback() { $("#feedback").className = "feedback"; }

async function finalizar() {
  $("#barra-progresso").style.width = "100%";
  const r = await api("/api/licao/concluir", { id: L.id, resultados: L.resultados });
  const res = r.resultado;
  EST = r.estado;
  aplicarCapa();
  mostrar("tela-fim");
  desenharHerois();
  Som.fim();
  confete();
  $("#fim-titulo").textContent = ["", "Boa tentativa!", "Muito bem!", "Missão perfeita!"][res.estrelas];
  $("#fim-estrelas").innerHTML = [1, 2, 3].map((n) => `<span class="${n <= res.estrelas ? "" : "apagada"}" style="animation-delay:${n * 0.25}s">⭐</span>`).join("");
  $("#fim-xp").textContent = res.xp;
  const premios = [
    ...res.medalhas.map((m) => `<div class="premio">${m.icone} Nova medalha: ${m.nome}!</div>`),
    ...(res.ganhos || []).map((g) => `<div class="premio premio-${g.tipo}">${g.icone} ${{ roupa: "Roupa nova", poder: "Poder novo", efeito: "Evolução" }[g.tipo]}: ${g.nome}!</div>`),
  ];
  $("#fim-premios").innerHTML = premios.join("");
  $("#fim-nivel").innerHTML = barraNivel(EST);
  Poderes.fim();
  const nome = nomeCrianca();
  let fala = `${["", "Boa tentativa", "Muito bem", "Missão perfeita"][res.estrelas]}${nome ? ", " + nome : ""}! Você ganhou ${res.xp} pontos de energia!`;
  if (res.medalhas.length) fala += " E ganhou uma medalha nova!";
  if (res.subiu_nivel) fala += ` Você chegou ao nível ${EST.nivel}!`;
  for (const g of res.ganhos || []) {
    if (g.tipo === "roupa") fala += ` Ganhou uma roupa nova: ${g.nome}! Toque n${P().fada ? "a fada" : "o herói"} para trocar.`;
    else if (g.tipo === "poder") fala += ` Ganhou um poder novo: ${g.nome}!`;
    else fala += ` ${P().oNome} evoluiu: ${g.nome}!`;
  }
  Voz.falar(fala);
  L = null;
}

function sairLicao() {
  Voz.parar();
  Legenda.limpar();
  L = null;
  mostrar("tela-mapa");
  renderMapa();
}

/* ------------------------------------------------------------ peças de interface */
function opcoes(el, valores, { classe = "", rotulo = (v) => v, aoTocar } = {}) {
  const box = document.createElement("div");
  box.className = "opcoes";
  valores.forEach((v) => {
    const b = document.createElement("button");
    b.className = "op " + classe;
    b.innerHTML = rotulo(v);
    b.dataset.v = v;
    b.onclick = () => aoTocar(v, b);
    box.appendChild(b);
  });
  el.appendChild(box);
  return box;
}
function revelarOpcao(box, valor) {
  $$(".op", box).forEach((b) => { if (String(b.dataset.v) === String(valor)) b.classList.add("revelar"); });
}
function escolhaSimples(q, el, { classe = "", rotulo, falar } = {}) {
  const box = opcoes(el, q.choices, {
    classe, rotulo,
    aoTocar: (v, b) => responder(q, String(v) === String(q.answer), b, {
      revelar: () => revelarOpcao(box, q.answer),
      falarResposta: falar ? falar(q.answer) : null,
    }),
  });
  return box;
}
const repetir = (emoji, n, extra = "") => Array.from({ length: n }, () => `<span ${extra}>${emoji}</span>`).join("");
function silabasHTML(sils) { return sils.map((s) => `<span class="sil">${s}</span>`).join(""); }
async function lerSilabas(container, sils, palavra) {
  const spans = $$(".sil", container);
  for (let i = 0; i < sils.length; i++) {
    spans[i]?.classList.add("lendo");
    await Voz.falar(sils[i].toLowerCase(), { rate: 0.7 });
    spans[i]?.classList.remove("lendo");
    await sleep(150);
  }
  if (palavra) await Voz.falar(palavra.toLowerCase());
}

/* ------------------------------------------------------------ tipos de pergunta */
const R = {};

R.desconhecido = (q, el) => { el.textContent = "?"; setTimeout(avancar, 500); };

R.intro_letter = (q, el) => {
  const pal = q.word, gr = q.letter.split(" ")[0];
  const i = pal.indexOf(gr);
  const palHTML = i >= 0 ? `${pal.slice(0, i)}<span class="sil lendo">${gr}</span>${pal.slice(i + gr.length)}` : `<span class="sil lendo">${pal[0]}</span>${pal.slice(1)}`;
  el.innerHTML = `<div class="letra-gigante ${q.letter.length > 2 ? "letra-longa" : ""}">${q.letter}</div>
    <div class="figura media">${q.emoji}</div>
    <div class="palavra-grande">${palHTML}</div>`;
  registrar(q, 1);
  q._ok = true;
  mostrarFeedback("ok", P().icone, q.letter.length > 1 ? "Som novo!" : "Nova letra!", true);
};

R.letter_sound = (q, el) => {
  el.innerHTML = `<div class="figura">👂</div>`;
  escolhaSimples(q, el, { falar: (a) => a });
};

R.initial_letter = (q, el) => {
  el.innerHTML = `<div class="figura">${q.emoji}</div><div class="palavra-grande" id="pal-ini" style="visibility:hidden">${q.word}</div>`;
  const box = opcoes(el, q.choices, {
    aoTocar: (v, b) => responder(q, v === q.answer, b, {
      revelar: () => revelarOpcao(box, q.answer),
      aoAcertar: () => { const p = $("#pal-ini"); p.style.visibility = "visible"; p.innerHTML = `<span class="sil lendo">${q.word[0]}</span>${q.word.slice(1)}`; },
      falarResposta: `${q.word.toLowerCase()} começa com ${q.answer}`,
    }),
  });
};

R.blend = (q, el) => {
  el.innerHTML = `<div class="juntar" id="juntar"><div class="peca cons">${q.parts[0]}</div><div class="sinal">+</div><div class="peca vog">${q.parts[1]}</div></div>
    <div class="sinal">=</div>`;
  const box = opcoes(el, q.choices, {
    aoTocar: (v, b) => responder(q, v === q.answer, b, { revelar: () => revelarOpcao(box, q.answer), falarResposta: q.say }),
  });
  q._falaPropria = true;
  const animar = async () => {
    await Voz.falar(q.speech);
    const j = $("#juntar"); if (!j) return;
    j.classList.remove("unir"); void j.offsetWidth; j.classList.add("unir");
    await sleep(700);
    await Voz.falar(q.say, { rate: 0.7 });
  };
  q._dica = animar;
  animar();
};

R.syllable_hear = (q, el) => {
  el.innerHTML = `<div class="figura">👂</div>`;
  escolhaSimples(q, el, { falar: (a) => a.toLowerCase() });
};

R.build_word = (q, el) => {
  el.innerHTML = `<div class="figura ${q.frase ? "media" : ""}">${q.emoji}</div>
    <div class="slots ${q.frase ? "slots-frase" : ""}">${q.syllables.map(() => '<div class="slot"></div>').join("")}</div>`;
  let pos = 0, erros = 0;
  const slots = $$(".slot", el);
  const box = opcoes(el, q.tiles, {
    classe: q.frase ? "txt" : "",
    aoTocar: async (v, b) => {
      if (q._ok) return;
      if (v === q.syllables[pos]) {
        Som.toque();
        slots[pos].textContent = v; slots[pos].classList.add("cheio");
        b.style.visibility = "hidden";
        pos++;
        Voz.falar(v.toLowerCase(), { rate: 0.75 });
        if (pos === q.syllables.length) {
          await sleep(600);
          q._tent = erros; // responder soma +1
          responder(q, true, null, { falarResposta: q.word.toLowerCase() });
        }
      } else {
        erros++;
        Som.erro(); reagir("pensando");
        b.classList.remove("errada"); void b.offsetWidth;
        b.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "none" }], 300);
        if (erros >= 2) {
          $$(".op", box).forEach((x) => x.classList.toggle("revelar", x.dataset.v === q.syllables[pos] && x.style.visibility !== "hidden"));
          if (erros === 2) repetirNoFim(q);
        }
        await Voz.falar(q.frase ? `A frase é: ${q.word.toLowerCase()}. Agora a palavra ${q.syllables[pos].toLowerCase()}.` : `Escute: ${q.word.toLowerCase()}. Agora a sílaba ${q.syllables[pos].toLowerCase()}.`);
      }
    },
  });
};

R.read_word = (q, el) => {
  const sils = q.minusculas ? q.syllables.map((s) => s.toLowerCase()) : q.syllables;
  el.innerHTML = `<div class="palavra-grande ${q.minusculas ? "minusc" : ""}" id="pal-ler">${silabasHTML(sils)}</div>`;
  q._dica = () => lerSilabas($("#pal-ler"), sils, null);
  escolhaSimples(q, el, { classe: "emoji", falar: () => q.word.toLowerCase() });
};

R.missing_syllable = (q, el) => {
  el.innerHTML = `<div class="figura">${q.emoji}</div>
    <div class="slots">${q.shown.map((s) => `<div class="slot ${s === "_" ? "vazio-q" : "cheio"}">${s === "_" ? "?" : s}</div>`).join("")}</div>`;
  const box = opcoes(el, q.choices, {
    aoTocar: (v, b) => responder(q, v === q.answer, b, {
      revelar: () => revelarOpcao(box, q.answer),
      aoAcertar: () => { const s = $(".slot.vazio-q", el); s.textContent = q.answer; s.classList.add("cheio"); },
      falarResposta: q.word.toLowerCase(),
    }),
  });
};

R.read_sentence = (q, el) => {
  const palavras = q.sentence.split(" ");
  el.innerHTML = `<div class="palavra-grande" id="frase" style="font-size:2.3rem;letter-spacing:2px">${palavras.map((p) => `<span class="sil">${p}</span>`).join(" ")}</div>`;
  q._dica = () => lerSilabas($("#frase"), palavras, null);
  escolhaSimples(q, el, { classe: "emoji", falar: () => q.sentence.toLowerCase() });
};

/* ---- traçado (escrita) ---- */
R.trace = (q, el) => {
  const tam = Math.min(330, window.innerWidth - 40, window.innerHeight - 330);
  const dpr = window.devicePixelRatio || 1;
  el.innerHTML = `<div class="tracar-wrap"><canvas id="canvas-tracar" width="${tam * dpr}" height="${tam * dpr}" style="width:${tam}px;height:${tam}px"></canvas></div>
    <div class="linha-btns"><button class="btn btn-cinza" id="tr-limpar">↺ Apagar</button><button class="btn btn-verde" id="tr-pronto">Pronto! ✓</button></div>`;
  const cv = $("#canvas-tracar"), ctx = cv.getContext("2d");
  const W = cv.width;
  const fonte = `900 ${W * 0.74}px Arial, sans-serif`;
  const desenharGuia = () => {
    ctx.clearRect(0, 0, W, W);
    ctx.font = fonte; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#e2e8f0"; ctx.fillText(q.glyph, W / 2, W * 0.54);
    ctx.setLineDash([W * 0.025, W * 0.02]); ctx.lineWidth = W * 0.008; ctx.strokeStyle = "#94a3b8";
    ctx.strokeText(q.glyph, W / 2, W * 0.54); ctx.setLineDash([]);
  };
  desenharGuia();
  // máscara da letra (para medir o quanto foi coberto)
  const mascara = document.createElement("canvas"); mascara.width = mascara.height = W;
  const mc = mascara.getContext("2d");
  mc.font = fonte; mc.textAlign = "center"; mc.textBaseline = "middle"; mc.fillStyle = "#000";
  mc.fillText(q.glyph, W / 2, W * 0.54);
  const folga = document.createElement("canvas"); folga.width = folga.height = W;
  const fc = folga.getContext("2d");
  fc.font = fonte; fc.textAlign = "center"; fc.textBaseline = "middle";
  fc.fillText(q.glyph, W / 2, W * 0.54); fc.lineWidth = W * 0.12; fc.lineJoin = "round"; fc.strokeText(q.glyph, W / 2, W * 0.54);
  const tinta = document.createElement("canvas"); tinta.width = tinta.height = W;
  const tc = tinta.getContext("2d");
  const cor = getComputedStyle(document.documentElement).getPropertyValue("--capa").trim() || "#ff8a1f";
  [ctx, tc].forEach((c) => { c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = W * 0.085; c.strokeStyle = cor; });
  let desenhando = false, ult = null;
  const ponto = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
  cv.onpointerdown = (e) => { desenhando = true; ult = ponto(e); cv.setPointerCapture(e.pointerId); traco(ult, ult); };
  cv.onpointermove = (e) => { if (!desenhando) return; const p = ponto(e); traco(ult, p); ult = p; };
  cv.onpointerup = cv.onpointercancel = () => { desenhando = false; };
  function traco(a, b) {
    [ctx, tc].forEach((c) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });
  }
  const limpar = () => { desenharGuia(); tc.clearRect(0, 0, W, W); [ctx, tc].forEach((c) => { c.lineWidth = W * 0.085; c.strokeStyle = cor; c.lineCap = "round"; }); };
  $("#tr-limpar").onclick = limpar;
  $("#tr-pronto").onclick = async () => {
    if (q._ok) return;
    const m = mc.getImageData(0, 0, W, W).data, f = fc.getImageData(0, 0, W, W).data, t = tc.getImageData(0, 0, W, W).data;
    let letra = 0, coberto = 0, tintaTotal = 0, fora = 0;
    for (let i = 3; i < m.length; i += 4 * 3) {
      const naLetra = m[i] > 0, temTinta = t[i] > 0;
      if (naLetra) { letra++; if (temTinta) coberto++; }
      if (temTinta) { tintaTotal++; if (f[i] === 0) fora++; }
    }
    const cobertura = coberto / Math.max(1, letra), sobra = fora / Math.max(1, tintaTotal);
    q._tent++;
    if (cobertura >= 0.55 && sobra <= 0.45) {
      q._tent--; // responder soma
      responder(q, true, null, { falarResposta: /\d/.test(q.glyph) ? "Que número bonito!" : "Que letra bonita!" });
    } else if (q._tent >= 2) {
      q._ok = true; registrar(q);
      mostrarFeedback("ok", "✏️", "Bom treino!", true);
      Voz.falar("Bom treino! Vamos continuar.");
    } else {
      Som.erro(); reagir("pensando");
      mostrarFeedback("erro", "✏️", cobertura < 0.55 ? "Passe por toda a letra!" : "Fique dentro da linha!", false);
      await Voz.falar(cobertura < 0.55 ? "Passe o dedo por toda a linha, devagarinho." : "Tente ficar dentro da linha pontilhada.");
      limpar(); esconderFeedback();
    }
  };
};

/* ---- matemática ---- */
function opcoesNumero(q, el) {
  const box = opcoes(el, q.choices, {
    classe: "num",
    aoTocar: (v, b) => responder(q, Number(v) === Number(q.answer), b, {
      revelar: () => revelarOpcao(box, q.answer), falarResposta: String(q.answer),
    }),
  });
  return box;
}

R.count = (q, el) => {
  const caixa = document.createElement("div");
  caixa.className = "caixa-itens" + (q.layout === "line" ? " linha" : "");
  if (q.layout === "line") {
    caixa.innerHTML = repetir(q.emoji, q.n, 'class="item"');
  } else {
    const cel = embaralhar(Array.from({ length: 15 }, (_, i) => i)).slice(0, q.n);
    cel.forEach((c) => {
      const col = c % 5, lin = Math.floor(c / 5);
      const x = 4 + col * 19 + Math.random() * 6, y = 6 + lin * 31 + Math.random() * 8;
      caixa.insertAdjacentHTML("beforeend", `<span class="item" style="left:${x}%;top:${y}%">${q.emoji}</span>`);
    });
  }
  let contados = 0;
  $$(".item", caixa).forEach((it) => {
    it.onclick = () => {
      if (it.classList.contains("contado")) return;
      contados++; it.classList.add("contado");
      it.insertAdjacentHTML("beforeend", `<span class="marca">${contados}</span>`);
      Som.toque(); Voz.falar(String(contados), { rate: 1 });
    };
  });
  el.appendChild(caixa);
  el.insertAdjacentHTML("beforeend", `<p class="dica-contar">Toque em cada um para contar 👆</p>`);
  opcoesNumero(q, el);
};

const DADO = { 1: [[50, 50]], 2: [[27, 27], [73, 73]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[27, 27], [73, 27], [27, 73], [73, 73]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], 6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]] };

function quadroDez(n, pequeno = false) {
  return `<div class="quadro-dez ${pequeno ? "pequeno" : ""}">${Array.from({ length: 10 }, (_, i) => `<div class="${i < n ? "c" : ""}"></div>`).join("")}</div>`;
}

R.subitize = (q, el) => {
  const area = document.createElement("div");
  area.style.minHeight = "210px"; area.style.display = "flex"; area.style.alignItems = "center";
  el.appendChild(area);
  const mostrarPadrao = () => {
    if (q.frame === "tenframe" || q.n > 6) { area.innerHTML = quadroDez(q.n); }
    else {
      let pos = DADO[q.n];
      if (q.frame === "random") {
        const cel = embaralhar([[20, 20], [50, 18], [80, 22], [22, 50], [52, 52], [80, 50], [20, 80], [50, 82], [80, 78]]).slice(0, q.n);
        pos = cel;
      }
      area.innerHTML = `<div class="dado">${pos.map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join("")}</div>`;
    }
    setTimeout(() => { if (!q._ok) area.innerHTML = `<div class="cobertura">☁️</div>`; }, 1600);
  };
  q._dica = mostrarPadrao;
  mostrarPadrao();
  opcoesNumero(q, el);
  el.insertAdjacentHTML("beforeend", `<button class="btn btn-cinza" id="ver-de-novo">👀 Ver de novo</button>`);
  $("#ver-de-novo").onclick = mostrarPadrao;
};

R.numeral_to_qty = (q, el) => {
  el.innerHTML = `<div class="numero-gigante">${q.numeral}</div>`;
  const box = opcoes(el, q.groups, {
    classe: "grupo", rotulo: (n) => repetir(q.emoji, n),
    aoTocar: (v, b) => responder(q, Number(v) === q.answer, b, { revelar: () => revelarOpcao(box, q.answer) }),
  });
};

R.compare = (q, el) => {
  el.innerHTML = `<div class="palavra-grande" style="font-size:2.4rem">${q.mode === "mais" ? "MAIS ⬆️" : "MENOS ⬇️"}</div>`;
  const box = opcoes(el, [0, 1], {
    classe: "grupo", rotulo: (i) => repetir(q.emoji, i === 0 ? q.left : q.right),
    aoTocar: (v, b) => responder(q, Number(v) === q.answer, b, {
      revelar: () => revelarOpcao(box, q.answer),
      falarResposta: `aqui tem ${q.answer === 0 ? q.left : q.right}`,
    }),
  });
};

R.bigger_number = (q, el) => {
  el.innerHTML = `<div class="figura media">🔢</div>`;
  opcoesNumero(q, el);
};

R.sequence = (q, el) => {
  el.innerHTML = `${q.kind === "regressiva" ? '<div class="foguete">🚀</div>' : ""}
    <div class="fila-numeros">${q.seq.map((n) => (n === null ? '<span class="q">?</span>' : `<span>${n}</span>`)).join("")}</div>`;
  q._dica = async () => { for (const n of q.seq) { if (n !== null) await Voz.falar(String(n), { rate: 1 }); else await Voz.falar("e agora?"); } };
  opcoesNumero(q, el);
};

R.ten_frame = (q, el) => {
  el.innerHTML = `${quadroDez(q.n)}${q.mode === "faltam" ? '<div class="total-tag">Para completar 10</div>' : ""}`;
  opcoesNumero(q, el);
};

function grupoSoma(q, a, b, emoji) {
  return `<div class="grupos-soma"><div class="grupo-itens">${repetir(emoji, a)}</div><div class="sinal">+</div>
    <div class="grupo-itens">${repetir(emoji, b)}</div><div class="sinal">=</div><div class="sinal" style="color:var(--laranja)">?</div></div>`;
}

R.add = (q, el) => {
  if (q.abstract) {
    el.innerHTML = `<div class="conta">${q.a}<span>+</span>${q.b}<span>=</span><span class="q">?</span></div><div id="apoio"></div>`;
    q._dica = () => { $("#apoio").innerHTML = grupoSoma(q, q.a, q.b, "🔵"); falarPergunta(q); };
  } else {
    el.innerHTML = grupoSoma(q, q.a, q.b, q.emoji);
  }
  opcoesNumero(q, el);
};

function grupoTirar(a, b, emoji) {
  return `<div class="grupo-itens" id="grupo-tirar" style="max-width:320px">${Array.from({ length: a }, (_, i) => `<span class="${i >= a - b ? "vai" : ""}">${emoji}</span>`).join("")}</div>`;
}
function animarTirar() { setTimeout(() => $$("#grupo-tirar .vai").forEach((s) => s.classList.add("indo")), 900); }

R.subtract = (q, el) => {
  if (q.abstract) {
    el.innerHTML = `<div class="conta">${q.a}<span>−</span>${q.b}<span>=</span><span class="q">?</span></div><div id="apoio"></div>`;
    q._dica = () => { $("#apoio").innerHTML = grupoTirar(q.a, q.b, "🔵"); animarTirar(); falarPergunta(q); };
  } else {
    el.innerHTML = grupoTirar(q.a, q.b, q.emoji);
    animarTirar();
  }
  opcoesNumero(q, el);
};

R.hidden_part = (q, el) => {
  el.innerHTML = `<div class="total-tag">Total: ${q.total}</div>
    <div class="grupos-soma"><div class="grupo-itens">${repetir(q.emoji, q.visible)}</div><div class="sinal">+</div>
    <div class="nuvem-esc">☁️<b>?</b></div></div>`;
  opcoesNumero(q, el);
};

R.story = (q, el) => {
  const [tipo, a, b] = q.visual;
  let vis = "";
  if (tipo === "add") vis = grupoSoma(q, a, b, q.emoji);
  else if (tipo === "sub") vis = grupoTirar(a, b, q.emoji);
  else vis = `<div class="barra-modelo"><div>${repetir(q.emoji, a)}</div><div>${repetir(q.emoji, b)}</div></div>`;
  el.innerHTML = `<div class="historia-txt">${q.speech}</div>${vis}`;
  if (tipo === "sub") animarTirar();
  opcoesNumero(q, el);
};

R.pattern = (q, el) => {
  el.innerHTML = `<div class="padrao">${q.seq.map((e) => `<span>${e}</span>`).join("")}<span class="q">?</span></div>`;
  escolhaSimples(q, el, { classe: "emoji" });
};

const SVG_FORMAS = {
  circulo: (c) => `<circle cx="50" cy="50" r="38" fill="${c}"/>`,
  quadrado: (c) => `<rect x="14" y="14" width="72" height="72" rx="4" fill="${c}"/>`,
  triangulo: (c) => `<polygon points="50,10 90,86 10,86" fill="${c}"/>`,
  retangulo: (c) => `<rect x="6" y="28" width="88" height="44" rx="4" fill="${c}"/>`,
};
R.shape = (q, el) => {
  el.innerHTML = `<div class="figura media">🔺🟦⚪</div>`;
  const box = opcoes(el, q.shapes.map((s) => s.shape), {
    rotulo: (f) => { const s = q.shapes.find((x) => x.shape === f);
      return `<svg viewBox="0 0 100 100"><g transform="rotate(${s.rot} 50 50) translate(${50 - 50 * s.scale} ${50 - 50 * s.scale}) scale(${s.scale})">${SVG_FORMAS[f](s.color)}</g></svg>`; },
    aoTocar: (v, b) => responder(q, v === q.answer, b, { revelar: () => revelarOpcao(box, q.answer) }),
  });
};

R.teen = (q, el) => {
  const barras = Array.from({ length: q.tens }, () => `<div class="barra-dez">${"<i></i>".repeat(10)}</div>`).join("");
  const cubos = `<div class="cubos">${'<span class="cubo"></span>'.repeat(q.ones)}</div>`;
  el.innerHTML = `<div class="blocos">${barras}${cubos}</div>`;
  q._dica = () => Voz.falar(q.tens === 1 ? `Uma barra é dez. E mais ${q.ones} cubinhos.` : `Cada barra é dez. ${q.tens} barras.`);
  opcoesNumero(q, el);
};

/* ---- pergunta genérica de múltipla escolha (lições novas) ---- */
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

R.mc = (q, el) => {
  let html = "";
  if (q.leitura) {
    html += `<div class="leitura-box"><h3>${q.leitura.emoji} ${esc(q.leitura.titulo)}</h3><p>${esc(q.leitura.texto)}</p>
      <button class="btn btn-cinza btn-mini" id="ouvir-texto">🔊 Ouvir o texto</button></div>`;
  }
  if (q.emoji) html += `<div class="figura media">${q.emoji}</div>`;
  if (q.texto) html += `<div class="mc-texto ${q.textoClasse || ""}">${esc(q.texto)}</div>`;
  if (q.visual && V[q.visual.k]) html += `<div class="visual">${V[q.visual.k](q.visual)}</div>`;
  if (q.dica) html += `<p class="dica-contar">💡 ${esc(q.dica)}</p>`;
  el.innerHTML = html;
  if (q.leitura) $("#ouvir-texto").onclick = () => Voz.falar(q.leitura.texto.replace(/\n/g, " "));
  const classe = { num: "num", txt: "txt", emoji: "emoji", letra: "letra-op", cartao: "cartao" }[q.estilo || "txt"];
  escolhaSimples(q, el, {
    classe, rotulo: (v) => esc(v),
    falar: (a) => q.falarResposta || (q.estilo === "num" ? String(a) : String(a).toLowerCase()),
  });
};

/* ---- desenhos usados nas perguntas (relógio, dinheiro, frações, gráficos...) ---- */
const V = {};
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");

V.quadros = ({ n }) => `<div class="dois-quadros">${quadroDez(Math.min(10, n))}${quadroDez(Math.max(0, n - 10))}</div>`;
V.emojis = ({ e, n, apertado }) => `<div class="grade-emojis ${apertado ? "apertado" : ""}">${rep(n, () => `<span>${e}</span>`)}</div>`;
V.emojis_linha = ({ itens }) => `<div class="padrao">${itens.map((x) => `<span>${x}</span>`).join("")}</div>`;
V.pares = ({ e, n }) => `<div class="pares">${rep(Math.floor(n / 2), () => `<div class="par">${e}${e}</div>`)}${n % 2 ? `<div class="par sozinho">${e}</div>` : ""}</div>`;
V.grupos = ({ e, grupos }) => `<div class="grupos">${grupos.map((n) => `<div class="grupo">${rep(n, () => `<span>${e}</span>`)}</div>`).join("")}</div>`;
V.blocos = ({ c = 0, d = 0, u = 0 }) => `<div class="blocos">
  ${rep(c, () => `<div class="placa-cem">${rep(100, () => "<i></i>")}</div>`)}
  ${rep(d, () => `<div class="barra-dez">${rep(10, () => "<i></i>")}</div>`)}
  <div class="cubos">${rep(u, () => '<span class="cubo"></span>')}</div></div>`;

const COR_NOTA = { 200: "#60a5fa", 500: "#c084fc", 1000: "#f87171", 2000: "#fbbf24", 5000: "#fb923c", 10000: "#38bdf8" };
const fmtR = (c) => `R$ ${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")}`;
function dinheiroHTML(v) {
  if (v >= 200) return `<div class="nota" style="--cor:${COR_NOTA[v] || "#94a3b8"}"><b>R$ ${v / 100}</b><span>${v / 100}</span></div>`;
  const real = v === 100;
  return `<div class="moeda ${real ? "real" : v >= 25 ? "prata" : "bronze"}"><b>${real ? "1" : v}</b><small>${real ? "REAL" : "CENTAVOS"}</small></div>`;
}
V.dinheiro = ({ itens }) => `<div class="dinheiro">${itens.map(dinheiroHTML).join("")}</div>`;
V.precos = ({ itens, pago }) => `<div class="precos">${itens.map(([e, p]) => `<div class="produto"><span>${e}</span><b>${fmtR(p)}</b></div>`).join("")}
  ${pago ? `<div class="pagou">Você pagou:<div class="dinheiro">${dinheiroHTML(pago)}</div></div>` : ""}</div>`;

V.relogio = ({ h, m }) => {
  const angH = ((h % 12) + m / 60) * 30, angM = m * 6;
  const nums = rep(12, (i) => { const n = i + 1, a = (n * 30 - 90) * Math.PI / 180; return `<text x="${100 + 72 * Math.cos(a)}" y="${100 + 72 * Math.sin(a) + 7}" text-anchor="middle">${n}</text>`; });
  const marcas = rep(60, (i) => { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 88 : 84; return `<line x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + 92 * Math.sin(a)}" y2="${100 - 92 * Math.cos(a)}" class="${i % 5 ? "mn" : "mh"}"/>`; });
  return `<svg class="relogio" viewBox="0 0 200 200"><circle cx="100" cy="100" r="96" class="aro"/>${marcas}${nums}
    <line x1="100" y1="100" x2="100" y2="52" class="ph" transform="rotate(${angH} 100 100)"/>
    <line x1="100" y1="100" x2="100" y2="26" class="pm" transform="rotate(${angM} 100 100)"/><circle cx="100" cy="100" r="6" class="centro"/></svg>`;
};

V.fracao = ({ forma, partes, pintadas }) => {
  const cor = (i) => (i < pintadas ? "var(--capa)" : "#fff");
  if (forma === "pizza") {
    if (partes === 1) return "";
    const fatias = rep(partes, (i) => {
      const a0 = (i / partes) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / partes) * 2 * Math.PI - Math.PI / 2;
      const p = (a) => `${100 + 80 * Math.cos(a)} ${100 + 80 * Math.sin(a)}`;
      return `<path d="M100 100 L${p(a0)} A80 80 0 ${partes === 1 ? 1 : 0} 1 ${p(a1)} Z" fill="${cor(i)}" class="fatia"/>`;
    });
    return `<svg class="fracao" viewBox="0 0 200 200">${fatias}</svg>`;
  }
  if (forma === "quadrado" && partes === 4) {
    return `<svg class="fracao" viewBox="0 0 200 200">${rep(4, (i) => `<rect x="${20 + (i % 2) * 80}" y="${20 + Math.floor(i / 2) * 80}" width="80" height="80" fill="${cor(i)}" class="fatia"/>`)}</svg>`;
  }
  const w = 260 / partes;
  return `<svg class="fracao barra" viewBox="0 0 280 90">${rep(partes, (i) => `<rect x="${10 + i * w}" y="10" width="${w}" height="70" fill="${cor(i)}" class="fatia"/>`)}</svg>`;
};

V.grafico = ({ dados, titulo }) => {
  const max = 10, W = 300, H = 210, base = 170, larg = 44, esp = (W - 40) / dados.length;
  const linhas = rep(max / 2 + 1, (i) => { const v = i * 2, y = base - v * 15; return `<line x1="34" y1="${y}" x2="${W - 6}" y2="${y}" class="grade"/><text x="26" y="${y + 5}" text-anchor="end" class="eixo">${v}</text>`; });
  const barras = dados.map(([e, v], i) => { const x = 44 + i * esp; return `<rect x="${x}" y="${base - v * 15}" width="${larg}" height="${v * 15}" rx="4" class="barra-g" style="fill:${["#3b82f6", "#f59e0b", "#22c55e", "#ec4899"][i % 4]}"/><text x="${x + larg / 2}" y="${base + 30}" text-anchor="middle" class="emoji-eixo">${e}</text>`; }).join("");
  return `<div class="grafico-box"><b>${esc(titulo)}</b><svg class="grafico" viewBox="0 0 ${W} ${H}">${linhas}${barras}</svg></div>`;
};
V.tabela = ({ dados, titulo }) => `<table class="tabela"><caption>${esc(titulo)}</caption><tr><th>Fruta</th><th>Votos</th></tr>
  ${dados.map(([e, v]) => `<tr><td>${e}</td><td>${v}</td></tr>`).join("")}</table>`;

V.regua = ({ cm }) => {
  const px = 26, x0 = 20;
  const marcas = rep(16 * 2, (i) => { const x = x0 + (i / 2) * px; return `<line x1="${x}" y1="70" x2="${x}" y2="${i % 2 ? 80 : 88}" class="mreg"/>${i % 2 ? "" : `<text x="${x}" y="104" text-anchor="middle" class="treg">${i / 2}</text>`}`; });
  return `<svg class="regua" viewBox="0 0 440 112"><rect x="8" y="64" width="424" height="46" rx="6" class="corpo-regua"/>${marcas}
    <rect x="${x0}" y="30" width="${cm * px - 14}" height="22" class="lapis"/><polygon points="${x0 + cm * px - 14},30 ${x0 + cm * px},41 ${x0 + cm * px - 14},52" class="ponta"/>
    <rect x="${x0}" y="30" width="10" height="22" class="borracha"/></svg>`;
};
V.balanca = ({ esq, dir }) => `<div class="balanca"><div class="prato">${esc(esq)}</div><div class="fiel">⚖️</div><div class="prato">${esc(dir)}</div></div>`;
V.balanca_obj = () => `<div class="figura media">⚖️</div>`;
V.conta = ({ txt, quadro, matriz }) => `<div class="conta-box">${esc(txt)}</div>${quadro ? quadroDez(quadro) : ""}
  ${matriz ? `<div class="matriz" style="grid-template-columns:repeat(${matriz[1]},1fr)">${rep(matriz[0] * matriz[1], () => "<i></i>")}</div>` : ""}`;
V.armada = ({ a, b, op }) => {
  const larg = Math.max(String(a).length, String(b).length);
  const cel = (n) => String(n).padStart(larg, " ").split("").map((c) => `<span>${c.trim()}</span>`).join("");
  return `<div class="armada"><div class="lin"><span></span>${cel(a)}</div><div class="lin"><span>${op}</span>${cel(b)}</div><div class="lin total"><span></span>${rep(larg, () => "<span>?</span>")}</div></div>`;
};
V.quadro100 = ({ n, falta }) => `<div class="quadro100">${[n - 10, n, n + 10].map((l) => [l - 1, l, l + 1].map((x) => `<span class="${x === falta ? "q" : ""}">${x === falta ? "?" : x}</span>`).join("")).join("")}</div>`;
V.fila = ({ seq }) => `<div class="fila-numeros">${seq.map((n) => (n === null ? '<span class="q">?</span>' : `<span>${n}</span>`)).join("")}</div>`;
V.saco = ({ bolas }) => `<div class="saco"><div class="saco-bolas">${Object.entries(bolas).map(([c, n]) => rep(n, () => `<span>${c}</span>`)).join("")}</div><small>saquinho</small></div>`;

const PONTOS_FORMA = { triangulo: "100,20 182,170 18,170", quadrado: "30,30 170,30 170,170 30,170", retangulo: "10,55 190,55 190,145 10,145",
  pentagono: "100,15 185,78 152,178 48,178 15,78", hexagono: "55,22 145,22 190,100 145,178 55,178 10,100" };
V.forma = ({ f }) => `<svg class="forma-grande" viewBox="0 0 200 200"><polygon points="${PONTOS_FORMA[f]}" class="forma-p"/>${PONTOS_FORMA[f].split(" ").map((p) => `<circle cx="${p.split(",")[0]}" cy="${p.split(",")[1]}" r="7" class="vertice"/>`).join("")}</svg>`;
V.solido = ({ s }) => {
  const d = {
    esfera: `<defs><radialGradient id="ge" cx="35%" cy="35%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="var(--capa)"/></radialGradient></defs><circle cx="100" cy="100" r="70" fill="url(#ge)" class="sol"/>`,
    cubo: `<polygon points="50,70 120,70 150,40 80,40" class="sol claro"/><polygon points="120,70 150,40 150,120 120,150" class="sol escuro"/><rect x="50" y="70" width="70" height="80" class="sol"/>`,
    cilindro: `<rect x="55" y="50" width="90" height="100" class="sol"/><ellipse cx="100" cy="150" rx="45" ry="14" class="sol"/><ellipse cx="100" cy="50" rx="45" ry="14" class="sol claro"/>`,
    cone: `<polygon points="100,25 150,150 50,150" class="sol"/><ellipse cx="100" cy="150" rx="50" ry="15" class="sol claro"/>`,
  }[s];
  return `<div class="solido-box"><svg class="solido" viewBox="0 0 200 180">${d}</svg><b>${s.toUpperCase()}</b></div>`;
};
V.linha = ({ itens, destaque }) => `<div class="linha-pos"><div class="lados"><span>⬅️ esquerda</span><span>direita ➡️</span></div>
  <div class="padrao">${itens.map((x, i) => `<span class="${i === destaque ? "destaque" : ""}">${x}</span>`).join("")}</div></div>`;
V.simetria = () => `<div class="simetria"><div><span class="sim-ex">🦋</span><i></i></div><div><span class="sim-ex">❤️</span><i></i></div></div>`;
V.fitas = ({ fitas }) => `<div class="fitas">${fitas.map(([cor, len]) => `<div class="fita" style="background:${cor};width:${len * 8 + 10}%"></div>`).join("")}</div>`;
V.copos = ({ niveis }) => `<div class="copos">${niveis.map((n, i) => `<div class="copo-box"><svg viewBox="0 0 80 110" class="copo"><path d="M10 6 L70 6 L62 104 L18 104 Z" class="vidro"/>
  <clipPath id="cp${i}"><path d="M10 6 L70 6 L62 104 L18 104 Z"/></clipPath><rect x="0" y="${104 - n}" width="80" height="${n}" class="liquido" clip-path="url(#cp${i})"/></svg><b>${"ABC"[i]}</b></div>`).join("")}</div>`;
V.lista_dias = ({ destaque }) => `<div class="dias">${["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((d, i) => `<span class="${i === destaque ? "destaque" : ""}">${d}</span>`).join("")}</div>`;

/* ------------------------------------------------------------ pausa, coleção, pais */
function mostrarPausa() {
  mostrar("tela-pausa");
  desenharHerois();
  Voz.falar(`Hora de descansar os olhos! ${P().oNome} foi recarregar a energia. Amanhã tem mais missão!`);
}

function abrirColecao() {
  mostrar("tela-colecao");
  desenharHerois();
  $("#colecao-titulo").textContent = P().titulo;
  $("#colecao-sub").textContent = `Escolha a roupa ${P().doQuem}`;
  $("#colecao-nivel").innerHTML = barraNivel(EST);
  const faltam = (n) => `${n} ${n === 1 ? "missão" : "missões"}`;
  $("#lista-roupas").innerHTML = EST.roupas.map((r) => {
    const embreve = r.tipo === "em_breve";
    const aviso = embreve ? "Em breve" : r.tem ? r.nome : `🔒 ${faltam(r.licoes - EST.licoes_feitas)}`;
    return `<button class="roupa-op ${r.tem ? "" : "bloq"} ${EST.roupa.id === r.id ? "sel" : ""}" data-id="${r.id}">
      ${embreve ? `<span class="roupa-breve">${r.icone}</span>` : `<img src="personagens/${r.img}.webp" alt="${r.nome}" draggable="false">`}
      <small>${aviso}</small></button>`;
  }).join("");
  $$(".roupa-op").forEach((b) => b.onclick = async () => {
    const r = EST.roupas.find((x) => x.id === b.dataset.id);
    if (r.tipo === "em_breve") { Voz.falar(`A roupa ${r.nome} vai chegar em breve!`); return; }
    if (!r.tem) { const n = r.licoes - EST.licoes_feitas; Voz.falar(`${n === 1 ? "Falta" : "Faltam"} ${faltam(n)} para ganhar a roupa ${r.nome}!`); return; }
    Som.toque();
    EST = await api("/api/config", P().fada ? { roupa_fada: r.id } : { roupa: r.id });
    aplicarCapa(); abrirColecao();
  });
  $("#lista-evolucao").innerHTML = EST.trilha.filter((t) => t.tipo === "poder" || t.tipo === "efeito").map((t) => `
    <div class="evo ${t.tem ? "" : "nao"}"><b>${t.tem ? t.icone : "🔒"}</b><div><strong>${t.nome}</strong>
      <small>${t.desc}${t.tem ? "" : ` · com ${t.licoes} missões`}</small></div></div>`).join("");
  $("#lista-medalhas").innerHTML = EST.medalhas.map((m) => `<div class="medalha ${m.tem ? "" : "nao"}"><b>${m.icone}</b>${m.nome}</div>`).join("");
  Voz.falar(`Escolha a roupa ${P().doQuem}!`);
}

/* ------------------------------------------------------------ área dos pais
   Entrada com uma conta para adultos (teclado próprio, sem abrir o teclado do tablet) e 3 abas:
   Progresso, Ajustes (salvam sozinhos) e Conta. Nada daqui é falado, só o exemplo do "Ouvir". */
let contaPais = 0, respPais = "";
const LEITURA_GRUPOS = new Set(["letra", "silaba", "escrita", "palavra", "leitura", "frase", "grafia", "minuscula", "orto", "fono", "texto", "gram"]);
const ICONE_GRUPO = {
  letra: "🔤", silaba: "🧩", escrita: "✏️", palavra: "✍️", leitura: "📖", frase: "💬", grafia: "🔠", minuscula: "🔡", orto: "📝",
  fono: "🎵", texto: "📚", gram: "🗂️", contar: "🖐️", ver: "👀", numeral: "🔢", comparar: "⚖️", sequencia: "🔁", dez: "🔟",
  somar: "➕", tirar: "➖", compor: "🧱", historia: "🧸", padrao: "🔷", forma: "🔺", dezena: "🔟", num20: "🔢", conta: "➕",
  num100: "💯", dinheiro: "💰", medida: "📏", tempo: "🕒", geo: "📐", conta100: "➕", mult: "✖️", tabuada: "✖️", div: "➗",
  num1000: "🔢", fracao: "🍕", dados: "📊", chance: "🎲", desafio: "🏆",
};
let relPais = null, filtroHab = "";

function avisoPais(txt) {
  const a = $("#cfg-ok");
  a.textContent = txt; a.classList.add("on");
  clearTimeout(avisoPais.t); avisoPais.t = setTimeout(() => a.classList.remove("on"), 2200);
}

function abrirPais() {
  Voz.parar();
  mostrar("tela-pais");
  $("#pp-perfil").classList.add("escondido");
  $("#pais-portao").classList.remove("escondido");
  $("#pais-conteudo").classList.add("escondido");
  const a = 12 + Math.floor(Math.random() * 18), b = 11 + Math.floor(Math.random() * 9);
  contaPais = a + b;
  $("#conta-pais").textContent = `${a} + ${b} = ?`;
  respPais = ""; desenharVisor();
  $("#senha-pais").value = ""; $("#pais-erro").textContent = "";
  $("#senha-pais").classList.toggle("escondido", !EST.tem_senha);
}
function desenharVisor() {
  $$("#pp-visor span").forEach((s, i) => { s.textContent = respPais[i] || ""; s.classList.toggle("at", i === respPais.length); });
}
function teclaPais(t) {
  if ($("#pais-portao").classList.contains("escondido")) return;
  if (t === "apagar") respPais = respPais.slice(0, -1);
  else if (t === "ok") return entrarPais();
  else if (/^\d$/.test(t) && respPais.length < 2) respPais += t;
  $("#pais-erro").textContent = "";
  desenharVisor();
  // a resposta tem sempre 2 algarismos: sem senha, confere sozinho
  if (respPais.length === 2 && !EST.tem_senha) entrarPais();
}
async function entrarPais() {
  if (Number(respPais) !== contaPais) {
    $("#pais-erro").textContent = respPais ? "Resposta incorreta. Tente de novo." : "Digite a resposta.";
    const v = $("#pp-visor"); v.classList.remove("errou"); void v.offsetWidth; v.classList.add("errou");
    respPais = ""; setTimeout(desenharVisor, 300);
    return;
  }
  const r = await api("/api/pais/entrar", { senha: $("#senha-pais").value });
  if (!r.ok) { $("#pais-erro").textContent = "Senha incorreta."; return; }
  $("#pais-portao").classList.add("escondido");
  $("#pais-conteudo").classList.remove("escondido");
  trocarAbaPais("progresso");
  await preencherPais();
}
function trocarAbaPais(aba) {
  $$(".pp-aba").forEach((b) => b.classList.toggle("on", b.dataset.aba === aba));
  $$(".pp-painel").forEach((p) => p.classList.toggle("escondido", p.dataset.painel !== aba));
  $("#pp-perfil").classList.toggle("escondido", aba !== "progresso");
  $("#tela-pais").scrollTop = 0;
}

function anel(valor, total, cor, fundo, rotulo, texto) {
  const c = 2 * Math.PI * 38, f = Math.max(0, Math.min(1, valor / Math.max(1, total)));
  return `<div class="pp-anel"><div><svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
    <circle cx="46" cy="46" r="38" fill="none" stroke="${fundo}" stroke-width="10"/>
    ${f > 0 ? `<circle cx="46" cy="46" r="38" fill="none" stroke="${cor}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - f)).toFixed(1)}" transform="rotate(-90 46 46)"/>` : ""}
    </svg><b>${valor}<small>${texto}</small></b></div>${rotulo}</div>`;
}

function topoPais() {
  const c = EST.config;
  const img = $("#pp-rosto img");
  img.src = `personagens/${EST.roupa?.img || (P().fada ? "fada-basica" : "faisca-basico")}.webp`;
  $("#pp-rosto").className = `pp-rosto ${P().fada ? "fada" : "faisca"}`;
  $("#pp-nome").textContent = c.nome_crianca || "Sua criança";
  $("#pp-sub").textContent = `${P().nome} · Nível ${EST.nivel} · ${EST.licoes_feitas} ${EST.licoes_feitas === 1 ? "missão" : "missões"}`;
  const px = EST.proximo;
  const tipo = { roupa: "a roupa", poder: "o poder", efeito: "o efeito" };
  $("#pp-prox-txt").innerHTML = px
    ? `🎁 ${px.faltam === 1 ? "Falta" : "Faltam"} <b>${px.faltam} ${px.faltam === 1 ? "missão" : "missões"}</b> para ${tipo[px.tipo] || ""} <b>${esc(px.nome)} ${px.icone}</b>`
    : "🎉 Ganhou todos os prêmios que existem por enquanto!";
  $("#pp-prox-barra").style.width = `${px ? Math.max(4, ((10 - Math.min(10, px.faltam)) / 10) * 100) : 100}%`;
}

function dicaPais(rel) {
  const nome = EST.config.nome_crianca || "A criança";
  const dificil = rel.habilidades.find((h) => h.dificeis.length && h.tentativas >= 5);
  if (dificil && LEITURA_GRUPOS.has(dificil.chave)) {
    const ds = dificil.dificeis.slice(0, 3).map((d) => `<b>${esc(d)}</b>`);
    const itens = ds.length > 1 ? `${ds.slice(0, -1).join(", ")} e ${ds[ds.length - 1]}` : ds[0];
    return `${esc(nome)} ainda erra ${itens} em “${esc(dificil.grupo)}”. Procurem juntos em rótulos, placas e livros, e falem o som em voz alta.`;
  }
  if (dificil) return `${esc(nome)} está aprendendo <b>${esc(dificil.grupo)}</b>. Brinquem com coisas de verdade: contar colheres, juntar e tirar brinquedos, dividir biscoitos.`;
  const dicas = [
    "Leiam juntos hoje, nem que seja uma página. Aponte as palavras com o dedo enquanto lê.",
    "Procurem as letras que a criança já conhece em rótulos, placas e embalagens.",
    "Elogie o esforço, não a “inteligência”: “Você tentou de novo e conseguiu!”.",
    "Peça para a criança contar coisas do dia a dia: degraus, frutas, carros de uma cor.",
    "Pouco e todo dia vale mais: 10 a 15 minutos bastam.",
  ];
  const dia = Math.floor(Date.now() / 86400000);
  return dicas[dia % dicas.length];
}

function desenharHabilidades() {
  const lista = (relPais?.habilidades || []).filter((h) => !filtroHab || (filtroHab === "leitura") === LEITURA_GRUPOS.has(h.chave));
  $$("#pp-filtro button").forEach((b) => b.classList.toggle("on", b.dataset.area === filtroHab));
  $("#pais-habilidades").innerHTML = lista.length ? lista.map((h) => {
    const p = Math.round((h.acertos / Math.max(1, h.tentativas)) * 100);
    const [cls, txt, cor] = h.tentativas < 5 ? ["novo", "Começando", "#f1f5f9"]
      : p >= 80 ? ["ok", "Já sabe ✓", "#dcfce7"] : p >= 60 ? ["ap", "Aprendendo", "#fef3c7"] : ["pr", "Praticar", "#fee2e2"];
    const icone = ICONE_GRUPO[h.chave] || (LEITURA_GRUPOS.has(h.chave) ? "📖" : "🔢");
    return `<div class="pp-hab"><span style="background:${cor}">${icone}</span><div><strong>${esc(h.grupo)}</strong>
      <small>${p}% · ${h.tentativas} ${h.tentativas === 1 ? "pergunta" : "perguntas"}</small>
      ${h.dificeis.length ? `<div class="pp-letras">${h.dificeis.slice(0, 8).map((d) => `<span>${esc(d)}</span>`).join("")}</div>` : ""}</div>
      <span class="pp-chip ${cls}">${txt}</span></div>`;
  }).join("") : `<p class="pp-vazio">${relPais?.habilidades.length ? "Nada nesta área ainda." : "Ainda sem dados. Faça algumas missões!"}</p>`;
}

async function preencherPais() {
  const rel = (relPais = await api("/api/relatorio"));
  const c = EST.config;
  topoPais();
  // Hoje
  const minHoje = Math.round(EST.hoje.segundos / 60);
  $("#pp-data").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });
  $("#pp-hoje").innerHTML = anel(minHoje, c.minutos_dia, "#3b82f6", "#e0f2fe", "Tempo de tela", `de ${c.minutos_dia} min`)
    + anel(EST.hoje.licoes || 0, c.meta_licoes, "#22c55e", "#dcfce7", "Missões de hoje", `de ${c.meta_licoes}`);
  $("#pais-resumo").innerHTML = `<div class="pp-num"><span>🔥</span><b>${rel.sequencia}</b><small>${rel.sequencia === 1 ? "dia seguido" : "dias seguidos"}</small></div>
    <div class="pp-num"><span>⭐</span><b>${rel.xp.toLocaleString("pt-BR")}</b><small>pontos</small></div>
    <div class="pp-num"><span>📘</span><b>${rel.total_licoes}</b><small>lições jogadas</small></div>`;
  // Semana, com a linha do limite de tempo
  const mins = rel.semana.map((d) => Math.round(d.segundos / 60));
  const escala = Math.max(5, c.minutos_dia * 1.25, ...mins), alto = 90;
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  $("#pp-media").textContent = `média ${Math.round(mins.reduce((s, m) => s + m, 0) / 7)} min · limite ${c.minutos_dia} min`;
  $("#pais-semana").innerHTML = `<div class="pp-meta" style="bottom:${18 + (c.minutos_dia / escala) * alto}px"></div>`
    + rel.semana.map((d, i) => {
      const hoje = i === rel.semana.length - 1;
      return `<div class="pp-dia${hoje ? " hoje" : ""}"><em>${mins[i]}</em><i style="height:${(mins[i] / escala) * alto}px"></i>${hoje ? "hoje" : dias[new Date(d.dia + "T12:00:00").getDay()]}</div>`;
    }).join("");
  // Caminho: lições diferentes feitas em cada trilha
  const conta = (k) => { const ls = (EST.trilhas[k] || []).flatMap((u) => u.lessons); return [ls.filter((l) => l.done).length, ls.length]; };
  $("#pp-caminho").innerHTML = [["leitura", "📖 Leitura", "var(--azul)"], ["matematica", "🔢 Matemática", "var(--roxo)"]].map(([k, nome, cor]) => {
    const [f, t] = conta(k);
    return `<div class="pp-trilha"><div><span>${nome}</span><small>${f} de ${t} lições</small></div><p><i style="width:${(f / Math.max(1, t)) * 100}%;background:${cor}"></i></p></div>`;
  }).join("");
  desenharHabilidades();
  $("#pp-dica").innerHTML = dicaPais(rel);
  // Ajustes
  $("#cfg-nome").value = c.nome_crianca; $("#cfg-heroi").value = P().nome;
  $("#pp-rot-heroi").textContent = P().fada ? "Nome da fada" : "Nome do herói";
  $("#cfg-personagem").value = EST.personagem || "faisca";
  $$(".pp-op").forEach((b) => b.classList.toggle("on", b.dataset.p === (EST.personagem || "faisca")));
  $("#cfg-som").checked = c.som !== false; $("#cfg-tudo").checked = !!c.liberar_tudo;
  delete $("#cfg-voz-nome").dataset.mudou;
  preencherVozes();
  $("#cfg-minutos").value = c.minutos_dia; $("#cfg-meta").value = c.meta_licoes;
  $$(".pp-step").forEach(desenharStep);
  $("#pp-tempo-hoje").textContent = `Hoje: ${minHoje} de ${c.minutos_dia} min`;
  $("#cfg-voz").value = c.voz_velocidade; $("#cfg-senha").value = "";
  $("#cfg-senha").placeholder = EST.tem_senha ? "Trocar" : "Nenhuma";
  $("#pp-senha-info").textContent = EST.tem_senha ? "Pedida para entrar aqui" : "Opcional";
  // Conta
  Conta.preencherCartao();
  $("#area-sair-conta").classList.toggle("escondido", $("#cartao-conta").classList.contains("escondido"));
}
function desenharStep(s) {
  const v = Number($("#" + s.dataset.alvo).value);
  s.querySelector("b").textContent = v + s.dataset.un;
  s.querySelector('[data-d="-1"]').disabled = v <= Number(s.dataset.min);
  s.querySelector('[data-d="1"]').disabled = v >= Number(s.dataset.max);
}
function preencherVozes() {
  const sel = $("#cfg-voz-nome");
  const atual = sel.value;
  const vs = Voz.lista();
  const gravada = Vozes.disponivel() ? `<option value="${VOZ_GRAVADA}">⭐ Francisca (voz gravada, a mais natural)</option>` : "";
  sel.innerHTML = gravada + (vs.length
    ? vs.map((v) => `<option value="${esc(v.name)}">${Voz.ehNatural(v) ? "✨ " : ""}${esc(v.name)}${v.localService === false ? " (precisa de internet)" : ""}</option>`).join("")
    : (gravada ? "" : '<option value="">Nenhuma voz em português neste aparelho</option>'));
  if (sel.dataset.mudou && atual) { sel.value = atual; return; } // não desfaz a escolha que os pais acabaram de fazer
  sel.value = gravada && Voz.usarGravada() ? VOZ_GRAVADA : Voz.voz?.name || "";
}

/** Salva os ajustes (chamado sozinho a cada mudança). */
async function salvarConfig() {
  const pers = $("#cfg-personagem").value;
  const nomeP = $("#cfg-heroi").value.trim();
  const trocou = pers !== EST.personagem;
  const dados = {
    nome_crianca: $("#cfg-nome").value.trim(), personagem: pers,
    som: $("#cfg-som").checked, liberar_tudo: $("#cfg-tudo").checked,
    minutos_dia: Math.max(5, Math.min(60, Number($("#cfg-minutos").value) || 15)),
    meta_licoes: Math.max(1, Math.min(6, Number($("#cfg-meta").value) || 2)),
    voz_velocidade: Number($("#cfg-voz").value) || 0.85,
  };
  // a voz só muda se os pais mexeram na lista (se a lista abriu antes da Francisca carregar, não troca sozinha)
  if ($("#cfg-voz-nome").dataset.mudou) dados.voz_nome = $("#cfg-voz-nome").value;
  if (!trocou && nomeP) dados[pers === "fada" ? "nome_fada" : "nome_heroi"] = nomeP;
  const senhaNova = $("#cfg-senha").value;
  if (senhaNova) dados.senha_pais = senhaNova;
  EST = await api("/api/config", dados);
  aplicarCapa();
  if (trocou || !nomeP) $("#cfg-heroi").value = P().nome;
  $("#pp-rot-heroi").textContent = P().fada ? "Nome da fada" : "Nome do herói";
  if (senhaNova) {
    $("#cfg-senha").value = ""; $("#cfg-senha").placeholder = "Trocar";
    $("#pp-senha-info").textContent = "Pedida para entrar aqui";
  }
  topoPais();
  $("#pp-tempo-hoje").textContent = `Hoje: ${Math.round(EST.hoje.segundos / 60)} de ${EST.config.minutos_dia} min`;
  avisoPais(senhaNova ? "Senha salva ✓" : "Salvo ✓");
}

function ligarPais() {
  $$("#pp-teclado button").forEach((b) => (b.onclick = () => teclaPais(b.dataset.tecla || b.textContent)));
  document.addEventListener("keydown", (e) => {
    if (!$("#tela-pais").classList.contains("ativa") || e.target.tagName === "INPUT") {
      if (e.target.id === "senha-pais" && e.key === "Enter") entrarPais();
      return;
    }
    if (/^\d$/.test(e.key)) teclaPais(e.key);
    else if (e.key === "Backspace") teclaPais("apagar");
    else if (e.key === "Enter") teclaPais("ok");
  });
  $$(".pp-aba").forEach((b) => (b.onclick = () => trocarAbaPais(b.dataset.aba)));
  $$("#pp-filtro button").forEach((b) => (b.onclick = () => { filtroHab = b.dataset.area; desenharHabilidades(); }));
  // ajustes: tudo salva sozinho
  ["#cfg-nome", "#cfg-heroi", "#cfg-senha", "#cfg-som", "#cfg-tudo", "#cfg-voz"].forEach((s) => ($(s).onchange = salvarConfig));
  ["#cfg-nome", "#cfg-heroi", "#cfg-senha"].forEach((s) => ($(s).onkeydown = (e) => { if (e.key === "Enter") e.target.blur(); }));
  $$(".pp-op").forEach((b) => (b.onclick = () => {
    if ($("#cfg-personagem").value === b.dataset.p) return;
    $("#cfg-personagem").value = b.dataset.p;
    $$(".pp-op").forEach((o) => o.classList.toggle("on", o === b));
    salvarConfig();
  }));
  $$(".pp-step").forEach((s) => s.querySelectorAll("button").forEach((b) => (b.onclick = () => {
    const alvo = $("#" + s.dataset.alvo);
    const v = Math.max(Number(s.dataset.min), Math.min(Number(s.dataset.max), Number(alvo.value) + Number(b.dataset.d) * Number(s.dataset.passo)));
    if (v === Number(alvo.value)) return;
    alvo.value = v; desenharStep(s);
    clearTimeout(s.t); s.t = setTimeout(salvarConfig, 400); // espera parar de tocar no + e −
  })));
  $("#btn-testar-voz").onclick = () => {
    EST.config.voz_velocidade = Number($("#cfg-voz").value); EST.config.som = true; EST.config.voz_nome = $("#cfg-voz-nome").value;
    Voz.escolher(); Voz.falar("Oi! Vamos ler juntos? B com A faz ba. Bola! Três mais dois é igual a cinco.");
  };
  $("#cfg-voz-nome").onchange = () => { $("#cfg-voz-nome").dataset.mudou = "1"; $("#btn-testar-voz").click(); salvarConfig(); };
  $("#btn-liberar").onclick = async () => { EST = await api("/api/pais/liberar", {}); await preencherPais(); avisoPais("Tempo de hoje liberado ✓"); };
  $("#btn-zerar").onclick = async () => {
    const t = prompt("Isso apaga todo o progresso deste aparelho. Digite ZERAR para confirmar:");
    if (t === "ZERAR") { EST = await api("/api/pais/zerar", { confirmar: "ZERAR" }); await preencherPais(); avisoPais("Progresso zerado."); }
  };
  $("#btn-backup").onclick = () => {
    const blob = new Blob([Motor.exportar()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `super-faisca-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    avisoPais("Backup salvo na pasta de downloads ✓");
  };
  $("#btn-restaurar").onclick = () => $("#arquivo-backup").click();
  $("#arquivo-backup").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      Motor.importar(await f.text());
      await carregar(); await preencherPais();
      avisoPais("Progresso restaurado ✓");
    } catch (err) { avisoPais("Não consegui ler esse arquivo de backup."); }
    e.target.value = "";
  };
}

/* ------------------------------------------------------------ confete */
function confete() {
  const cv = $("#confete"), ctx = cv.getContext("2d");
  cv.width = cv.offsetWidth; cv.height = cv.offsetHeight;
  const cores = ["#f97316", "#3b82f6", "#22c55e", "#eab308", "#ec4899", "#8b5cf6"];
  const ps = Array.from({ length: 120 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5,
    vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, r: 4 + Math.random() * 6, c: cores[Math.floor(Math.random() * cores.length)], a: Math.random() * 6 }));
  const t0 = performance.now();
  (function quadro(t) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.a += 0.1; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
    if (t - t0 < 3500) requestAnimationFrame(quadro); else ctx.clearRect(0, 0, cv.width, cv.height);
  })(t0);
}

/* ------------------------------------------------------------ ligações */
function ligar() {
  $("#btn-comecar").onclick = comecar;
  $$(".escolha").forEach((b) => (b.onclick = () => escolherPersonagem(b.dataset.personagem)));
  $$(".btn-som-toggle").forEach((b) => (b.onclick = async () => {
    EST = await api("/api/config", { som: !somLigado() });
    atualizarBotoesSom();
    if (!somLigado()) Voz.parar();
    Legenda.mostrar(somLigado() ? "Som ligado." : "Som desligado. Os textos continuam aparecendo no balão.");
  }));
  Conta.ligarTelas();
  $$(".aba").forEach((a) => a.onclick = () => { trilhaAtual = a.dataset.trilha; Som.toque(); renderMapa(); Voz.falar(trilhaAtual === "leitura" ? "Letras!" : "Números!"); });
  $("#btn-revisao").onclick = () => abrirLicao("revisao");
  $("#btn-sair").onclick = sairLicao;
  $("#btn-ouvir").onclick = () => { const q = L?.fila[L.pos]; if (!q) return; if (q._dica && q.type === "blend") q._dica(); else falarPergunta(q); };
  $("#btn-continuar").onclick = () => { if (L) { Voz.parar(); avancar(); } };
  $("#btn-fim").onclick = () => { if (tempoEsgotado()) return mostrarPausa(); mostrar("tela-mapa"); renderMapa(); };
  $("#btn-colecao").onclick = abrirColecao;
  $("#btn-pais").onclick = abrirPais;
  $("#btn-pausa-pais").onclick = abrirPais;
  $$("[data-voltar]").forEach((b) => b.onclick = () => { if (tempoEsgotado()) return mostrarPausa(); mostrar("tela-mapa"); renderMapa(); });
  ligarPais();
}

/* ------------------------------------------------------------ app instalável */
function prepararInstalavel() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("Service worker não registrado", e));
  }
  // pede ao navegador para não apagar o progresso quando faltar espaço
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

window.addEventListener("DOMContentLoaded", async () => {
  prepararInstalavel();
  Voz.init();
  ligar();
  await carregar();
  // Com login configurado (config.js), confere a conta e o acesso antes de liberar o jogo
  const r = await Conta.iniciar();
  if (r === "login") return Conta.mostrarLogin();
  if (r === "bloqueado") return Conta.mostrarBloqueio();
  mostrar("tela-inicio");
  Conta.textoInicio();
});
