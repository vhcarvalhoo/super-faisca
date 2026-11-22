/* Super Faísca — Letras & Números (interface)
   O conteúdo das lições vem do Python (curriculo.py). Aqui ficam só o
   desenho das telas, a voz, os sons e o fluxo estilo "trilha". */
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
  init() {
    if (!("speechSynthesis" in window)) return;
    const escolher = () => {
      const vs = speechSynthesis.getVoices();
      const br = vs.filter((v) => /pt[-_]BR/i.test(v.lang));
      this.voz = br.find((v) => /Francisca|Thalita|Luciana|Google|Maria|Natural/i.test(v.name))
        || br[0] || vs.find((v) => /^pt/i.test(v.lang)) || null;
    };
    escolher();
    speechSynthesis.onvoiceschanged = escolher;
  },
  falar(txt, { rate } = {}) {
    return new Promise((res) => {
      if (!("speechSynthesis" in window) || !txt) return res();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = "pt-BR";
      if (this.voz) u.voice = this.voz;
      u.rate = rate || (EST?.config?.voz_velocidade ?? 0.85);
      u.pitch = 1.1;
      const btn = $("#btn-ouvir");
      let feito = false;
      const fim = () => { if (feito) return; feito = true; btn?.classList.remove("falando"); res(); };
      u.onend = fim; u.onerror = fim;
      setTimeout(fim, 1800 + txt.length * 110); // segurança: alguns navegadores não disparam onend
      btn?.classList.add("falando");
      setTimeout(() => speechSynthesis.speak(u), 60);
    });
  },
  parar() { if ("speechSynthesis" in window) speechSynthesis.cancel(); },
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
  $$(".tela").forEach((t) => t.classList.remove("ativa"));
  $("#" + id).classList.add("ativa");
  $("#" + id).scrollTop = 0;
}
function desenharHerois() {
  const tpl = $("#tpl-heroi");
  $$(".heroi-slot").forEach((s) => { if (!s.firstElementChild) s.appendChild(tpl.content.cloneNode(true)); });
}
function aplicarCapa() {
  const capa = EST.capas.find((c) => c.id === EST.config.capa) || EST.capas[0];
  document.documentElement.style.setProperty("--capa", capa.cor);
  $$(".nome-heroi").forEach((e) => (e.textContent = EST.config.nome_heroi || "Faísca"));
}
function reagir(classe) {
  const h = $("#heroi-licao");
  h.classList.remove("feliz", "pensando"); void h.offsetWidth; h.classList.add(classe);
  setTimeout(() => h.classList.remove(classe), 1100);
}
const nomeHeroi = () => EST.config.nome_heroi || "Faísca";
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
  aplicarCapa();
}

async function comecar() {
  Som.toque();
  await carregar();
  if (tempoEsgotado()) return mostrarPausa();
  mostrar("tela-mapa");
  renderMapa();
  const nome = nomeCrianca();
  Voz.falar(`Oi${nome ? ", " + nome : ""}! Eu sou o ${nomeHeroi()}. Escolha uma missão!`);
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
  if (atual) setTimeout(() => atual.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }), 200);
}

/* ------------------------------------------------------------ lição */
async function abrirLicao(id) {
  if (tempoEsgotado()) return mostrarPausa();
  const d = await api("/api/licao/iniciar", { id });
  if (!d.questions || !d.questions.length) return;
  L = { id: d.id, title: d.title, fila: d.questions.map((q) => ({ ...q })), pos: 0, resultados: [], inicio: Date.now() };
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
    ...res.capas.filter((c) => c.xp > 0).map((c) => `<div class="premio"><span style="color:${c.cor}">⬤</span> Nova capa: ${c.nome}! Toque no herói para trocar.</div>`),
  ];
  $("#fim-premios").innerHTML = premios.join("");
  const nome = nomeCrianca();
  let fala = `${["", "Boa tentativa", "Muito bem", "Missão perfeita"][res.estrelas]}${nome ? ", " + nome : ""}! Você ganhou ${res.xp} pontos de energia!`;
  if (res.medalhas.length) fala += " E ganhou uma medalha nova!";
  if (res.capas.some((c) => c.xp > 0)) fala += " Tem capa nova para o herói!";
  Voz.falar(fala);
  L = null;
}

function sairLicao() {
  Voz.parar();
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
  el.innerHTML = `<div class="letra-gigante">${q.letter}</div>
    <div class="figura media">${q.emoji}</div>
    <div class="palavra-grande"><span class="sil lendo">${q.word[0]}</span>${q.word.slice(1)}</div>`;
  registrar(q, 1);
  q._ok = true;
  mostrarFeedback("ok", "🦸", "Nova letra!", true);
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
  el.innerHTML = `<div class="figura">${q.emoji}</div>
    <div class="slots">${q.syllables.map(() => '<div class="slot"></div>').join("")}</div>`;
  let pos = 0, erros = 0;
  const slots = $$(".slot", el);
  const box = opcoes(el, q.tiles, {
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
        await Voz.falar(`Escute: ${q.word.toLowerCase()}. Agora a sílaba ${q.syllables[pos].toLowerCase()}.`);
      }
    },
  });
};

R.read_word = (q, el) => {
  const sils = q.syllables;
  el.innerHTML = `<div class="palavra-grande" id="pal-ler">${silabasHTML(sils)}</div>`;
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

/* ------------------------------------------------------------ pausa, coleção, pais */
function mostrarPausa() {
  mostrar("tela-pausa");
  desenharHerois();
  Voz.falar(`Hora de descansar os olhos! O ${nomeHeroi()} foi recarregar a energia. Amanhã tem mais missão!`);
}

function abrirColecao() {
  mostrar("tela-colecao");
  desenharHerois();
  $("#lista-capas").innerHTML = EST.capas.map((c) => {
    const tem = EST.xp >= c.xp;
    return `<button class="capa-op ${tem ? "" : "bloq"} ${EST.config.capa === c.id ? "sel" : ""}" data-id="${c.id}" style="background:${c.cor}">
      ${tem ? "" : "🔒"}<small>${tem ? c.nome : "⚡" + c.xp}</small></button>`;
  }).join("");
  $$(".capa-op").forEach((b) => b.onclick = async () => {
    if (b.classList.contains("bloq")) { Voz.falar("Junte mais pontos de energia para ganhar essa capa!"); return; }
    Som.toque();
    EST = await api("/api/config", { capa: b.dataset.id });
    aplicarCapa(); abrirColecao();
  });
  $("#lista-medalhas").innerHTML = EST.medalhas.map((m) => `<div class="medalha ${m.tem ? "" : "nao"}"><b>${m.icone}</b>${m.nome}</div>`).join("");
  Voz.falar("Escolha a cor da capa do seu herói!");
}

let contaPais = 0;
function abrirPais() {
  Voz.parar();
  mostrar("tela-pais");
  $("#pais-portao").classList.remove("escondido");
  $("#pais-conteudo").classList.add("escondido");
  const a = 12 + Math.floor(Math.random() * 18), b = 11 + Math.floor(Math.random() * 9);
  contaPais = a + b;
  $("#conta-pais").textContent = `${a} + ${b} = ?`;
  $("#resp-pais").value = ""; $("#senha-pais").value = ""; $("#pais-erro").textContent = "";
  $("#senha-pais").classList.toggle("escondido", !EST.tem_senha);
}
async function entrarPais() {
  if (Number($("#resp-pais").value) !== contaPais) { $("#pais-erro").textContent = "Resposta incorreta."; return; }
  const r = await api("/api/pais/entrar", { senha: $("#senha-pais").value });
  if (!r.ok) { $("#pais-erro").textContent = "Senha incorreta."; return; }
  $("#pais-portao").classList.add("escondido");
  $("#pais-conteudo").classList.remove("escondido");
  await preencherPais();
}
async function preencherPais() {
  const rel = await api("/api/relatorio");
  const minHoje = Math.round(EST.hoje.segundos / 60);
  $("#pais-resumo").innerHTML = `<div>⚡ ${rel.xp} pontos</div><div>🔥 ${rel.sequencia} ${rel.sequencia === 1 ? "dia seguido" : "dias seguidos"}</div>
    <div>📘 ${rel.total_licoes} lições feitas</div><div>⏱️ ${minHoje} de ${EST.config.minutos_dia} min hoje</div>`;
  const maxMin = Math.max(5, ...rel.semana.map((d) => d.segundos / 60));
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  $("#pais-semana").innerHTML = rel.semana.map((d) => {
    const dt = new Date(d.dia + "T12:00:00");
    return `<div><span>${Math.round(d.segundos / 60)}m</span><i style="height:${(d.segundos / 60 / maxMin) * 70}px"></i>${dias[dt.getDay()]}</div>`;
  }).join("");
  $("#pais-habilidades").innerHTML = rel.habilidades.length ? rel.habilidades.map((h) => {
    const p = Math.round((h.acertos / Math.max(1, h.tentativas)) * 100);
    const cor = p >= 80 ? "var(--verde)" : p >= 60 ? "#f59e0b" : "var(--vermelho)";
    return `<div class="hab"><div class="hab-top"><span>${h.grupo}</span><span>${p}% <small style="color:var(--suave)">(${h.tentativas})</small></span></div>
      <div class="hab-barra"><i style="width:${p}%;background:${cor}"></i></div>
      ${h.dificeis.length ? `<small>Praticar: ${h.dificeis.slice(0, 8).join(", ")}</small>` : ""}</div>`;
  }).join("") : "<p>Ainda sem dados. Faça algumas missões!</p>";
  const c = EST.config;
  $("#cfg-nome").value = c.nome_crianca; $("#cfg-heroi").value = c.nome_heroi;
  $("#cfg-minutos").value = c.minutos_dia; $("#cfg-meta").value = c.meta_licoes;
  $("#cfg-voz").value = c.voz_velocidade; $("#cfg-senha").value = "";
}
async function salvarConfig() {
  const dados = {
    nome_crianca: $("#cfg-nome").value.trim(), nome_heroi: $("#cfg-heroi").value.trim() || "Faísca",
    minutos_dia: Math.max(5, Math.min(60, Number($("#cfg-minutos").value) || 15)),
    meta_licoes: Math.max(1, Math.min(6, Number($("#cfg-meta").value) || 2)),
    voz_velocidade: Number($("#cfg-voz").value) || 0.85,
  };
  if ($("#cfg-senha").value) dados.senha_pais = $("#cfg-senha").value;
  EST = await api("/api/config", dados);
  aplicarCapa();
  $("#cfg-ok").textContent = "Salvo! ✓";
  setTimeout(() => ($("#cfg-ok").textContent = ""), 2000);
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
  $("#btn-entrar-pais").onclick = entrarPais;
  $("#resp-pais").onkeydown = (e) => { if (e.key === "Enter") entrarPais(); };
  $("#btn-salvar-cfg").onclick = salvarConfig;
  $("#btn-testar-voz").onclick = () => { EST.config.voz_velocidade = Number($("#cfg-voz").value); Voz.falar("Oi! Eu sou o seu herói. B com A faz ba. Bola!"); };
  $("#btn-liberar").onclick = async () => { EST = await api("/api/pais/liberar", {}); $("#cfg-ok").textContent = "Tempo de hoje liberado."; preencherPais(); };
  $("#btn-zerar").onclick = async () => {
    const t = prompt('Isso apaga todo o progresso. Digite ZERAR para confirmar:');
    if (t === "ZERAR") { EST = await api("/api/pais/zerar", { confirmar: "ZERAR" }); $("#cfg-ok").textContent = "Progresso zerado."; preencherPais(); }
  };
  $("#btn-backup").onclick = () => {
    const blob = new Blob([Motor.exportar()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `super-faisca-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $("#cfg-ok").textContent = "Backup salvo na pasta de downloads.";
  };
  $("#btn-restaurar").onclick = () => $("#arquivo-backup").click();
  $("#arquivo-backup").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      Motor.importar(await f.text());
      await carregar(); preencherPais();
      $("#cfg-ok").textContent = "Progresso restaurado! ✓";
    } catch (err) { $("#cfg-ok").textContent = "Não consegui ler esse arquivo de backup."; }
    e.target.value = "";
  };
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
  desenharHerois();
  ligar();
  await carregar();
});
