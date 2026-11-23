/* Currículo do Super Faísca — Letras & Números.
   Trilhas, lições e geradores de perguntas. Tudo roda no próprio aparelho.

   Princípios pedagógicos (ver LEIA-ME.md):
   - Leitura: correspondência letra-som sistemática (vogais -> consoantes
     frequentes), com a SÍLABA como ponte (unidade mais saliente no português).
     Ler (decodificar) e escrever/montar (codificar) andam juntos.
   - Matemática: Concreto -> Pictórico -> Abstrato (Singapura), subitização e
     quadro de dez, composição aditiva e problemas de juntar/tirar/comparar
     (Nunes & Bryant), padrões e formas (BNCC). */
"use strict";

const Curriculo = (() => {
  /* ---------- sorteio ---------- */
  const randint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const choice = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, k) => shuffle(a).slice(0, Math.min(k, a.length));
  const uniq = (a) => [...new Set(a)];
  const range = (lo, hiExcl) => Array.from({ length: Math.max(0, hiExcl - lo) }, (_, i) => lo + i);

  /* ---------- dados ---------- */
  const VOGAIS = ["A", "E", "I", "O", "U"];

  // Letra -> [palavra-chave, emoji]. A palavra-chave começa com o som da letra.
  const LETRAS = {
    A: ["ABELHA", "🐝"], E: ["ELEFANTE", "🐘"], I: ["IGREJA", "⛪"], O: ["OVO", "🥚"], U: ["UVA", "🍇"],
    M: ["MACACO", "🐒"], P: ["PATO", "🦆"], B: ["BOLA", "⚽"], T: ["TOMATE", "🍅"], D: ["DADO", "🎲"],
    L: ["LUA", "🌙"], F: ["FOGO", "🔥"], V: ["VACA", "🐄"], N: ["NAVIO", "🚢"], S: ["SAPO", "🐸"],
    C: ["CASA", "🏠"], G: ["GATO", "🐱"], R: ["RATO", "🐭"], J: ["JACARÉ", "🐊"],
  };

  // Famílias silábicas. C e G só com A, O, U (som "duro") nesta fase.
  const familia = (l) => (l === "C" || l === "G" ? ["A", "O", "U"] : VOGAIS).map((v) => l + v);

  // Palavras simples (sílabas consoante+vogal), com figura.
  const PALAVRAS = [
    ["MAPA", ["MA", "PA"], "🗺️"], ["PIPA", ["PI", "PA"], "🪁"], ["BEBÊ", ["BE", "BÊ"], "👶"],
    ["BOLA", ["BO", "LA"], "⚽"], ["BOLO", ["BO", "LO"], "🎂"], ["BOTA", ["BO", "TA"], "👢"],
    ["PATO", ["PA", "TO"], "🦆"], ["MALA", ["MA", "LA"], "🧳"], ["DADO", ["DA", "DO"], "🎲"],
    ["LUA", ["LU", "A"], "🌙"], ["LATA", ["LA", "TA"], "🥫"], ["LOBO", ["LO", "BO"], "🐺"],
    ["MOTO", ["MO", "TO"], "🏍️"], ["TOMATE", ["TO", "MA", "TE"], "🍅"], ["BATATA", ["BA", "TA", "TA"], "🥔"],
    ["UVA", ["U", "VA"], "🍇"], ["OVO", ["O", "VO"], "🥚"], ["VELA", ["VE", "LA"], "🕯️"],
    ["LUVA", ["LU", "VA"], "🧤"], ["FADA", ["FA", "DA"], "🧚"], ["SOFÁ", ["SO", "FÁ"], "🛋️"],
    ["SINO", ["SI", "NO"], "🔔"], ["MENINO", ["ME", "NI", "NO"], "👦"], ["MENINA", ["ME", "NI", "NA"], "👧"],
    ["BANANA", ["BA", "NA", "NA"], "🍌"], ["NAVIO", ["NA", "VI", "O"], "🚢"], ["SAPO", ["SA", "PO"], "🐸"],
    ["SAPATO", ["SA", "PA", "TO"], "👞"], ["BONÉ", ["BO", "NÉ"], "🧢"], ["CASA", ["CA", "SA"], "🏠"],
    ["CAMA", ["CA", "MA"], "🛏️"], ["GATO", ["GA", "TO"], "🐱"], ["GALO", ["GA", "LO"], "🐓"],
    ["VACA", ["VA", "CA"], "🐄"], ["FOGO", ["FO", "GO"], "🔥"], ["GOTA", ["GO", "TA"], "💧"],
    ["SUCO", ["SU", "CO"], "🧃"], ["COCO", ["CO", "CO"], "🥥"], ["CAFÉ", ["CA", "FÉ"], "☕"],
    ["CAVALO", ["CA", "VA", "LO"], "🐴"], ["MACACO", ["MA", "CA", "CO"], "🐒"], ["CAMELO", ["CA", "ME", "LO"], "🐫"],
    ["PIPOCA", ["PI", "PO", "CA"], "🍿"], ["CAMISA", ["CA", "MI", "SA"], "👕"], ["CANETA", ["CA", "NE", "TA"], "🖊️"],
    ["RATO", ["RA", "TO"], "🐭"], ["RÁDIO", ["RÁ", "DI", "O"], "📻"], ["JACARÉ", ["JA", "CA", "RÉ"], "🐊"],
    ["TELEFONE", ["TE", "LE", "FO", "NE"], "☎️"],
  ];

  // Frases curtas: [frase, emoji do sujeito, emoji do complemento]
  const FRASES = [
    ["O GATO NA CAMA", "🐱", "🛏️"], ["A BOLA NA CASA", "⚽", "🏠"], ["O MACACO COME BANANA", "🐒", "🍌"],
    ["O RATO COME BOLO", "🐭", "🎂"], ["A FADA NO SOFÁ", "🧚", "🛋️"], ["O SAPO NA LUA", "🐸", "🌙"],
    ["A LUVA NA MALA", "🧤", "🧳"], ["O GALO NA MOTO", "🐓", "🏍️"], ["O PATO NA GOTA", "🦆", "💧"],
    ["A VACA COME UVA", "🐄", "🍇"],
  ];

  // Objetos para contar: [emoji, singular, plural, gênero]
  const OBJETOS = [
    ["🍎", "maçã", "maçãs", "f"], ["🐞", "joaninha", "joaninhas", "f"], ["⭐", "estrela", "estrelas", "f"],
    ["🚗", "carrinho", "carrinhos", "m"], ["🐟", "peixe", "peixes", "m"], ["🎈", "balão", "balões", "m"],
    ["🍓", "morango", "morangos", "m"], ["🐥", "pintinho", "pintinhos", "m"], ["🦋", "borboleta", "borboletas", "f"],
    ["⚽", "bola", "bolas", "f"],
  ];

  const NOMES_NUM = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
    "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove", "vinte"];
  const FORMAS = { circulo: "CÍRCULO", quadrado: "QUADRADO", triangulo: "TRIÂNGULO", retangulo: "RETÂNGULO" };
  const CORES = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ec4899"];
  const PADRAO_EMOJIS = ["🔴", "🔵", "🟡", "🟢", "⭐", "🌙", "🍎", "🍌"];

  /* ---------- texto ---------- */
  const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const lower = (s) => s.toLowerCase();

  /** Palavras que só usam letras já ensinadas. */
  function palavrasCom(letras) {
    const ok = new Set([...letras, ...VOGAIS]);
    return PALAVRAS.filter((p) => [...semAcento(p[0])].every((c) => ok.has(c)));
  }
  const quantos = (o, maiuscula = true) => { const q = o[3] === "f" ? "quantas" : "quantos"; return maiuscula ? cap(q) : q; };
  /** Número por extenso, concordando 1 e 2 com o gênero (uma, duas). */
  const ext = (n, g = "m") => (g === "f" && (n === 1 || n === 2) ? (n === 1 ? "uma" : "duas") : NOMES_NUM[n]);
  /** "três maçãs", "uma joaninha", "dois peixes". */
  const nomeQtd = (n, o) => `${ext(n, o[3])} ${n === 1 ? o[1] : o[2]}`;

  /* ================================================================ leitura */
  function qIntroLetra(letra) {
    const [palavra, emoji] = LETRAS[letra];
    const fala = VOGAIS.includes(letra)
      ? `Esta é a letra ${letra}. ${letra} de ${lower(palavra)}!`
      : `Esta é a letra ${letra}. ${letra} de ${lower(palavra)}! ${letra} com A faz ${lower(familia(letra)[0])}.`;
    return { type: "intro_letter", letter: letra, word: palavra, emoji, speech: fala, skill: `letra:${letra}` };
  }

  function qSomLetra(letra, pool) {
    const choices = shuffle([...sample(pool.filter((l) => l !== letra), 2), letra]);
    return { type: "letter_sound", speech: `Toque na letra ${letra}.`, say: letra, choices, answer: letra, skill: `letra:${letra}` };
  }

  function qLetraInicial(letra, pool) {
    const [palavra, emoji] = LETRAS[letra];
    const choices = shuffle([...sample(pool.filter((l) => l !== letra), 2), letra]);
    return { type: "initial_letter", emoji, word: palavra, speech: `${lower(palavra)}. Com que letra começa ${lower(palavra)}?`,
      choices, answer: letra, skill: `letra:${letra}` };
  }

  function qJuntar(letra) {
    const vogal = choice(letra === "C" || letra === "G" ? ["A", "O", "U"] : VOGAIS);
    const sil = letra + vogal;
    const choices = shuffle([...sample(familia(letra).filter((s) => s !== sil), 2), sil]);
    return { type: "blend", parts: [letra, vogal], answer: sil, choices, speech: `${letra} com ${vogal}... que sílaba forma?`,
      say: lower(sil), skill: `silaba:${sil}` };
  }

  function qOuvirSilaba(letra, letrasPool) {
    const fam = familia(letra);
    const sil = choice(fam);
    const pool = letrasPool.flatMap(familia).filter((s) => s !== sil);
    const mesma = fam.filter((s) => s !== sil);
    let outra = pool.filter((s) => s.slice(-1) === sil.slice(-1) && s[0] !== letra);
    if (!outra.length) outra = pool;
    let choices = uniq([choice(mesma), choice(outra), sil]);
    while (choices.length < 3) { const c = choice(pool); if (!choices.includes(c)) choices.push(c); }
    return { type: "syllable_hear", speech: "Escute e toque na sílaba:", say: lower(sil), choices: shuffle(choices), answer: sil,
      skill: `silaba:${sil}` };
  }

  const qTracar = (letra) => ({ type: "trace", glyph: letra, speech: `Passe o dedo por cima da letra ${letra}.`, skill: `escrita:${letra}` });

  const todasSilabas = (letras) => [...letras.filter((l) => !VOGAIS.includes(l)).flatMap(familia), ...VOGAIS];

  function qMontarPalavra([palavra, sils, emoji], letras) {
    const extras = sample(todasSilabas(letras).filter((s) => !sils.includes(s)), 2);
    return { type: "build_word", emoji, word: palavra, syllables: sils, tiles: shuffle([...sils, ...extras]),
      speech: `Vamos escrever ${lower(palavra)}! Toque nas sílabas na ordem.`, say: lower(palavra), skill: `palavra:${palavra}` };
  }

  function qLerPalavra([palavra, sils, emoji], banco) {
    const distr = sample(banco.filter((p) => p[0] !== palavra), 2);
    return { type: "read_word", word: palavra, syllables: sils, choices: shuffle([...distr.map((p) => p[2]), emoji]), answer: emoji,
      speech: "Leia a palavra e toque na figura certa.", skill: `leitura:${palavra}` };
  }

  function qSilabaFaltando([palavra, sils, emoji], letras) {
    const i = randint(0, sils.length - 1);
    const certa = sils[i];
    const choices = shuffle([...sample(todasSilabas(letras).filter((s) => s !== certa), 2), certa]);
    return { type: "missing_syllable", emoji, word: palavra, shown: sils.map((s, j) => (j === i ? "_" : s)), choices, answer: certa,
      speech: `${lower(palavra)}. Que sílaba está faltando?`, say: lower(palavra), skill: `palavra:${palavra}` };
  }

  function qLerFrase([texto, suj, comp]) {
    const outros = FRASES.filter((f) => f[0] !== texto);
    const o1 = choice(outros.filter((f) => f[2] !== comp));
    const o2 = choice(outros.filter((f) => f[1] !== suj));
    return { type: "read_sentence", sentence: texto, choices: shuffle(uniq([suj + comp, suj + o1[2], o2[1] + comp])),
      answer: suj + comp, speech: "Leia a frase e toque na figura certa.", skill: `frase:${texto}` };
  }

  /* ============================================================= matemática */
  const obj = () => choice(OBJETOS);

  function numChoices(n, lo = 0, hi = 10, k = 3) {
    const pool = range(Math.max(lo, n - 3), Math.min(hi, n + 3) + 1).filter((x) => x !== n);
    return shuffle([...sample(pool, k - 1), n]);
  }

  function qContar(lo, hi, layout = "scatter") {
    const n = randint(lo, hi), o = obj();
    return { type: "count", emoji: o[0], n, layout, choices: numChoices(n, 1, Math.max(hi, 5)), answer: n,
      speech: `${quantos(o)} ${o[2]}? Conte e toque no número.`, skill: `contar:${n}` };
  }

  function qSubitizar(lo, hi, frame = "dice") {
    const n = randint(lo, hi);
    return { type: "subitize", n, frame, choices: numChoices(n, 1, 10), answer: n,
      speech: "Olhe rápido! Quantas bolinhas você viu?", skill: `ver:${n}` };
  }

  function qNumeroQtd(lo, hi) {
    const n = randint(lo, hi), o = obj();
    const grupos = shuffle([...sample(range(Math.max(1, lo - 1), hi + 2).filter((x) => x !== n), 2), n]);
    return { type: "numeral_to_qty", numeral: n, emoji: o[0], groups: grupos, answer: n,
      speech: `Onde tem ${nomeQtd(n, o)}?`, skill: `numeral:${n}` };
  }

  function qComparar(hi, modo) {
    const a = randint(1, hi);
    const b = choice(range(1, hi + 1).filter((x) => x !== a));
    const o = obj();
    return { type: "compare", emoji: o[0], left: a, right: b, mode: modo, answer: (a > b) === (modo === "mais") ? 0 : 1,
      speech: `Onde tem ${modo === "mais" ? "mais" : "menos"} ${o[2]}? Toque no grupo.`, skill: `comparar:${modo}` };
  }

  function qMaiorNumero(hi) {
    const [a, b] = sample(range(0, hi + 1), 2);
    return { type: "bigger_number", choices: [a, b], answer: Math.max(a, b), speech: "Qual número é o maior?", skill: "comparar:numeros" };
  }

  function qSequencia(hi, tipo) {
    let seq, ans, fala;
    if (tipo === "depois") {
      const n = randint(1, hi - 1);
      seq = [n - 2, n - 1, n, null].filter((x) => x === null || x >= 0);
      ans = n + 1;
      fala = `Que número vem depois do ${NOMES_NUM[n]}?`;
    } else if (tipo === "faltando") {
      const start = randint(0, hi - 4);
      seq = range(start, start + 5);
      const i = randint(1, 3);
      ans = seq[i]; seq[i] = null;
      fala = "Que número está faltando?";
    } else {
      const start = randint(4, Math.min(hi, 10));
      seq = [start, start - 1, start - 2, null];
      ans = start - 3;
      fala = "Contagem regressiva para decolar! Que número vem agora?";
    }
    return { type: "sequence", seq, answer: ans, kind: tipo, choices: numChoices(ans, 0, hi + 1), speech: fala, skill: `sequencia:${tipo}` };
  }

  function qQuadroDez(modo) {
    const n = randint(1, 9);
    if (modo === "quantos") {
      return { type: "ten_frame", n, mode: modo, choices: numChoices(n, 1, 10), answer: n,
        speech: "Quantas bolinhas tem no quadro?", skill: `dez:${n}` };
    }
    return { type: "ten_frame", n, mode: modo, choices: numChoices(10 - n, 1, 9), answer: 10 - n,
      speech: "Quantas faltam para completar dez?", skill: "dez:completar" };
  }

  function qJuntarNum(hi, abstrato = false) {
    const a = randint(1, hi - 1), b = randint(1, hi - a), o = obj();
    const fala = abstrato ? `Quanto é ${NOMES_NUM[a]} mais ${NOMES_NUM[b]}?`
      : o[3] === "f" ? `Junte as ${o[2]}! Quantas ficam?` : `Junte os ${o[2]}! Quantos ficam?`;
    return { type: "add", a, b, emoji: o[0], abstract: abstrato, choices: numChoices(a + b, 1, 10), answer: a + b,
      speech: fala, skill: "somar" + (abstrato ? ":abstrato" : "") };
  }

  function qTirar(hi, abstrato = false) {
    const a = randint(2, hi), b = randint(1, a - 1), o = obj();
    const fala = abstrato ? `Quanto é ${NOMES_NUM[a]} menos ${NOMES_NUM[b]}?`
      : `Tinha ${nomeQtd(a, o)}. ${cap(ext(b, o[3]))} ${b === 1 ? "foi" : "foram"} embora. ${quantos(o)} ficaram?`;
    return { type: "subtract", a, b, emoji: o[0], abstract: abstrato, choices: numChoices(a - b, 0, 10), answer: a - b,
      speech: fala, skill: "tirar" + (abstrato ? ":abstrato" : "") };
  }

  function qParteEscondida(hi) {
    const total = randint(3, hi), vis = randint(1, total - 1), o = obj();
    return { type: "hidden_part", total, visible: vis, emoji: o[0], choices: numChoices(total - vis, 0, hi), answer: total - vis,
      speech: `São ${nomeQtd(total, o)} ao todo. ${quantos(o)} ${o[3] === "f" ? "estão escondidas" : "estão escondidos"} atrás da nuvem?`,
      skill: "compor" };
  }

  /** Problemas aditivos (Nunes & Bryant): composição, transformação, comparação. */
  function qHistoria(hi) {
    const tipo = choice(["ganhou", "perdeu", "juntou", "comparou"]);
    const o = obj(), nome = choice(["O Rafa", "A Luna", "O Teo", "A Bia"]);
    const a = randint(2, hi - 2), g = o[3], q = quantos(o, false);
    let b, fala, ans, vis;
    if (tipo === "ganhou") {
      b = randint(1, hi - a);
      fala = `${nome} tinha ${nomeQtd(a, o)}. Ganhou mais ${ext(b, g)}. Com ${q} ficou?`;
      ans = a + b; vis = ["add", a, b];
    } else if (tipo === "perdeu") {
      b = randint(1, a - 1);
      fala = `${nome} tinha ${nomeQtd(a, o)}. Deu ${ext(b, g)} para um amigo. Com ${q} ficou?`;
      ans = a - b; vis = ["sub", a, b];
    } else if (tipo === "juntou") {
      b = randint(1, hi - a);
      fala = `Numa caixa tem ${nomeQtd(a, o)}. Na outra caixa tem ${ext(b, g)}. ${cap(q)} são ao todo?`;
      ans = a + b; vis = ["add", a, b];
    } else {
      b = randint(1, a - 1);
      const [art, nm] = nome.split(" ");
      fala = `${nome} tem ${nomeQtd(a, o)}. O amigo tem ${ext(b, g)}. ${cap(q)} ${o[2]} a mais ${lower(art)} ${nm} tem?`;
      ans = a - b; vis = ["cmp", a, b];
    }
    return { type: "story", speech: fala, emoji: o[0], visual: vis, choices: numChoices(ans, 0, Math.max(10, hi)), answer: ans, skill: `historia:${tipo}` };
  }

  function qPadrao(nivel) {
    const [a, b, c] = sample(PADRAO_EMOJIS, 3);
    const unidade = { 1: [a, b], 2: [a, a, b], 3: [a, b, c] }[nivel];
    const longa = [...unidade, ...unidade, ...unidade, ...unidade];
    const seq = longa.slice(0, unidade.length * 2 + 1);
    const ans = longa[seq.length];
    let choices = uniq([ans, a, b, c]).slice(0, 3);
    if (!choices.includes(ans)) choices[2] = ans;
    return { type: "pattern", seq, choices: shuffle(choices), answer: ans, speech: "O que vem depois? Descubra o segredo da fila!",
      skill: `padrao:${nivel}` };
  }

  function qForma() {
    const alvo = choice(Object.keys(FORMAS));
    const outras = sample(Object.keys(FORMAS).filter((f) => f !== alvo), 2);
    const shapes = shuffle([...outras, alvo].map((f) => ({ shape: f, color: choice(CORES),
      rot: choice([0, 0, 15, 30, 45, 90, 180]), scale: choice([0.7, 0.85, 1.0]) })));
    return { type: "shape", target: alvo, shapes, answer: alvo, speech: `Toque no ${lower(FORMAS[alvo])}.`, skill: `forma:${alvo}` };
  }

  function qDezena(modo) {
    if (modo === "teen") {
      const u = randint(1, 9), n = 10 + u;
      return { type: "teen", tens: 1, ones: u, choices: numChoices(n, 10, 20), answer: n,
        speech: `Dez e mais ${NOMES_NUM[u]}. Que número é esse?`, skill: `dezena:${n}` };
    }
    // barras de 10 e cubos de 1 (composição aditiva, Nunes & Bryant)
    const d = randint(1, 2), u = d === 1 ? randint(0, 9) : 0, n = d * 10 + u;
    return { type: "teen", tens: d, ones: u, choices: numChoices(n, 10, 20), answer: n,
      speech: "Cada barra vale dez. Cada cubinho vale um. Quanto tem ao todo?", skill: "dezena:blocos" };
  }

  /* ================================================================ trilhas */
  function letraLicao(letra, ensinadas) {
    const poolLetras = ensinadas.length >= 3 ? [...ensinadas] : uniq([...ensinadas, ...VOGAIS]);
    if (VOGAIS.includes(letra)) {
      return [qIntroLetra(letra), ...range(0, 3).map(() => qSomLetra(letra, poolLetras)),
        qLetraInicial(letra, poolLetras), qTracar(letra)];
    }
    const cons = ensinadas.filter((l) => !VOGAIS.includes(l));
    const qs = [qIntroLetra(letra), ...range(0, 3).map(() => qJuntar(letra)), ...range(0, 2).map(() => qOuvirSilaba(letra, cons))];
    if (cons.length >= 2) qs.push(qLetraInicial(letra, cons));
    qs.push(qTracar(letra));
    return qs;
  }

  function palavrasLicao(letras, nMontar = 3, nLer = 3, nFalta = 2) {
    const banco = palavrasCom(letras);
    return shuffle([
      ...sample(banco, nMontar).map((p) => qMontarPalavra(p, letras)),
      ...sample(banco, nLer).map((p) => qLerPalavra(p, banco)),
      ...sample(banco, nFalta).map((p) => qSilabaFaltando(p, letras)),
    ]);
  }

  const UNIDADES_LEITURA = [
    ["Vogais", ["A", "E", "I", "O", "U"]],
    ["M, P e B", ["M", "P", "B"]],
    ["T, D e L", ["T", "D", "L"]],
    ["F, V, N e S", ["F", "V", "N", "S"]],
    ["C, G, R e J", ["C", "G", "R", "J"]],
  ];

  /** As duas trilhas com unidades e lições (sem as perguntas). */
  function construirTrilhas() {
    const leitura = [];
    const ensinadas = [];
    UNIDADES_LEITURA.forEach(([titulo, letras], ui) => {
      const licoes = letras.map((l) => {
        ensinadas.push(l);
        return { id: `L${ui + 1}-${l}`, title: `Letra ${l}`, icon: l, gen: ["letra", l, [...ensinadas]] };
      });
      if (ui === 0) {
        licoes.push({ id: "L1-mix", title: "Todas as vogais", icon: "AEIOU", gen: ["vogais_mix"] });
      } else {
        licoes.push({ id: `L${ui + 1}-pal`, title: ui === 1 ? "Primeiras palavras" : "Palavras novas", icon: "📖", gen: ["palavras", [...ensinadas]] });
        licoes.push({ id: `L${ui + 1}-des`, title: "Desafio", icon: "🏆", gen: ["desafio_leitura", [...ensinadas], letras] });
      }
      leitura.push({ id: `L${ui + 1}`, title: titulo, lessons: licoes });
    });
    leitura.push({ id: "L6", title: "Primeiras frases", lessons: [
      { id: "L6-1", title: "Ler frases", icon: "💬", gen: ["frases", 1] },
      { id: "L6-2", title: "Ler mais frases", icon: "📚", gen: ["frases", 2] },
      { id: "L6-des", title: "Grande desafio", icon: "👑", gen: ["frases", 3] },
    ] });

    const matematica = [
      { id: "M1", title: "Números até 5", lessons: [
        { id: "M1-1", title: "Contar até 3", icon: "3", gen: ["m_contar", 1, 3] },
        { id: "M1-2", title: "Contar até 5", icon: "5", gen: ["m_contar", 1, 5] },
        { id: "M1-3", title: "Olhar rápido", icon: "⚡", gen: ["m_subitizar", 1, 5] },
        { id: "M1-4", title: "Escrever números", icon: "✏️", gen: ["m_tracar", 1, 5] },
      ] },
      { id: "M2", title: "Números até 10", lessons: [
        { id: "M2-1", title: "Contar até 10", icon: "10", gen: ["m_contar", 5, 10] },
        { id: "M2-2", title: "Quadro de dez", icon: "🔟", gen: ["m_quadro"] },
        { id: "M2-3", title: "Fila dos números", icon: "🚀", gen: ["m_sequencia", 10] },
        { id: "M2-4", title: "Escrever 6 a 9", icon: "✏️", gen: ["m_tracar", 6, 9] },
      ] },
      { id: "M3", title: "Mais ou menos", lessons: [
        { id: "M3-1", title: "Onde tem mais?", icon: "⚖️", gen: ["m_comparar", 5] },
        { id: "M3-2", title: "Maior e menor", icon: "🔢", gen: ["m_comparar", 10] },
      ] },
      { id: "M4", title: "Padrões e formas", lessons: [
        { id: "M4-1", title: "Segredo da fila", icon: "🔴", gen: ["m_padrao"] },
        { id: "M4-2", title: "Formas", icon: "🔺", gen: ["m_forma"] },
      ] },
      { id: "M5", title: "Juntar e tirar", lessons: [
        { id: "M5-1", title: "Juntar até 5", icon: "➕", gen: ["m_juntar", 5] },
        { id: "M5-2", title: "Tirar até 5", icon: "➖", gen: ["m_tirar", 5] },
        { id: "M5-3", title: "Partes escondidas", icon: "☁️", gen: ["m_partes", 6] },
        { id: "M5-4", title: "Juntar até 10", icon: "➕", gen: ["m_juntar", 10] },
      ] },
      { id: "M6", title: "Histórias", lessons: [
        { id: "M6-1", title: "Histórias de juntar", icon: "📖", gen: ["m_historia", 6] },
        { id: "M6-2", title: "Contas de herói", icon: "🧮", gen: ["m_abstrato", 10] },
        { id: "M6-3", title: "Histórias até 10", icon: "👑", gen: ["m_historia", 10] },
      ] },
      { id: "M7", title: "Até 20", lessons: [
        { id: "M7-1", title: "Dez e mais", icon: "1️⃣", gen: ["m_dezena", "teen"] },
        { id: "M7-2", title: "Barras e cubos", icon: "🧱", gen: ["m_dezena", "blocos"] },
        { id: "M7-3", title: "Fila até 20", icon: "🚀", gen: ["m_sequencia", 20] },
      ] },
    ];
    // unidades novas (curriculo_extra.js) entram depois das originais
    for (const u of EXTRAS.leitura) leitura.push(u);
    for (const u of EXTRAS.matematica) matematica.push(u);
    return JSON.parse(JSON.stringify({ leitura, matematica }));
  }

  /* ---------- extensões: outras listas de lições se registram aqui ---------- */
  const EXTRAS = { leitura: [], matematica: [] };
  const GERADORES = {};
  function registrar({ leitura = [], matematica = [] }, geradores) {
    EXTRAS.leitura.push(...leitura);
    EXTRAS.matematica.push(...matematica);
    Object.assign(GERADORES, geradores);
  }

  const vezes = (n, f) => range(0, n).map(f);

  /** Gera as perguntas de uma lição a partir da sua receita. */
  function gerarLicao(gen) {
    const [kind, p1, p2] = gen;
    switch (kind) {
      case "letra": return letraLicao(p1, p2);
      case "vogais_mix": return shuffle([...sample(VOGAIS, 4).map((v) => qSomLetra(v, VOGAIS)), ...sample(VOGAIS, 4).map((v) => qLetraInicial(v, VOGAIS))]);
      case "palavras": return palavrasLicao(p1);
      case "desafio_leitura": {
        const cons = p1.filter((l) => !VOGAIS.includes(l));
        return shuffle([...vezes(3, () => qOuvirSilaba(choice(p2), cons)), ...palavrasLicao(p1, 2, 3, 2)]);
      }
      case "frases": {
        const todas = UNIDADES_LEITURA.flatMap(([, ls]) => ls);
        const banco = palavrasCom(todas);
        const qs = [...sample(FRASES, 3 + p1).map(qLerFrase), ...sample(banco, 3).map((p) => qLerPalavra(p, banco))];
        if (p1 >= 2) qs.push(...sample(banco, 2).map((p) => qMontarPalavra(p, todas)));
        return shuffle(qs);
      }
      case "m_contar": {
        const layout = p2 <= 3 ? "line" : "scatter";
        return shuffle([...vezes(4, () => qContar(p1, p2, layout)), ...vezes(3, () => qNumeroQtd(Math.max(1, p1), p2)), qSubitizar(1, Math.min(p2, 5))]);
      }
      case "m_subitizar": return vezes(8, () => qSubitizar(p1, p2, choice(["dice", "dice", "random"])));
      case "m_tracar": return [
        ...range(p1, p2 + 1).map((n) => ({ type: "trace", glyph: String(n), speech: `Passe o dedo por cima do número ${NOMES_NUM[n]}.`, skill: `escrita:${n}` })),
        ...vezes(2, () => qContar(p1, p2)),
      ];
      case "m_quadro": return shuffle([...vezes(4, () => qQuadroDez("quantos")), ...vezes(3, () => qQuadroDez("faltam")), ...vezes(2, () => qSubitizar(3, 9, "tenframe"))]);
      case "m_sequencia": return ["depois", "depois", "faltando", "faltando", "faltando", "regressiva", "depois", "faltando"].map((t) => qSequencia(p1, t));
      case "m_comparar": return shuffle([...vezes(5, () => qComparar(Math.min(p1, 6), choice(["mais", "menos"]))), ...vezes(3, () => qMaiorNumero(p1))]);
      case "m_padrao": return [1, 1, 1, 2, 2, 2, 3, 3].map(qPadrao);
      case "m_forma": return vezes(8, qForma);
      case "m_juntar": return [...vezes(5, () => qJuntarNum(p1)), ...(p1 === 10 ? vezes(2, () => qQuadroDez("faltam")) : []), ...vezes(p1 === 10 ? 2 : 1, () => qJuntarNum(p1, true))];
      case "m_tirar": return [...vezes(6, () => qTirar(p1)), ...vezes(2, () => qTirar(p1, true))];
      case "m_partes": return vezes(7, () => qParteEscondida(p1));
      case "m_historia": return vezes(7, () => qHistoria(p1));
      case "m_abstrato": return shuffle([...vezes(4, () => qJuntarNum(10, true)), ...vezes(4, () => qTirar(10, true))]);
      case "m_dezena": return [...vezes(7, () => qDezena(p1)), qSequencia(20, "depois")];
      case "x": {
        if (!GERADORES[p1]) throw new Error("Gerador desconhecido: " + p1);
        return GERADORES[p1](...gen.slice(2));
      }
      default: throw new Error("Receita desconhecida: " + JSON.stringify(gen));
    }
  }

  /** id da lição -> { trilha, unidade, licao } */
  function mapaLicoes() {
    const out = {};
    for (const [trilha, unidades] of Object.entries(construirTrilhas())) {
      for (const u of unidades) for (const l of u.lessons) out[l.id] = { trilha, unidade: u, licao: l };
    }
    return out;
  }

  // ferramentas usadas pelas lições extras
  const util = { randint, choice, shuffle, sample, uniq, range, ext, nomeQtd, quantos, cap, lower, semAcento,
    NOMES_NUM, OBJETOS, VOGAIS, LETRAS, PALAVRAS, FRASES, familia, palavrasCom,
    qIntroLetra, qJuntar, qOuvirSilaba, qTracar, qMontarPalavra, qLerPalavra, qSilabaFaltando, qLerFrase,
    qHistoria, qJuntarNum, qTirar, qSequencia, qQuadroDez, qDezena, qComparar, qMaiorNumero, qContar, numChoices };

  return { construirTrilhas, gerarLicao, mapaLicoes, sample, shuffle, registrar, util };
})();

if (typeof module !== "undefined") module.exports = Curriculo; // para testes no Node
