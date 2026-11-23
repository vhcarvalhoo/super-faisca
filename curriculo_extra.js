/* Lições extras do Super Faísca: completam 100 lições de Letras e 100 de Números.
   Letras: minúsculas, Z/X/H, dígrafos, R/RR, S/SS/Ç, G/J, QU/GU, nasais, sílabas
   com R/L/S no fim, encontros consonantais, ditongos, consciência fonológica,
   frases, pontuação, textos curtos com perguntas e gramática inicial.
   Números: até 20, contas até 20, até 100, dinheiro, medidas, tempo, geometria,
   contas com reserva, multiplicação, divisão, até 1000, frações, gráficos,
   tabuadas e desafios. Conteúdo original, alinhado à BNCC (1º ao 3º ano). */
"use strict";

(() => {
  const U = Curriculo.util;
  const { randint, choice, shuffle, sample, uniq, range, ext, cap, lower, NOMES_NUM, OBJETOS } = U;
  /** Gera n perguntas evitando repetir a mesma pergunta na lição. */
  function vezes(n, f) {
    const out = [], vistos = new Set();
    for (let t = 0; out.length < n && t < n * 6; t++) {
      const q = f();
      const k = [q.speech, q.answer, q.texto, JSON.stringify(q.visual || q.emoji || "")].join("|");
      if (!vistos.has(k)) { vistos.add(k); out.push(q); }
    }
    while (out.length < n) out.push(f());
    return out;
  }
  const G = {}; // geradores registrados

  /* ------------------------------------------------------------------ base */
  /** Pergunta de múltipla escolha genérica. `opcoes` são distratores possíveis. */
  function mc(skill, speech, opcoes, resposta, extra = {}, n = 3) {
    const vistos = new Set([String(resposta)]);
    const outros = [];
    for (const o of opcoes) { const k = String(o); if (!vistos.has(k)) { vistos.add(k); outros.push(o); } }
    return { type: "mc", skill, speech, choices: shuffle([resposta, ...sample(outros, n - 1)]), answer: resposta, ...extra };
  }
  const numsPerto = (n, lo, hi, passos = [1, 2, 10, -1, -2, -10]) =>
    passos.map((p) => n + p).filter((x) => x >= lo && x <= hi && x !== n);

  /** Número por extenso até 1000. */
  function extenso(n) {
    if (n === 0) return "zero";
    if (n === 1000) return "mil";
    if (n === 100) return "cem";
    const UN = NOMES_NUM;
    const DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const CT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    const partes = [];
    const c = Math.floor(n / 100), r = n % 100;
    if (c) partes.push(CT[c]);
    if (r) {
      if (r < 20) partes.push(UN[r]);
      else { const d = Math.floor(r / 10), u = r % 10; partes.push(u ? `${DZ[d]} e ${UN[u]}` : DZ[d]); }
    }
    return partes.join(" e ");
  }
  const fmtReais = (cent) => `R$ ${Math.floor(cent / 100)},${String(cent % 100).padStart(2, "0")}`;
  function falaReais(cent) {
    const r = Math.floor(cent / 100), c = cent % 100;
    const pr = r ? `${r} ${r === 1 ? "real" : "reais"}` : "";
    const pc = c ? `${c} centavos` : "";
    return [pr, pc].filter(Boolean).join(" e ") || "zero reais";
  }

  /** Junta bancos de palavras sem repetir a figura (evita duas respostas iguais). */
  function bancoUnico(...listas) {
    const vistos = new Set(), out = [];
    for (const l of listas) for (const p of l) if (!vistos.has(p[2]) && !vistos.has(p[0])) { vistos.add(p[2]); vistos.add(p[0]); out.push(p); }
    return out;
  }

  /* ================================================================ LETRAS */
  // [palavra, sílabas, emoji]
  const W = {
    Z: [["ZERO", ["ZE", "RO"], "0️⃣"], ["BUZINA", ["BU", "ZI", "NA"], "📯"], ["ZEBRA", ["ZE", "BRA"], "🦓"], ["AZEITONA", ["A", "ZEI", "TO", "NA"], "🫒"]],
    X: [["LIXO", ["LI", "XO"], "🗑️"], ["ABACAXI", ["A", "BA", "CA", "XI"], "🍍"], ["XÍCARA", ["XÍ", "CA", "RA"], "☕"], ["CAIXA", ["CAI", "XA"], "📦"], ["PEIXE", ["PEI", "XE"], "🐟"], ["BRUXA", ["BRU", "XA"], "🧙"]],
    H: [["HIPOPÓTAMO", ["HI", "PO", "PÓ", "TA", "MO"], "🦛"], ["HOTEL", ["HO", "TEL"], "🏨"], ["HELICÓPTERO", ["HE", "LI", "CÓP", "TE", "RO"], "🚁"], ["HAMBÚRGUER", ["HAM", "BÚR", "GUER"], "🍔"], ["HOSPITAL", ["HOS", "PI", "TAL"], "🏥"], ["HOMEM", ["HO", "MEM"], "👨"]],
    CH: [["CHAVE", ["CHA", "VE"], "🔑"], ["CHUVA", ["CHU", "VA"], "🌧️"], ["CHAPÉU", ["CHA", "PÉU"], "🎩"], ["CHINELO", ["CHI", "NE", "LO"], "🩴"], ["CHOCOLATE", ["CHO", "CO", "LA", "TE"], "🍫"], ["MOCHILA", ["MO", "CHI", "LA"], "🎒"], ["BOLACHA", ["BO", "LA", "CHA"], "🍪"], ["CHÁ", ["CHÁ"], "🍵"]],
    LH: [["ABELHA", ["A", "BE", "LHA"], "🐝"], ["OLHO", ["O", "LHO"], "👁️"], ["ORELHA", ["O", "RE", "LHA"], "👂"], ["FOLHA", ["FO", "LHA"], "🍃"], ["COELHO", ["CO", "E", "LHO"], "🐰"], ["MILHO", ["MI", "LHO"], "🌽"], ["OVELHA", ["O", "VE", "LHA"], "🐑"], ["ILHA", ["I", "LHA"], "🏝️"], ["PALHAÇO", ["PA", "LHA", "ÇO"], "🤡"]],
    NH: [["MINHOCA", ["MI", "NHO", "CA"], "🪱"], ["GALINHA", ["GA", "LI", "NHA"], "🐔"], ["ARANHA", ["A", "RA", "NHA"], "🕷️"], ["UNHA", ["U", "NHA"], "💅"], ["RAINHA", ["RA", "I", "NHA"], "👸"], ["BANHO", ["BA", "NHO"], "🛁"], ["DINHEIRO", ["DI", "NHEI", "RO"], "💵"], ["CAMINHÃO", ["CA", "MI", "NHÃO"], "🚚"]],
    R: [["ARARA", ["A", "RA", "RA"], "🦜"], ["PERA", ["PE", "RA"], "🍐"], ["CORUJA", ["CO", "RU", "JA"], "🦉"], ["BARATA", ["BA", "RA", "TA"], "🪳"], ["CENOURA", ["CE", "NOU", "RA"], "🥕"], ["PIRULITO", ["PI", "RU", "LI", "TO"], "🍭"], ["GIRAFA", ["GI", "RA", "FA"], "🦒"]],
    RR: [["CARRO", ["CAR", "RO"], "🚗"], ["CACHORRO", ["CA", "CHOR", "RO"], "🐶"], ["TERRA", ["TER", "RA"], "🌍"], ["TORRE", ["TOR", "RE"], "🗼"], ["SERROTE", ["SER", "RO", "TE"], "🪚"], ["GUITARRA", ["GUI", "TAR", "RA"], "🎸"]],
    SS: [["PÁSSARO", ["PÁS", "SA", "RO"], "🐦"], ["OSSO", ["OS", "SO"], "🦴"], ["PÊSSEGO", ["PÊS", "SE", "GO"], "🍑"], ["MASSA", ["MAS", "SA"], "🍝"]],
    "Ç": [["LAÇO", ["LA", "ÇO"], "🎀"], ["BRAÇO", ["BRA", "ÇO"], "💪"], ["MAÇÃ", ["MA", "ÇÃ"], "🍎"], ["CORAÇÃO", ["CO", "RA", "ÇÃO"], "❤️"], ["ONÇA", ["ON", "ÇA"], "🐆"], ["CALÇA", ["CAL", "ÇA"], "👖"], ["TAÇA", ["TA", "ÇA"], "🏆"]],
    CE: [["CEBOLA", ["CE", "BO", "LA"], "🧅"], ["CIRCO", ["CIR", "CO"], "🎪"], ["CINEMA", ["CI", "NE", "MA"], "🎬"], ["CEREJA", ["CE", "RE", "JA"], "🍒"], ["DOCE", ["DO", "CE"], "🍬"], ["VACINA", ["VA", "CI", "NA"], "💉"]],
    GE: [["GELO", ["GE", "LO"], "🧊"], ["GIRAFA", ["GI", "RA", "FA"], "🦒"], ["TIGELA", ["TI", "GE", "LA"], "🥣"], ["MÁGICO", ["MÁ", "GI", "CO"], "🪄"], ["GELATINA", ["GE", "LA", "TI", "NA"], "🍮"]],
    QU: [["QUEIJO", ["QUEI", "JO"], "🧀"], ["ESQUILO", ["ES", "QUI", "LO"], "🐿️"], ["MOSQUITO", ["MOS", "QUI", "TO"], "🦟"], ["COQUEIRO", ["CO", "QUEI", "RO"], "🌴"], ["ARQUEIRO", ["AR", "QUEI", "RO"], "🏹"]],
    GU: [["FOGUETE", ["FO", "GUE", "TE"], "🚀"], ["GUITARRA", ["GUI", "TAR", "RA"], "🎸"], ["PREGUIÇA", ["PRE", "GUI", "ÇA"], "🦥"], ["FOGUEIRA", ["FO", "GUEI", "RA"], "🔥"]],
    NAS: [["PANDA", ["PAN", "DA"], "🐼"], ["DENTE", ["DEN", "TE"], "🦷"], ["PONTE", ["PON", "TE"], "🌉"], ["ONDA", ["ON", "DA"], "🌊"], ["MUNDO", ["MUN", "DO"], "🌎"], ["VENTO", ["VEN", "TO"], "🌬️"], ["ANJO", ["AN", "JO"], "👼"], ["PINGUIM", ["PIN", "GUIM"], "🐧"]],
    MPB: [["LÂMPADA", ["LÂM", "PA", "DA"], "💡"], ["TAMBOR", ["TAM", "BOR"], "🥁"], ["POMBO", ["POM", "BO"], "🕊️"], ["BOMBEIRO", ["BOM", "BEI", "RO"], "🧑‍🚒"], ["ACAMPAMENTO", ["A", "CAM", "PA", "MEN", "TO"], "⛺"]],
    AO: [["MÃO", ["MÃO"], "✋"], ["PÃO", ["PÃO"], "🍞"], ["AVIÃO", ["A", "VI", "ÃO"], "✈️"], ["LEÃO", ["LE", "ÃO"], "🦁"], ["BALÃO", ["BA", "LÃO"], "🎈"], ["LIMÃO", ["LI", "MÃO"], "🍋"], ["SABÃO", ["SA", "BÃO"], "🧼"], ["FEIJÃO", ["FEI", "JÃO"], "🫘"], ["CÃO", ["CÃO"], "🐕"]],
    FR: [["PORTA", ["POR", "TA"], "🚪"], ["BARCO", ["BAR", "CO"], "⛵"], ["GARFO", ["GAR", "FO"], "🍴"], ["CARTA", ["CAR", "TA"], "✉️"], ["TARTARUGA", ["TAR", "TA", "RU", "GA"], "🐢"], ["ÁRVORE", ["ÁR", "VO", "RE"], "🌳"], ["SORVETE", ["SOR", "VE", "TE"], "🍦"], ["COLHER", ["CO", "LHER"], "🥄"]],
    FL: [["SOL", ["SOL"], "☀️"], ["ANEL", ["A", "NEL"], "💍"], ["PAPEL", ["PA", "PEL"], "📄"], ["CARACOL", ["CA", "RA", "COL"], "🐌"], ["AZUL", ["A", "ZUL"], "🔵"], ["PINCEL", ["PIN", "CEL"], "🖌️"], ["BALDE", ["BAL", "DE"], "🪣"], ["SALSICHA", ["SAL", "SI", "CHA"], "🌭"]],
    FS: [["LÁPIS", ["LÁ", "PIS"], "✏️"], ["ÔNIBUS", ["Ô", "NI", "BUS"], "🚌"], ["ESCOVA", ["ES", "CO", "VA"], "🪥"], ["ESCADA", ["ES", "CA", "DA"], "🪜"], ["MOSCA", ["MOS", "CA"], "🪰"], ["CASTELO", ["CAS", "TE", "LO"], "🏰"], ["VESTIDO", ["VES", "TI", "DO"], "👗"], ["PASTA", ["PAS", "TA"], "📁"]],
    BR: [["COBRA", ["CO", "BRA"], "🐍"], ["CABRA", ["CA", "BRA"], "🐐"], ["LIVRO", ["LI", "VRO"], "📖"], ["CRIANÇA", ["CRI", "AN", "ÇA"], "🧒"], ["MICROFONE", ["MI", "CRO", "FO", "NE"], "🎤"], ["DRAGÃO", ["DRA", "GÃO"], "🐉"], ["PEDRA", ["PE", "DRA"], "🪨"], ["QUADRO", ["QUA", "DRO"], "🖼️"]],
    TR: [["FRANGO", ["FRAN", "GO"], "🍗"], ["GRILO", ["GRI", "LO"], "🦗"], ["TIGRE", ["TI", "GRE"], "🐯"], ["PRATO", ["PRA", "TO"], "🍽️"], ["PRAIA", ["PRAI", "A"], "🏖️"], ["PRESENTE", ["PRE", "SEN", "TE"], "🎁"], ["TREM", ["TREM"], "🚆"], ["TRATOR", ["TRA", "TOR"], "🚜"], ["ESTRELA", ["ES", "TRE", "LA"], "⭐"]],
    BL: [["BICICLETA", ["BI", "CI", "CLE", "TA"], "🚲"], ["CLIPE", ["CLI", "PE"], "📎"], ["FLOR", ["FLOR"], "🌸"], ["GLOBO", ["GLO", "BO"], "🌐"], ["PLANETA", ["PLA", "NE", "TA"], "🪐"], ["PLACA", ["PLA", "CA"], "🪧"], ["BLOCO", ["BLO", "CO"], "🧱"], ["TECLADO", ["TE", "CLA", "DO"], "⌨️"]],
    DI1: [["PEIXE", ["PEI", "XE"], "🐟"], ["BEIJO", ["BEI", "JO"], "💋"], ["RAIO", ["RAI", "O"], "⚡"], ["BALEIA", ["BA", "LEI", "A"], "🐋"], ["BOI", ["BOI"], "🐂"], ["CADEIRA", ["CA", "DEI", "RA"], "🪑"], ["DOIS", ["DOIS"], "2️⃣"]],
    DI2: [["TESOURA", ["TE", "SOU", "RA"], "✂️"], ["OURO", ["OU", "RO"], "🥇"], ["CHAPÉU", ["CHA", "PÉU"], "🎩"], ["VASSOURA", ["VAS", "SOU", "RA"], "🧹"], ["PAUZINHO", ["PAU", "ZI", "NHO"], "🥢"]],
    GRANDES: [["HIPOPÓTAMO", ["HI", "PO", "PÓ", "TA", "MO"], "🦛"], ["HELICÓPTERO", ["HE", "LI", "CÓP", "TE", "RO"], "🚁"], ["TARTARUGA", ["TAR", "TA", "RU", "GA"], "🐢"], ["BICICLETA", ["BI", "CI", "CLE", "TA"], "🚲"], ["CHOCOLATE", ["CHO", "CO", "LA", "TE"], "🍫"], ["MICROFONE", ["MI", "CRO", "FO", "NE"], "🎤"], ["PIRULITO", ["PI", "RU", "LI", "TO"], "🍭"], ["TELEFONE", ["TE", "LE", "FO", "NE"], "☎️"], ["DINOSSAURO", ["DI", "NOS", "SAU", "RO"], "🦕"], ["BORBOLETA", ["BOR", "BO", "LE", "TA"], "🦋"], ["ELEFANTE", ["E", "LE", "FAN", "TE"], "🐘"], ["ABACAXI", ["A", "BA", "CA", "XI"], "🍍"]],
  };
  const TODAS = bancoUnico(U.PALAVRAS, ...Object.values(W));

  // [grafia mostrada, sílabas da família, palavra-chave, emoji, fala de apresentação]
  const GRAFIAS = {
    Z: ["Z", ["ZA", "ZE", "ZI", "ZO", "ZU"], "ZEBRA", "🦓", "Esta é a letra Z. Z de zebra! Z com A faz za."],
    X: ["X", ["XA", "XE", "XI", "XO", "XU"], "XÍCARA", "☕", "Esta é a letra X. X de xícara! X com A faz xa."],
    H: ["H", null, "HOTEL", "🏨", "Esta é a letra H. No começo da palavra, o H não tem som! Hotel se lê otel."],
    CH: ["CH", ["CHA", "CHE", "CHI", "CHO", "CHU"], "CHUVA", "🌧️", "C com H juntos fazem um som novo: chuva! CH com A faz cha."],
    LH: ["LH", ["LHA", "LHE", "LHI", "LHO", "LHU"], "FOLHA", "🍃", "L com H juntos fazem o som de folha! LH com A faz lha."],
    NH: ["NH", ["NHA", "NHE", "NHI", "NHO", "NHU"], "GALINHA", "🐔", "N com H juntos fazem o som de galinha! NH com A faz nha."],
    R: ["R", ["RA", "RE", "RI", "RO", "RU"], "ARARA", "🦜", "Quando o R fica entre duas vogais, o som é fraquinho, como em arara."],
    RR: ["RR", null, "CARRO", "🚗", "Dois R juntos no meio da palavra fazem o som forte, como em carro."],
    SS: ["SS", null, "PÁSSARO", "🐦", "Dois S juntos no meio da palavra fazem o som de S, como em pássaro."],
    "Ç": ["Ç", ["ÇA", "ÇO", "ÇU"], "LAÇO", "🎀", "Este é o C com cedilha. Ele faz o som de S, como em laço. Ç com A faz ça."],
    CE: ["CE CI", ["CE", "CI", "CA", "CO"], "CEBOLA", "🧅", "C com E faz ce, e C com I faz ci, com som de S, como em cebola e circo."],
    GE: ["GE GI", ["GE", "GI", "GA", "GO"], "GELO", "🧊", "G com E faz ge, e G com I faz gi, com som de J, como em gelo e girafa."],
    QU: ["QUE QUI", ["QUE", "QUI", "QUA"], "QUEIJO", "🧀", "Q e U andam juntos. QU com E faz que, como em queijo. QU com I faz qui, como em esquilo."],
    GU: ["GUE GUI", ["GUE", "GUI", "GA", "GO"], "FOGUETE", "🚀", "G e U juntos com E ou I: gue, como em foguete, e gui, como em guitarra."],
    NAS: ["AN EN IN ON UN", ["AN", "EN", "IN", "ON", "UN"], "PANDA", "🐼", "Quando o N vem depois da vogal, o som sai pelo nariz: an, en, in, on, un. Como em panda."],
    MPB: ["AM EM IM OM UM", ["AM", "EM", "IM", "OM", "UM"], "TAMBOR", "🥁", "Antes de P e de B, a gente usa M, e não N. Como em tambor e lâmpada."],
    AO: ["ÃO", ["ÃO", "ÃE", "ÕE"], "BALÃO", "🎈", "O til em cima do A faz um som pelo nariz: ão, como em balão e pão."],
    FR: ["AR ER IR OR UR", ["AR", "ER", "IR", "OR", "UR"], "PORTA", "🚪", "O R também pode fechar a sílaba: ar, er, ir, or, ur. Como em porta: por, ta."],
    FL: ["AL EL IL OL UL", ["AL", "EL", "IL", "OL", "UL"], "SOL", "☀️", "O L também pode fechar a sílaba: al, el, il, ol, ul. Como em sol."],
    FS: ["AS ES IS OS US", ["AS", "ES", "IS", "OS", "US"], "ESCADA", "🪜", "O S também pode fechar a sílaba: as, es, is, os, us. Como em escada: es, ca, da."],
    BR: ["BR CR DR", ["BRA", "CRA", "DRA", "BRO", "CRO", "DRO"], "COBRA", "🐍", "Duas consoantes juntas: B com R faz bra, como em cobra. C com R faz cra. D com R faz dra."],
    TR: ["FR GR PR TR VR", ["FRA", "GRA", "PRA", "TRA", "VRA", "TRE", "PRE", "GRE"], "PRATO", "🍽️", "F, G, P, T e V também se juntam com o R: pra, como em prato. Tra, como em trator."],
    BL: ["BL CL FL GL PL", ["BLA", "CLA", "FLA", "GLA", "PLA", "BLO", "CLE", "FLO"], "PLANETA", "🪐", "Consoantes também se juntam com o L: pla, como em planeta. Flo, como em flor."],
    DI1: ["AI EI OI", ["AI", "EI", "OI"], "BEIJO", "💋", "Duas vogais juntas na mesma sílaba: ai, ei, oi. Como em beijo e boi."],
    DI2: ["AU EU OU", ["AU", "EU", "OU"], "OURO", "🥇", "Mais vogais juntinhas: au, eu, ou. Como em ouro e chapéu."],
  };
  // ortografia: [emoji, certa, ...erradas]
  const ORTO = {
    RR: [["🚗", "CARRO", "CARO"], ["🌍", "TERRA", "TERA"], ["🐶", "CACHORRO", "CACHORO"], ["🗼", "TORRE", "TORE"], ["🍐", "PERA", "PERRA"], ["🦜", "ARARA", "ARRARA"], ["🦉", "CORUJA", "CORRUJA"], ["🥕", "CENOURA", "CENOURRA"], ["🪚", "SERROTE", "SEROTE"], ["🦒", "GIRAFA", "GIRRAFA"]],
    S: [["🐦", "PÁSSARO", "PÁSARO", "PÁÇARO"], ["🦴", "OSSO", "OSO", "OÇO"], ["🍝", "MASSA", "MASA"], ["🎀", "LAÇO", "LASSO", "LASO"], ["💪", "BRAÇO", "BRASSO", "BRASO"], ["🍎", "MAÇÃ", "MASSÃ", "MASÃ"], ["🧅", "CEBOLA", "SEBOLA", "SSEBOLA"], ["🎪", "CIRCO", "SIRCO", "SSIRCO"], ["🍬", "DOCE", "DOSSE", "DOÇE"], ["🍑", "PÊSSEGO", "PÊSEGO", "PÊÇEGO"]],
    GJ: [["🧊", "GELO", "JELO"], ["🦒", "GIRAFA", "JIRAFA"], ["🥣", "TIGELA", "TIJELA"], ["🪄", "MÁGICO", "MÁJICO"], ["🍆", "BERINJELA", "BERINGELA"], ["🐍", "JIBOIA", "GIBOIA"], ["🍮", "GELATINA", "JELATINA"]],
    QG: [["🧀", "QUEIJO", "QEIJO", "CUEIJO"], ["🚀", "FOGUETE", "FOGETE", "FOGHETE"], ["🐿️", "ESQUILO", "ESCILO", "ESQILO"], ["🎸", "GUITARRA", "GITARRA", "GUITARA"], ["🦟", "MOSQUITO", "MOSCITO", "MOSQITO"], ["🦥", "PREGUIÇA", "PREGIÇA", "PREGUISSA"]],
    MN: [["💡", "LÂMPADA", "LÂNPADA"], ["🥁", "TAMBOR", "TANBOR"], ["🕊️", "POMBO", "PONBO"], ["🐼", "PANDA", "PAMDA"], ["🦷", "DENTE", "DEMTE"], ["🌊", "ONDA", "OMDA"], ["🧑‍🚒", "BOMBEIRO", "BONBEIRO"], ["⛺", "ACAMPAMENTO", "ACANPAMENTO"]],
    XCH: [["🔑", "CHAVE", "XAVE"], ["🗑️", "LIXO", "LICHO"], ["🍍", "ABACAXI", "ABACACHI"], ["🌧️", "CHUVA", "XUVA"], ["📦", "CAIXA", "CAICHA"], ["🎒", "MOCHILA", "MOXILA"]],
    LHLI: [["🐝", "ABELHA", "ABELIA", "ABELA"], ["🌽", "MILHO", "MILIO", "MILO"], ["🐔", "GALINHA", "GALINIA", "GALINA"], ["🕷️", "ARANHA", "ARANIA", "ARANA"], ["🐰", "COELHO", "COELIO", "COELO"]],
  };

  /* ---------- perguntas de leitura ---------- */
  function qIntroGrafia(chave) {
    const [grafia, , palavra, emoji, fala] = GRAFIAS[chave];
    return { type: "intro_letter", letter: grafia, word: palavra, emoji, speech: fala, skill: `grafia:${chave}`, destaque: grafia.split(" ")[0].length };
  }
  function qJuntarGrafia(chave) {
    const [grafia, sils] = GRAFIAS[chave];
    const sil = choice(sils.slice(0, Math.min(sils.length, 5)));
    // separa a sílaba em duas peças: início + fim
    let a, b;
    if (/^(AN|EN|IN|ON|UN|AM|EM|IM|OM|UM|AR|ER|IR|OR|UR|AL|EL|IL|OL|UL|AS|ES|IS|OS|US|AI|EI|OI|AU|EU|OU)$/.test(sil)) { a = sil[0]; b = sil[1]; }
    else if (sil === "ÃO" || sil === "ÃE" || sil === "ÕE") { a = sil[0]; b = sil[1]; }
    else { a = sil.slice(0, -1); b = sil.slice(-1); }
    return { type: "blend", parts: [a, b], answer: sil, choices: shuffle([sil, ...sample(sils.filter((s) => s !== sil), 2)]),
      speech: `${a} com ${b}... que sílaba forma?`, say: lower(sil), skill: `silaba:${sil}` };
  }
  function qOuvirGrafia(chave) {
    const [, sils] = GRAFIAS[chave];
    const sil = choice(sils);
    return { type: "syllable_hear", speech: "Escute e toque na sílaba:", say: lower(sil),
      choices: shuffle([sil, ...sample(sils.filter((s) => s !== sil), 2)]), answer: sil, skill: `silaba:${sil}` };
  }
  const silabasDe = (lista) => uniq(lista.flatMap((p) => p[1]));
  function qMontar(p, banco) {
    const extras = sample(silabasDe(banco).filter((s) => !p[1].includes(s)), 2);
    return { type: "build_word", emoji: p[2], word: p[0], syllables: p[1], tiles: shuffle([...p[1], ...extras]),
      speech: `Vamos escrever ${lower(p[0])}! Toque nas sílabas na ordem.`, say: lower(p[0]), skill: `palavra:${p[0]}` };
  }
  function qFaltando(p, banco) {
    if (p[1].length < 2) return qLer(p, banco);
    const i = randint(0, p[1].length - 1), certa = p[1][i];
    return { type: "missing_syllable", emoji: p[2], word: p[0], shown: p[1].map((s, j) => (j === i ? "_" : s)),
      choices: shuffle([certa, ...sample(silabasDe(banco).filter((s) => s !== certa), 2)]), answer: certa,
      speech: `${lower(p[0])}. Que sílaba está faltando?`, say: lower(p[0]), skill: `palavra:${p[0]}` };
  }
  function qLer(p, banco, minusc = false) {
    const distr = sample(banco.filter((x) => x[2] !== p[2]), 2);
    return { type: "read_word", word: p[0], syllables: p[1], minusculas: minusc, choices: shuffle([p[2], ...distr.map((x) => x[2])]), answer: p[2],
      speech: "Leia a palavra e toque na figura certa.", skill: `leitura:${p[0]}` };
  }
  function qOrto(item, skill) {
    const [emoji, certa, ...erradas] = item;
    return mc(skill, "Qual é o jeito certo de escrever?", erradas, certa, { emoji, estilo: "txt", falarResposta: lower(certa) }, 1 + erradas.length);
  }

  /** Lição padrão de uma grafia nova (CH, LH, nasais...): apresentação, sílabas, ler, escrever. */
  function licaoGrafia(chave, chaveBanco = chave, orto = null) {
    const banco = bancoUnico(W[chaveBanco]);
    const temSil = !!GRAFIAS[chave][1];
    const qs = [qIntroGrafia(chave)];
    if (temSil) qs.push(qJuntarGrafia(chave), qJuntarGrafia(chave), qOuvirGrafia(chave), qOuvirGrafia(chave));
    for (const p of sample(banco, 2)) qs.push(qLer(p, banco));
    for (const p of sample(banco, 2)) qs.push(qMontar(p, banco));
    qs.push(qFaltando(choice(banco), banco));
    if (orto) for (const it of sample(ORTO[orto], 2)) qs.push(qOrto(it, `orto:${orto}`));
    return qs;
  }
  function licaoPalavras(chaves, orto = []) {
    const banco = bancoUnico(...chaves.map((c) => W[c]));
    const qs = [];
    for (const p of sample(banco, 3)) qs.push(qLer(p, banco));
    for (const p of sample(banco, 3)) qs.push(qMontar(p, banco));
    for (const p of sample(banco, 2)) qs.push(qFaltando(p, banco));
    for (const o of orto) qs.push(qOrto(choice(ORTO[o]), `orto:${o}`));
    return shuffle(qs);
  }
  function licaoOrto(chaves) {
    const itens = chaves.flatMap((c) => ORTO[c].map((it) => [it, c]));
    return sample(itens, 8).map(([it, c]) => qOrto(it, `orto:${c}`));
  }
  function licaoDesafio(chavesGrafia, chavesBanco, orto = []) {
    const banco = bancoUnico(...chavesBanco.map((c) => W[c]));
    const qs = [];
    const comSil = chavesGrafia.filter((c) => GRAFIAS[c][1]);
    if (comSil.length) qs.push(qOuvirGrafia(choice(comSil)), qJuntarGrafia(choice(comSil)));
    for (const p of sample(banco, 2)) qs.push(qLer(p, banco));
    for (const p of sample(banco, 2)) qs.push(qMontar(p, banco));
    qs.push(qFaltando(choice(banco), banco));
    for (const o of orto) qs.push(qOrto(choice(ORTO[o]), `orto:${o}`));
    return shuffle(qs);
  }

  /* ---------- minúsculas ---------- */
  const PARECIDAS = { b: "dpqh", d: "bpqa", p: "qbdg", q: "pdbg", m: "nwu", n: "mhu", u: "nvo", a: "oed", e: "ac o", i: "lj", l: "ij", f: "tj", t: "fl", g: "qpj", j: "gil", h: "nbk", r: "nv", v: "uwr", s: "zc", z: "sx", c: "eo", o: "ace", x: "zk" };
  function qCaixa(letra, paraMinuscula) {
    const min = lower(letra);
    const parecidas = [...(PARECIDAS[min] || "aeo")].filter((c) => c.trim() && c !== min);
    if (paraMinuscula) {
      return mc(`minuscula:${min}`, `Esta é a letra ${letra} maiúscula. Qual é a ${letra} minúscula?`, parecidas, min,
        { texto: letra, textoClasse: "letra", estilo: "letra", falarResposta: letra });
    }
    return mc(`minuscula:${min}`, `Esta é a letra ${letra} minúscula. Qual é a ${letra} maiúscula?`, parecidas.map((c) => c.toUpperCase()), letra,
      { texto: min, textoClasse: "letra", estilo: "letra", falarResposta: letra });
  }
  function licaoMinusculas(letras) {
    const qs = [];
    for (const l of sample(letras, Math.min(4, letras.length))) qs.push(qCaixa(l, true));
    for (const l of sample(letras, Math.min(4, letras.length))) qs.push(qCaixa(l, false));
    const banco = U.palavrasCom(letras.length > 5 ? letras : U.VOGAIS.concat(["M", "P", "B"]));
    if (banco.length >= 3) for (const p of sample(banco, 2)) qs.push(qLer(p, banco, true));
    return shuffle(qs);
  }

  /* ---------- consciência fonológica ---------- */
  const RIMAS = [
    [["GATO", "🐱"], ["PATO", "🦆"], ["RATO", "🐭"], ["SAPATO", "👞"], ["PRATO", "🍽️"]],
    [["MÃO", "✋"], ["PÃO", "🍞"], ["CÃO", "🐕"], ["LEÃO", "🦁"], ["AVIÃO", "✈️"], ["BALÃO", "🎈"], ["LIMÃO", "🍋"], ["SABÃO", "🧼"]],
    [["ABELHA", "🐝"], ["ORELHA", "👂"], ["OVELHA", "🐑"]],
    [["VELA", "🕯️"], ["ESTRELA", "⭐"], ["JANELA", "🪟"]],
    [["ARANHA", "🕷️"], ["CASTANHA", "🌰"], ["MONTANHA", "⛰️"]],
    [["BOLA", "⚽"], ["CEBOLA", "🧅"], ["ESCOLA", "🏫"]],
    [["DADO", "🎲"], ["TECLADO", "⌨️"], ["MACHADO", "🪓"]],
    [["BICICLETA", "🚲"], ["PLANETA", "🪐"], ["CANETA", "🖊️"], ["BORBOLETA", "🦋"]],
    [["MACACO", "🐒"], ["BURACO", "🕳️"]],
    [["QUEIJO", "🧀"], ["BEIJO", "💋"]],
    [["TESOURA", "✂️"], ["VASSOURA", "🧹"], ["CENOURA", "🥕"]],
  ];
  const rotulo = ([p, e]) => `${e} ${p}`;
  function qRima() {
    const g = choice(RIMAS);
    const [alvo, par] = sample(g, 2);
    const outros = RIMAS.filter((x) => x !== g).flat();
    const distr = sample(outros, 2);
    return { type: "mc", skill: "fono:rima", speech: `Qual palavra rima com ${lower(alvo[0])}?`, emoji: alvo[1], texto: alvo[0], textoClasse: "palavra",
      choices: shuffle([rotulo(par), ...distr.map(rotulo)]), answer: rotulo(par), estilo: "cartao", falarResposta: `${lower(alvo[0])} e ${lower(par[0])}` };
  }
  function qContarSilabas() {
    const p = choice(TODAS);
    const n = p[1].length;
    return mc("fono:silabas", `Bata palmas para cada pedaço: ${lower(p[0])}. Quantas sílabas tem ${lower(p[0])}?`, [1, 2, 3, 4, 5].filter((x) => x !== n), n,
      { emoji: p[2], texto: p[0], textoClasse: "palavra", estilo: "num", falarResposta: `${p[1].map(lower).join(", ")}. ${n} sílabas` }, 4);
  }
  function qMesmaSilaba(posicao) {
    const idx = (p) => (posicao === "inicio" ? 0 : p[1].length - 1);
    for (let t = 0; t < 50; t++) {
      const alvo = choice(TODAS);
      const s = alvo[1][idx(alvo)];
      const pares = TODAS.filter((p) => p !== alvo && p[1][idx(p)] === s);
      if (!pares.length) continue;
      const par = choice(pares);
      const distr = sample(TODAS.filter((p) => p[1][idx(p)] !== s && p[0][0] !== alvo[0][0] && p[2] !== alvo[2]), 2);
      const r = (p) => `${p[2]} ${p[0]}`;
      return { type: "mc", skill: `fono:${posicao}`,
        speech: posicao === "inicio" ? `Qual palavra começa com o mesmo pedaço de ${lower(alvo[0])}?` : `Qual palavra termina com o mesmo pedaço de ${lower(alvo[0])}?`,
        emoji: alvo[2], texto: alvo[0], textoClasse: "palavra", choices: shuffle([r(par), ...distr.map(r)]), answer: r(par), estilo: "cartao",
        falarResposta: `${lower(alvo[0])} e ${lower(par[0])}: ${lower(s)}` };
    }
    return qRima();
  }

  /* ---------- frases ---------- */
  const FRASES2 = [
    ["O GATO BEBE LEITE", "🐱🥛"], ["A MENINA CHUTA A BOLA", "👧⚽"], ["O SAPO PULA NA ÁGUA", "🐸💧"], ["O CACHORRO COME OSSO", "🐶🦴"],
    ["A ABELHA VOA NA FLOR", "🐝🌸"], ["O MENINO LÊ UM LIVRO", "👦📖"], ["A VACA DORME NO PASTO", "🐄😴"], ["O MACACO SOBE NA ÁRVORE", "🐒🌳"],
    ["O PEIXE NADA NO MAR", "🐟🌊"], ["A FADA TEM UMA VARINHA", "🧚🪄"], ["O BEBÊ TOMA BANHO", "👶🛁"], ["O PÁSSARO CANTA", "🐦🎵"],
  ];
  function qSepararPalavras() {
    const [frase] = choice(FRASES2);
    const ps = frase.split(" ");
    const juntar = (i) => [...ps.slice(0, i), ps[i] + ps[i + 1], ...ps.slice(i + 2)].join(" ");
    const erradas = uniq(range(0, ps.length - 1).map(juntar));
    if (ps.length >= 3) erradas.push(ps.join(""));
    return mc("frase:separar", "Qual frase está escrita com os espaços certos entre as palavras?", erradas, frase, { estilo: "txt", falarResposta: lower(frase) });
  }
  function qContarPalavras() {
    const [frase, emoji] = choice(FRASES2);
    const n = frase.split(" ").length;
    return mc("frase:contar", "Quantas palavras tem esta frase?", [n - 1, n + 1, n + 2].filter((x) => x > 0), n,
      { texto: frase, textoClasse: "frase", emoji, estilo: "num", falarResposta: `${n} palavras` });
  }
  const COMPLETAR = [
    ["O GATO BEBE ___.", "LEITE", ["PEDRA", "SAPATO"], "🐱🥛"], ["A GALINHA BOTA ___.", "OVO", ["BOLA", "CARRO"], "🐔🥚"],
    ["O PEIXE VIVE NA ___.", "ÁGUA", ["CAMA", "ÁRVORE"], "🐟💧"], ["EU ESCOVO OS ___.", "DENTES", ["SAPATOS", "LIVROS"], "🪥🦷"],
    ["A ABELHA FAZ ___.", "MEL", ["PÃO", "SUCO"], "🐝🍯"], ["DE NOITE APARECE A ___.", "LUA", ["CHUVA", "PRAIA"], "🌙"],
    ["O COELHO COME ___.", "CENOURA", ["SOPA", "PIPOCA"], "🐰🥕"], ["NO INVERNO FAZ ___.", "FRIO", ["CALOR", "SOL"], "🥶"],
    ["A CHAVE ABRE A ___.", "PORTA", ["NUVEM", "BANANA"], "🔑🚪"], ["O SOL É ___.", "AMARELO", ["AZUL", "ROXO"], "☀️"],
    ["A GIRAFA TEM PESCOÇO ___.", "COMPRIDO", ["CURTO", "QUADRADO"], "🦒"], ["O PALHAÇO MORA NO ___.", "CIRCO", ["MAR", "CÉU"], "🤡🎪"],
  ];
  function qCompletar() {
    const [frase, certa, erradas, emoji] = choice(COMPLETAR);
    return mc("frase:completar", "Que palavra completa a frase?", erradas, certa, { texto: frase, textoClasse: "frase", emoji, estilo: "txt",
      falarResposta: lower(frase.replace("___", certa)) });
  }
  function qOrdenarFrase() {
    const [frase, emoji] = choice(FRASES2);
    const ps = frase.split(" ");
    return { type: "build_word", emoji, word: frase, syllables: ps, tiles: shuffle(ps), frase: true,
      speech: "Toque nas palavras na ordem certa para formar a frase da figura.", say: lower(frase), skill: "frase:ordenar" };
  }
  const PONTUACAO = [
    ["VOCÊ GOSTA DE BOLO", "?"], ["QUAL É O SEU NOME", "?"], ["ONDE ESTÁ O GATO", "?"], ["QUANTOS ANOS VOCÊ TEM", "?"], ["VAMOS BRINCAR", "?"],
    ["O SOL É AMARELO", "."], ["EU MORO NUMA CASA", "."], ["A BOLA É REDONDA", "."], ["HOJE É DOMINGO", "."], ["O CÉU ESTÁ AZUL", "."],
    ["QUE DIA LINDO", "!"], ["SOCORRO", "!"], ["QUE SUSTO", "!"], ["PARABÉNS PRA VOCÊ", "!"], ["OBA, VAI TER FESTA", "!"],
  ];
  const NOME_SINAL = { ".": "ponto final", "?": "ponto de interrogação", "!": "ponto de exclamação" };
  function qPontuacao(sinais) {
    const [frase, sinal] = choice(PONTUACAO.filter((p) => sinais.includes(p[1])));
    return mc("frase:pontuacao", "Que sinal termina esta frase?", sinais.filter((s) => s !== sinal), sinal,
      { texto: frase + " ___", textoClasse: "frase", estilo: "letra", falarResposta: NOME_SINAL[sinal], dica: ". conta algo   ? pergunta   ! emoção" }, sinais.length);
  }

  /* ---------- textos curtos (originais) ---------- */
  const TEXTOS = [
    { titulo: "O bilhete", emoji: "📝", texto: "Mamãe, fui à casa da vovó.\nVolto às 5 horas.\nLevei o guarda-chuva.\nBeijos, Teo.", perguntas: [
      ["Quem escreveu o bilhete?", "Teo", ["Mamãe", "Vovó"]], ["Para quem é o bilhete?", "Para a mamãe", ["Para o Teo", "Para a vovó"]],
      ["Aonde o Teo foi?", "À casa da vovó", ["À escola", "Ao parque"]], ["Que horas ele volta?", "Às 5 horas", ["Às 2 horas", "Às 9 horas"]],
      ["O que o Teo levou?", "O guarda-chuva", ["A bola", "O bolo"]]] },
    { titulo: "A gata Mimi", emoji: "🐈", texto: "Mimi é uma gata branca.\nEla gosta de dormir no sofá.\nUm dia, Mimi viu um passarinho na janela.\nEla pulou, mas o passarinho voou!\nEntão, Mimi voltou a dormir.", perguntas: [
      ["De que cor é a Mimi?", "Branca", ["Preta", "Amarela"]], ["Onde a Mimi gosta de dormir?", "No sofá", ["Na cama", "No jardim"]],
      ["O que a Mimi viu na janela?", "Um passarinho", ["Um rato", "Uma borboleta"]], ["O que o passarinho fez?", "Voou", ["Cantou", "Dormiu"]],
      ["O que a Mimi fez no final?", "Voltou a dormir", ["Comeu", "Foi passear"]]] },
    { titulo: "A lista da festa", emoji: "🎉", texto: "Lista da festa da Bia:\n2 bolos\n10 balões\n1 pacote de pipoca\n6 copos\nsuco de uva", perguntas: [
      ["Para que é essa lista?", "Para a festa da Bia", ["Para a escola", "Para o mercado do Teo"]], ["Quantos balões a Bia precisa?", "10", ["2", "6"]],
      ["Qual é o suco da festa?", "Suco de uva", ["Suco de laranja", "Suco de maçã"]], ["Quantos bolos vão ter?", "2", ["1", "10"]],
      ["O que tem 6 na lista?", "Copos", ["Bolos", "Balões"]]] },
    { titulo: "O convite", emoji: "💌", texto: "Venha à festa do Rafa!\nEle vai fazer 6 anos.\nDia: sábado.\nHora: 3 da tarde.\nLocal: Rua das Flores, número 20.", perguntas: [
      ["De quem é a festa?", "Do Rafa", ["Da Bia", "Do Teo"]], ["Quantos anos o Rafa vai fazer?", "6 anos", ["3 anos", "20 anos"]],
      ["Em que dia é a festa?", "Sábado", ["Domingo", "Segunda-feira"]], ["A que horas começa a festa?", "3 da tarde", ["6 da tarde", "20 horas"]],
      ["Em que rua é a festa?", "Rua das Flores", ["Rua do Sol", "Rua da Praia"]]] },
    { titulo: "A semente", emoji: "🌱", texto: "Luna plantou uma semente num vaso.\nTodo dia ela colocava um pouco de água.\nO vaso ficava perto da janela, para pegar sol.\nDepois de uma semana, nasceu uma plantinha verde.\nLuna ficou muito feliz!", perguntas: [
      ["O que a Luna plantou?", "Uma semente", ["Uma árvore", "Uma flor de papel"]], ["O que ela colocava todo dia?", "Água", ["Leite", "Areia"]],
      ["Por que o vaso ficava perto da janela?", "Para pegar sol", ["Para pegar chuva", "Para ficar bonito"]],
      ["Quando nasceu a plantinha?", "Depois de uma semana", ["No mesmo dia", "Depois de um ano"]], ["Como a Luna ficou?", "Muito feliz", ["Triste", "Com medo"]]] },
    { titulo: "O piquenique", emoji: "🧺", texto: "No domingo, a família do Teo fez um piquenique no parque.\nEles levaram sanduíche, frutas e suco.\nDe repente, começou a chover!\nTodos correram para debaixo de uma árvore.\nQuando a chuva passou, apareceu um arco-íris.", perguntas: [
      ["Em que dia foi o piquenique?", "No domingo", ["Na segunda-feira", "No sábado"]], ["Onde foi o piquenique?", "No parque", ["Na praia", "Na escola"]],
      ["O que eles levaram?", "Sanduíche, frutas e suco", ["Pizza e refrigerante", "Bolo e sorvete"]],
      ["O que aconteceu de repente?", "Começou a chover", ["Começou a nevar", "Ficou de noite"]], ["O que apareceu quando a chuva passou?", "Um arco-íris", ["Uma estrela", "A lua"]]] },
  ];
  function licaoTexto(i) {
    const t = TEXTOS[i];
    return t.perguntas.map(([perg, certa, erradas]) => mc(`texto:${i + 1}`, perg, erradas, certa,
      { leitura: { titulo: t.titulo, emoji: t.emoji, texto: t.texto }, estilo: "txt", falarResposta: certa }));
  }

  /* ---------- palavras e sentidos ---------- */
  const GENERO = [["GATO", "GATA"], ["MENINO", "MENINA"], ["LEÃO", "LEOA"], ["GALO", "GALINHA"], ["BOI", "VACA"], ["REI", "RAINHA"], ["PAI", "MÃE"],
    ["CAVALO", "ÉGUA"], ["PATO", "PATA"], ["PROFESSOR", "PROFESSORA"], ["AVÔ", "AVÓ"], ["HOMEM", "MULHER"], ["IRMÃO", "IRMÃ"], ["TIO", "TIA"], ["PRÍNCIPE", "PRINCESA"]];
  function qGenero() {
    const [m, f] = choice(GENERO);
    const ingenua = m.endsWith("O") && m.slice(0, -1) + "A" !== f ? [m.slice(0, -1) + "A"] : [];
    if (Math.random() < 0.6) {
      return mc("gram:genero", `Qual é o feminino de ${lower(m)}?`, [...ingenua, ...sample(GENERO.filter((g) => g[1] !== f), 3).map((g) => g[1])], f,
        { texto: m, textoClasse: "palavra", estilo: "txt", falarResposta: lower(f) });
    }
    return mc("gram:genero", `Qual é o masculino de ${lower(f)}?`, sample(GENERO.filter((g) => g[0] !== m), 3).map((g) => g[0]), m,
      { texto: f, textoClasse: "palavra", estilo: "txt", falarResposta: lower(m) });
  }
  const PLURAL = [["BOLA", "BOLAS", "BOLAES"], ["FLOR", "FLORES", "FLORS"], ["PÃO", "PÃES", "PÃOS"], ["BALÃO", "BALÕES", "BALÃOS"], ["MÃO", "MÃOS", "MÃES"],
    ["ANEL", "ANÉIS", "ANELS"], ["LÁPIS", "LÁPIS", "LÁPISES"], ["PAPEL", "PAPÉIS", "PAPELS"], ["LEÃO", "LEÕES", "LEÃOS"], ["MAR", "MARES", "MARS"],
    ["NARIZ", "NARIZES", "NARIZS"], ["ÔNIBUS", "ÔNIBUS", "ÔNIBUSES"], ["TREM", "TRENS", "TREMS"], ["JARDIM", "JARDINS", "JARDIMS"], ["CASA", "CASAS", "CASAES"]];
  function qPlural() {
    const [s, p, errada] = choice(PLURAL);
    const outra = s.endsWith("S") ? s + "ES" : s + "S";
    return mc("gram:plural", `Se é um só, a gente diz ${lower(s)}. Se são muitos, como a gente escreve?`, [errada, outra], p,
      { texto: `1 ${s} → 2 ___`, textoClasse: "frase", estilo: "txt", falarResposta: lower(p) });
  }
  const CONTRARIOS = [["GRANDE", "PEQUENO"], ["ALTO", "BAIXO"], ["QUENTE", "FRIO"], ["CHEIO", "VAZIO"], ["DIA", "NOITE"], ["ABERTO", "FECHADO"],
    ["FELIZ", "TRISTE"], ["RÁPIDO", "DEVAGAR"], ["LIMPO", "SUJO"], ["NOVO", "VELHO"], ["MOLHADO", "SECO"], ["CLARO", "ESCURO"], ["LONGE", "PERTO"],
    ["DENTRO", "FORA"], ["SUBIR", "DESCER"], ["ENTRAR", "SAIR"]];
  function qContrario() {
    const par = choice(CONTRARIOS);
    const [a, b] = Math.random() < 0.5 ? par : [par[1], par[0]];
    return mc("gram:contrario", `Qual é o contrário de ${lower(a)}?`, sample(CONTRARIOS.filter((c) => c !== par), 3).map((c) => c[randint(0, 1)]), b,
      { texto: a, textoClasse: "palavra", estilo: "txt", falarResposta: `${lower(a)} e ${lower(b)}` });
  }
  const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  function qAlfabeto() {
    const tipo = choice(["depois", "antes", "primeiro"]);
    if (tipo === "primeiro") {
      const ps = sample(TODAS.filter((p, i, arr) => arr.findIndex((x) => x[0][0] === p[0][0]) === i), 3);
      const certa = [...ps].sort((x, y) => U.semAcento(x[0]).localeCompare(U.semAcento(y[0])))[0];
      return mc("gram:alfabeto", "Qual palavra vem primeiro na ordem alfabética, como no dicionário?", ps.filter((p) => p !== certa).map((p) => `${p[2]} ${p[0]}`), `${certa[2]} ${certa[0]}`,
        { estilo: "cartao", falarResposta: lower(certa[0]) });
    }
    const i = tipo === "depois" ? randint(0, 24) : randint(1, 25);
    const certa = ALFABETO[tipo === "depois" ? i + 1 : i - 1];
    const distr = [ALFABETO[i], ALFABETO[Math.max(0, i - 2)], ALFABETO[Math.min(25, i + 2)]];
    return mc("gram:alfabeto", `Que letra vem ${tipo} do ${ALFABETO[i]}?`, distr, certa,
      { texto: tipo === "depois" ? `${ALFABETO[i]} → ?` : `? → ${ALFABETO[i]}`, textoClasse: "letra", estilo: "letra", falarResposta: certa });
  }

  /* ---------- registro das lições de letras ---------- */
  const g = (k, f) => { G[k] = f; return ["x", k]; };
  const L = (id, title, icon, gen) => ({ id, title, icon, gen });
  const leitura = [
    { id: "L7", title: "Letras minúsculas", lessons: [
      L("L7-1", "a e i o u", "a", g("min1", () => licaoMinusculas(["A", "E", "I", "O", "U"]))),
      L("L7-2", "m p b t d l", "b", g("min2", () => licaoMinusculas(["M", "P", "B", "T", "D", "L"]))),
      L("L7-3", "f v n s c g r j", "g", g("min3", () => licaoMinusculas(["F", "V", "N", "S", "C", "G", "R", "J"]))),
      L("L7-4", "Ler em minúsculas", "abc", g("min4", () => { const b = U.palavrasCom(Object.keys(U.LETRAS)); return [...sample(b, 6).map((p) => qLer(p, b, true)), qCaixa("Q", true), qCaixa("H", true)]; })),
    ] },
    { id: "L8", title: "Z, X e H", lessons: [
      L("L8-Z", "Letra Z", "Z", g("gZ", () => licaoGrafia("Z"))),
      L("L8-X", "Letra X", "X", g("gX", () => licaoGrafia("X", "X", "XCH"))),
      L("L8-H", "Letra H", "H", g("gH", () => licaoGrafia("H"))),
      L("L8-pal", "Palavras com Z, X e H", "📖", g("pZXH", () => licaoPalavras(["Z", "X", "H"]))),
      L("L8-des", "Desafio", "🏆", g("dZXH", () => licaoDesafio(["Z", "X"], ["Z", "X", "H"], ["XCH"]))),
    ] },
    { id: "L9", title: "CH, LH e NH", lessons: [
      L("L9-CH", "CH", "CH", g("gCH", () => licaoGrafia("CH", "CH", "XCH"))),
      L("L9-LH", "LH", "LH", g("gLH", () => licaoGrafia("LH", "LH", "LHLI"))),
      L("L9-NH", "NH", "NH", g("gNH", () => licaoGrafia("NH", "NH", "LHLI"))),
      L("L9-pal", "Palavras com CH, LH, NH", "📖", g("pDig", () => licaoPalavras(["CH", "LH", "NH"], ["LHLI"]))),
      L("L9-des", "Desafio", "🏆", g("dDig", () => licaoDesafio(["CH", "LH", "NH"], ["CH", "LH", "NH"], ["XCH", "LHLI"]))),
    ] },
    { id: "L10", title: "R e RR", lessons: [
      L("L10-1", "R entre vogais", "R", g("gR", () => licaoGrafia("R"))),
      L("L10-2", "RR", "RR", g("gRR", () => licaoGrafia("RR", "RR", "RR"))),
      L("L10-3", "R ou RR?", "❓", g("oRR", () => licaoOrto(["RR"]))),
      L("L10-des", "Desafio", "🏆", g("dRR", () => licaoDesafio(["R"], ["R", "RR"], ["RR", "RR"]))),
    ] },
    { id: "L11", title: "SS, Ç, CE e CI", lessons: [
      L("L11-SS", "SS", "SS", g("gSS", () => licaoGrafia("SS", "SS", "S"))),
      L("L11-Ç", "Ç", "Ç", g("gC", () => licaoGrafia("Ç", "Ç", "S"))),
      L("L11-CE", "CE e CI", "CE", g("gCE", () => licaoGrafia("CE", "CE", "S"))),
      L("L11-3", "S, SS ou Ç?", "❓", g("oS", () => licaoOrto(["S"]))),
      L("L11-des", "Desafio", "🏆", g("dS", () => licaoDesafio(["Ç", "CE"], ["SS", "Ç", "CE"], ["S", "S"]))),
    ] },
    { id: "L12", title: "GE, GI, QU e GU", lessons: [
      L("L12-GE", "GE e GI", "GE", g("gGE", () => licaoGrafia("GE", "GE", "GJ"))),
      L("L12-QU", "QUE e QUI", "QU", g("gQU", () => licaoGrafia("QU", "QU", "QG"))),
      L("L12-GU", "GUE e GUI", "GU", g("gGU", () => licaoGrafia("GU", "GU", "QG"))),
      L("L12-3", "G ou J?", "❓", g("oGJ", () => licaoOrto(["GJ", "QG"]))),
      L("L12-des", "Desafio", "🏆", g("dGQ", () => licaoDesafio(["GE", "QU", "GU"], ["GE", "QU", "GU"], ["GJ", "QG"]))),
    ] },
    { id: "L13", title: "Sons pelo nariz", lessons: [
      L("L13-1", "AN EN IN ON UN", "AN", g("gNAS", () => licaoGrafia("NAS"))),
      L("L13-2", "M antes de P e B", "MB", g("gMPB", () => licaoGrafia("MPB", "MPB", "MN"))),
      L("L13-3", "ÃO", "ÃO", g("gAO", () => licaoGrafia("AO"))),
      L("L13-pal", "Palavras com som nasal", "📖", g("pNAS", () => licaoPalavras(["NAS", "MPB", "AO"], ["MN"]))),
      L("L13-des", "Desafio", "🏆", g("dNAS", () => licaoDesafio(["NAS", "MPB", "AO"], ["NAS", "MPB", "AO"], ["MN", "MN"]))),
    ] },
    { id: "L14", title: "R, L e S no fim da sílaba", lessons: [
      L("L14-R", "AR ER IR OR UR", "AR", g("gFR", () => licaoGrafia("FR"))),
      L("L14-L", "AL EL IL OL UL", "AL", g("gFL", () => licaoGrafia("FL"))),
      L("L14-S", "AS ES IS OS US", "AS", g("gFS", () => licaoGrafia("FS"))),
      L("L14-pal", "Palavras", "📖", g("pFIM", () => licaoPalavras(["FR", "FL", "FS"]))),
      L("L14-des", "Desafio", "🏆", g("dFIM", () => licaoDesafio(["FR", "FL", "FS"], ["FR", "FL", "FS"]))),
    ] },
    { id: "L15", title: "Consoantes juntas", lessons: [
      L("L15-BR", "BR CR DR", "BR", g("gBR", () => licaoGrafia("BR"))),
      L("L15-TR", "FR GR PR TR VR", "TR", g("gTR", () => licaoGrafia("TR"))),
      L("L15-BL", "BL CL FL GL PL", "PL", g("gBL", () => licaoGrafia("BL"))),
      L("L15-pal", "Palavras", "📖", g("pENC", () => licaoPalavras(["BR", "TR", "BL"]))),
      L("L15-des", "Desafio", "🏆", g("dENC", () => licaoDesafio(["BR", "TR", "BL"], ["BR", "TR", "BL"]))),
    ] },
    { id: "L16", title: "Vogais juntinhas", lessons: [
      L("L16-1", "AI EI OI", "OI", g("gDI1", () => licaoGrafia("DI1"))),
      L("L16-2", "AU EU OU", "OU", g("gDI2", () => licaoGrafia("DI2"))),
      L("L16-3", "Palavras grandes", "🐘", g("pGR", () => { const b = W.GRANDES; return [...sample(b, 4).map((p) => qMontar(p, b)), ...sample(b, 3).map((p) => qLer(p, b)), qContarSilabas()]; })),
      L("L16-des", "Desafio", "🏆", g("dDI", () => licaoDesafio(["DI1", "DI2"], ["DI1", "DI2", "GRANDES"]))),
    ] },
    { id: "L17", title: "Brincando com sons", lessons: [
      L("L17-1", "Rimas", "🎵", g("rima1", () => vezes(8, qRima))),
      L("L17-2", "Contar sílabas", "👏", g("sil", () => vezes(8, qContarSilabas))),
      L("L17-3", "Mesmo começo", "▶️", g("ini", () => vezes(8, () => qMesmaSilaba("inicio")))),
      L("L17-4", "Mesmo final", "⏹️", g("fim", () => vezes(8, () => qMesmaSilaba("fim")))),
      L("L17-5", "Desafio dos sons", "🏆", g("fono", () => shuffle([...vezes(3, qRima), ...vezes(2, qContarSilabas), qMesmaSilaba("inicio"), qMesmaSilaba("fim"), qRima()]))),
    ] },
    { id: "L18", title: "Frases", lessons: [
      L("L18-1", "Separar palavras", "✂️", g("sep", () => shuffle([...vezes(5, qSepararPalavras), ...vezes(3, qContarPalavras)]))),
      L("L18-2", "Completar a frase", "✍️", g("comp", () => sample(COMPLETAR, 8).map(() => qCompletar()))),
      L("L18-3", "Ordenar a frase", "🔀", g("ord", () => vezes(6, qOrdenarFrase))),
      L("L18-4", "Ponto final e pergunta", "❓", g("pont1", () => vezes(8, () => qPontuacao([".", "?"])))),
      L("L18-5", "Exclamação!", "❗", g("pont2", () => vezes(8, () => qPontuacao([".", "?", "!"])))),
      L("L18-des", "Desafio das frases", "🏆", g("dFr", () => shuffle([qSepararPalavras(), qContarPalavras(), qCompletar(), qCompletar(), qOrdenarFrase(), qOrdenarFrase(), qPontuacao([".", "?", "!"]), qPontuacao([".", "?", "!"])]))),
    ] },
    { id: "L19", title: "Pequenos textos", lessons: TEXTOS.map((t, i) => L(`L19-${i + 1}`, t.titulo, t.emoji, g(`txt${i}`, () => licaoTexto(i)))) },
    { id: "L20", title: "Palavras e sentidos", lessons: [
      L("L20-1", "Masculino e feminino", "👫", g("gen", () => vezes(8, qGenero))),
      L("L20-2", "Um e muitos", "🍎", g("plu", () => vezes(8, qPlural))),
      L("L20-3", "Contrários", "↔️", g("con", () => vezes(8, qContrario))),
      L("L20-4", "Ordem alfabética", "🔤", g("alf", () => vezes(8, qAlfabeto))),
      L("L20-des", "Grande desafio final", "👑", g("dFinalL", () => shuffle([qGenero(), qPlural(), qContrario(), qAlfabeto(), qRima(), qCompletar(), qPontuacao([".", "?", "!"]), ...licaoTexto(randint(0, 5)).slice(0, 2)]))),
    ] },
  ];

  /* ============================================================ MATEMÁTICA */
  const opNum = (skill, speech, n, distr, extra = {}) => mc(skill, speech, distr, n, { estilo: "num", ...extra });

  // M8 números até 20
  function qContar20() { const n = randint(11, 20); return opNum("num20:contar", "Quantas bolinhas tem nos dois quadros?", n, numsPerto(n, 10, 20, [1, -1, 2, -2, 10]), { visual: { k: "quadros", n } }); }
  function qComparar20() {
    const [a, b, c] = sample(range(0, 21), 3);
    const maior = Math.random() < 0.5;
    return opNum("num20:comparar", maior ? "Qual é o maior número?" : "Qual é o menor número?", maior ? Math.max(a, b, c) : Math.min(a, b, c), [a, b, c], {}, 3);
  }
  function qParImpar() {
    if (Math.random() < 0.6) {
      const n = randint(2, 14);
      return mc("num20:par", "Forme pares. Esse número é par ou ímpar?", ["PAR", "ÍMPAR"], n % 2 ? "ÍMPAR" : "PAR",
        { visual: { k: "pares", e: choice(OBJETOS)[0], n }, texto: String(n), textoClasse: "numero", estilo: "txt", falarResposta: n % 2 ? "ímpar: sobrou um sem par" : "par: todos têm par" }, 2);
    }
    const par = choice([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    return opNum("num20:par", "Qual destes números é par?", par, sample([1, 3, 5, 7, 9, 11, 13, 15, 17, 19], 2));
  }
  function qDobro(max = 10) {
    const n = randint(1, max);
    return opNum("num20:dobro", `Dobro é duas vezes. Qual é o dobro de ${n}?`, 2 * n, [n, 2 * n + 1, 2 * n - 1, n + 2, 2 * n + 2],
      max <= 10 ? { visual: { k: "grupos", e: choice(OBJETOS)[0], grupos: [n, n] } } : { visual: { k: "conta", txt: `${n} + ${n} = ?` } });
  }
  // M9 contas até 20
  function qAmigos10() { const a = randint(1, 9); return opNum("conta:amigos10", `${a} mais quanto dá 10?`, 10 - a, numsPerto(10 - a, 0, 10, [1, -1, 2]), { visual: { k: "conta", txt: `${a} + ? = 10`, quadro: a } }); }
  function qDobros() {
    const n = randint(2, 9), quase = Math.random() < 0.5;
    const r = quase ? n + n + 1 : n + n;
    return opNum("conta:dobros", quase ? `Quanto é ${n} mais ${n + 1}? Dica: pense no dobro de ${n} e some um.` : `Quanto é ${n} mais ${n}?`, r, numsPerto(r, 0, 20),
      { visual: { k: "conta", txt: quase ? `${n} + ${n + 1} = ?` : `${n} + ${n} = ?` } });
  }
  function qSomar20() { const a = randint(3, 15), b = randint(2, 20 - a); return opNum("conta:somar20", `Quanto é ${a} mais ${b}?`, a + b, numsPerto(a + b, 0, 20), { visual: { k: "conta", txt: `${a} + ${b} = ?` } }); }
  function qTirar20() { const a = randint(8, 20), b = randint(2, a - 1); return opNum("conta:tirar20", `Quanto é ${a} menos ${b}?`, a - b, numsPerto(a - b, 0, 20), { visual: { k: "conta", txt: `${a} − ${b} = ?` } }); }
  function qFamilia() {
    const a = randint(2, 9), b = randint(2, 9), s = a + b;
    const t = choice(["sub1", "sub2", "add"]);
    if (t === "add") return opNum("conta:familia", `Se ${s} menos ${b} é ${a}, quanto é ${a} mais ${b}?`, s, numsPerto(s, 0, 20), { visual: { k: "conta", txt: `${s} − ${b} = ${a}\n${a} + ${b} = ?` } });
    const [x, y] = t === "sub1" ? [a, b] : [b, a];
    return opNum("conta:familia", `Se ${a} mais ${b} é ${s}, quanto é ${s} menos ${y}?`, x, numsPerto(x, 0, 20), { visual: { k: "conta", txt: `${a} + ${b} = ${s}\n${s} − ${y} = ?` } });
  }
  // M10 até 100
  function qDe10em10() {
    const ini = randint(0, 5) * 10, seq = [ini, ini + 10, ini + 20, ini + 30, ini + 40];
    const i = randint(1, 4), r = seq[i]; seq[i] = null;
    return opNum("num100:dez", "Contando de 10 em 10. Que número falta?", r, numsPerto(r, 0, 100, [1, -1, 10, -10, 5]), { visual: { k: "fila", seq } });
  }
  function qDezUni() {
    const d = randint(1, 9), u = randint(0, 9), n = d * 10 + u;
    return opNum("num100:du", "Cada barra vale 10 e cada cubinho vale 1. Quanto tem ao todo?", n, [u * 10 + d, d + u, n + 10, n - 1].filter((x) => x >= 0 && x <= 100), { visual: { k: "blocos", c: 0, d, u } });
  }
  function qLer100() {
    const n = randint(21, 99);
    if (n % 10 === 0 || Math.floor(n / 10) === n % 10) return qLer100();
    const d = Math.floor(n / 10), u = n % 10;
    if (Math.random() < 0.6) return opNum("num100:ler", `Como se escreve ${extenso(n)} com números?`, n, [u * 10 + d, d * 100 + u, n + 10], { texto: extenso(n), textoClasse: "frase" });
    return mc("num100:ler", `Como se lê o número ${n}?`, [extenso(u * 10 + d), extenso(n + 10), extenso(n - 1)], extenso(n), { texto: String(n), textoClasse: "numero", estilo: "txt" });
  }
  function qQuadro100() {
    const n = randint(12, 88);
    if (n % 10 === 0 || n % 10 === 1) return qQuadro100(); // a janela 3x3 não pode quebrar a linha do quadro
    const falta = choice([n - 10, n + 10, n - 1, n + 1]);
    return opNum("num100:quadro", "Que número está faltando no quadro dos números?", falta, numsPerto(falta, 1, 99, [1, -1, 10, -10, 2]), { visual: { k: "quadro100", n, falta } });
  }
  function qAntesDepois(max = 100) {
    const n = randint(11, max - 1), depois = Math.random() < 0.5;
    const r = depois ? n + 1 : n - 1;
    return opNum("num100:vizinhos", depois ? `Que número vem depois do ${n}?` : `Que número vem antes do ${n}?`, r, numsPerto(r, 0, max, [2, -2, 10, -10]),
      { visual: { k: "fila", seq: depois ? [n - 1, n, null] : [null, n, n + 1] } });
  }
  function qMaior100(max = 100) {
    const a = randint(10, max - 1);
    const inv = Number(String(a).split("").reverse().join(""));
    const pool = uniq([a, inv, randint(10, max - 1), randint(10, max - 1)]).slice(0, 3);
    while (pool.length < 3) { const x = randint(10, max - 1); if (!pool.includes(x)) pool.push(x); }
    const maior = Math.random() < 0.5;
    return opNum("num100:comparar", maior ? "Qual é o maior número?" : "Qual é o menor número?", maior ? Math.max(...pool) : Math.min(...pool), pool);
  }
  function qPulos() {
    const p = choice([2, 5]), ini = p === 2 ? randint(0, 10) * 2 : randint(0, 8) * 5;
    const seq = range(0, 5).map((i) => ini + i * p), i = randint(2, 4), r = seq[i]; seq[i] = null;
    return opNum("num100:pulos", `Contando de ${p} em ${p}. Que número falta?`, r, numsPerto(r, 0, 100, [1, -1, p + 1, 10]), { visual: { k: "fila", seq } });
  }
  // M11 dinheiro
  function qMoedas() {
    const itens = sample([5, 10, 10, 25, 25, 50, 50, 100, 100, 5], randint(2, 4)).sort((a, b) => b - a);
    const t = itens.reduce((s, x) => s + x, 0);
    return mc("dinheiro:moedas", "Quanto dinheiro tem aqui?", [t + 5, t - 5, t + 10, t + 25].filter((x) => x > 0).map(fmtReais), fmtReais(t),
      { visual: { k: "dinheiro", itens }, estilo: "txt", falarResposta: falaReais(t) });
  }
  function qNotas() {
    const itens = sample([200, 500, 500, 1000, 1000, 2000, 5000, 200], randint(2, 3)).sort((a, b) => b - a);
    const t = itens.reduce((s, x) => s + x, 0);
    return mc("dinheiro:notas", "Quanto dinheiro tem aqui?", [t + 200, t - 200, t + 500, t + 1000].filter((x) => x > 0).map(fmtReais), fmtReais(t),
      { visual: { k: "dinheiro", itens }, estilo: "txt", falarResposta: falaReais(t) });
  }
  const PRODUTOS = [["🍦", "o sorvete"], ["🧃", "o suco"], ["🍫", "o chocolate"], ["🧸", "o ursinho"], ["📒", "o caderno"], ["⚽", "a bola"], ["🍿", "a pipoca"], ["🎈", "o balão"]];
  function qJuntarDinheiro() {
    const [a, b] = sample(PRODUTOS, 2), pa = randint(2, 9), pb = randint(1, 9);
    const t = (pa + pb) * 100;
    return mc("dinheiro:somar", `${cap(a[1])} custa ${pa} reais e ${b[1]} custa ${pb} reais. Quanto custam os dois juntos?`, [t + 100, t - 100, t + 200, pa * 100].map(fmtReais), fmtReais(t),
      { visual: { k: "precos", itens: [[a[0], pa * 100], [b[0], pb * 100]] }, estilo: "txt", falarResposta: falaReais(t) });
  }
  function qTroco(grande = false) {
    const [p] = sample(PRODUTOS, 1);
    const pago = grande ? choice([1000, 2000, 5000]) : choice([500, 1000]);
    const preco = grande ? randint(2, pago / 100 - 1) * 100 + choice([0, 50]) : randint(1, pago / 100 - 1) * 100;
    const t = pago - preco;
    return mc("dinheiro:troco", `Você pagou com ${falaReais(pago)}. ${cap(p[1])} custa ${falaReais(preco)}. Quanto você recebe de troco?`,
      [t + 100, t - 100, preco, t + 50].filter((x) => x > 0 && x !== t).map(fmtReais), fmtReais(t),
      { visual: { k: "precos", itens: [[p[0], preco]], pago }, estilo: "txt", falarResposta: falaReais(t) });
  }
  // M12 medidas
  const CORES_NOME = [["#ef4444", "vermelho", "🟥"], ["#3b82f6", "azul", "🟦"], ["#22c55e", "verde", "🟩"], ["#f59e0b", "amarelo", "🟨"]];
  function qComprimento() {
    const cs = sample(CORES_NOME, 3), lens = sample([3, 5, 7, 9, 11], 3);
    const longo = Math.random() < 0.5;
    const idx = lens.indexOf(longo ? Math.max(...lens) : Math.min(...lens));
    const rot = (c) => `${c[2]} ${c[1]}`;
    return mc("medida:comprimento", longo ? "Qual fita é a mais comprida?" : "Qual fita é a mais curta?", cs.map(rot), rot(cs[idx]),
      { visual: { k: "fitas", fitas: cs.map((c, i) => [c[0], lens[i]]) }, estilo: "txt" });
  }
  const PESOS = [["🐘", "🐭"], ["🚗", "🚲"], ["🍉", "🍒"], ["🪨", "🪶"], ["🐋", "🐟"], ["🏠", "🧸"], ["📺", "📱"], ["🐻", "🐝"], ["🎃", "🍓"]];
  function qPeso() {
    const [pesado, leve] = choice(PESOS), q = Math.random() < 0.5;
    return mc("medida:peso", q ? "Qual é mais pesado?" : "Qual é mais leve?", [q ? leve : pesado], q ? pesado : leve, { visual: { k: "balanca_obj" }, estilo: "emoji" }, 2);
  }
  function qCheio() {
    const nivs = sample([10, 35, 60, 90], 3), q = Math.random() < 0.5;
    const idx = nivs.indexOf(q ? Math.max(...nivs) : Math.min(...nivs));
    return mc("medida:capacidade", q ? "Qual copo está mais cheio?" : "Qual copo está mais vazio?", ["A", "B", "C"], "ABC"[idx], { visual: { k: "copos", niveis: nivs }, estilo: "letra" });
  }
  function qRegua() {
    const cm = randint(2, 12);
    return opNum("medida:regua", "Quantos centímetros mede o lápis?", cm, numsPerto(cm, 1, 15), { visual: { k: "regua", cm } });
  }
  // M13 tempo
  const PERIODOS = [["Quando o sol nasce e a gente toma café da manhã?", "Manhã"], ["Quando a lua e as estrelas aparecem no céu?", "Noite"],
    ["Quando a gente vai dormir?", "Noite"], ["Qual parte do dia vem depois da manhã?", "Tarde"], ["Qual parte do dia vem depois da tarde?", "Noite"],
    ["Qual parte do dia vem depois da noite?", "Manhã"]];
  function qPeriodo() { const [p, r] = choice(PERIODOS); return mc("tempo:periodo", p, ["Manhã", "Tarde", "Noite"], r, { visual: { k: "emojis_linha", itens: ["🌅", "🌞", "🌙"] }, estilo: "txt" }); }
  const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  function qDias() {
    const t = randint(0, 3);
    if (t === 3) return opNum("tempo:semana", "Quantos dias tem uma semana?", 7, [5, 6, 10, 12]);
    const i = randint(0, 6);
    const r = t === 0 ? DIAS[(i + 1) % 7] : t === 1 ? DIAS[(i + 6) % 7] : DIAS[(i + 2) % 7];
    const pergunta = t === 0 ? `Que dia vem depois de ${DIAS[i]}?` : t === 1 ? `Que dia vem antes de ${DIAS[i]}?` : `Hoje é ${DIAS[i]}. Que dia será depois de amanhã?`;
    return mc("tempo:semana", pergunta, DIAS.filter((d) => d !== r), r, { visual: { k: "lista_dias", destaque: i }, estilo: "txt" });
  }
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  function qMeses() {
    const t = randint(0, 4);
    if (t === 0) return opNum("tempo:meses", "Quantos meses tem um ano?", 12, [7, 10, 30]);
    if (t === 1) return mc("tempo:meses", "Qual é o primeiro mês do ano?", ["dezembro", "março", "fevereiro"], "janeiro", { estilo: "txt" });
    if (t === 2) return mc("tempo:meses", "Em que mês é o Natal?", ["janeiro", "junho", "outubro"], "dezembro", { emoji: "🎄", estilo: "txt" });
    const i = randint(0, 10);
    return mc("tempo:meses", `Que mês vem depois de ${MESES[i]}?`, MESES.filter((m, j) => j !== i + 1), MESES[i + 1], { estilo: "txt" });
  }
  const hora = (h, m) => `${h}:${String(m).padStart(2, "0")}`;
  function qRelogio(tipo) {
    const h = randint(1, 12);
    const m = tipo === "exata" ? 0 : tipo === "meia" ? 30 : randint(1, 11) * 5;
    const certa = hora(h, m);
    const hm = (x) => ((x + 11) % 12) + 1;
    const distr = tipo === "exata" ? [hora(hm(h + 1), 0), hora(hm(h - 1), 0), hora(12, h * 5 % 60)]
      : tipo === "meia" ? [hora(hm(h + 1), 30), hora(h, 0), hora(6, h * 5 % 60)]
      : [hora(h, m / 5), hora(hm(h + 1), m), hora(m / 5 || 12, h * 5 % 60), hora(h, (m + 5) % 60)];
    const falaH = (x, y) => (y === 0 ? `${x} ${x === 1 ? "hora" : "horas"}` : y === 30 ? `${x} e meia` : `${x} e ${y}`);
    return mc(`tempo:relogio`, "Que horas o relógio está marcando?", distr.filter((x) => x !== certa), certa,
      { visual: { k: "relogio", h, m }, estilo: "txt", falarResposta: falaH(h, m), dica: "O ponteiro pequeno mostra a hora. O grande mostra os minutos." });
  }
  // M14 geometria
  const FIGS = [["triangulo", "triângulo", 3], ["quadrado", "quadrado", 4], ["retangulo", "retângulo", 4], ["pentagono", "pentágono", 5], ["hexagono", "hexágono", 6]];
  function qLados() {
    const [f, nome, n] = choice(FIGS), cantos = Math.random() < 0.4;
    return opNum("geo:lados", cantos ? `Quantos cantos (vértices) tem o ${nome}?` : `Quantos lados tem o ${nome}?`, n, [3, 4, 5, 6, 8].filter((x) => x !== n), { visual: { k: "forma", f }, texto: nome.toUpperCase(), textoClasse: "palavra" });
  }
  const SOLIDOS = [["esfera", ["⚽", "🌍", "🏀"]], ["cubo", ["🎲", "🧊", "📦"]], ["cilindro", ["🥫", "🔋"]], ["cone", ["🍦"]]];
  function qSolido() {
    const [nome, exs] = choice(SOLIDOS);
    const outros = SOLIDOS.filter((s) => s[0] !== nome).map((s) => choice(s[1]));
    return mc("geo:solidos", `Qual tem a forma de ${nome === "esfera" ? "uma esfera" : "um " + nome}?`, outros, choice(exs), { estilo: "emoji", visual: { k: "solido", s: nome } });
  }
  const BICHOS = ["🐶", "🐱", "🐰", "🐸", "🐵", "🐼", "🦊", "🐨"];
  const NOME_BICHO = { "🐶": "cachorro", "🐱": "gato", "🐰": "coelho", "🐸": "sapo", "🐵": "macaco", "🐼": "panda", "🦊": "raposa", "🐨": "coala" };
  const doBicho = (e) => (NOME_BICHO[e] === "raposa" ? "da raposa" : `do ${NOME_BICHO[e]}`);
  function qPosicao() {
    const fila = sample(BICHOS, 4), i = randint(1, 2), dir = Math.random() < 0.5;
    const r = dir ? fila[i + 1] : fila[i - 1];
    return mc("geo:posicao", `Olhando para a tela: quem está à ${dir ? "direita" : "esquerda"} ${doBicho(fila[i])}?`, fila.filter((x) => x !== r && x !== fila[i]), r,
      { visual: { k: "linha", itens: fila, setas: true, destaque: i }, estilo: "emoji", falarResposta: NOME_BICHO[r] });
  }
  function qSimetria() {
    const sim = choice("AHIMOTUVWXY".split("")), nao = sample("FGJLNPRSZ".split(""), 2);
    return mc("geo:simetria", "Qual letra tem simetria? Se dobrar ao meio, de cima para baixo, os dois lados ficam iguais.", nao, sim,
      { estilo: "letra", visual: { k: "simetria" } });
  }
  // M15 contas até 100
  function qSomaDezenas() { const a = randint(1, 8) * 10, b = randint(1, (100 - a) / 10) * 10; return opNum("conta100:dezenas", `Quanto é ${a} mais ${b}?`, a + b, numsPerto(a + b, 0, 100, [10, -10, 1, 20]), { visual: { k: "conta", txt: `${a} + ${b} = ?` } }); }
  function qSoma100(comVaiUm) {
    for (;;) {
      const a = randint(11, 78), b = randint(11, 89 - a + 10);
      const vai = (a % 10) + (b % 10) >= 10;
      if (vai !== comVaiUm || a + b > 99) continue;
      const r = a + b;
      const distr = comVaiUm ? [r - 10, Number(`${Math.floor(a / 10) + Math.floor(b / 10)}${(a % 10) + (b % 10)}`), r + 1] : [r + 10, r - 1, r + 1];
      return opNum(comVaiUm ? "conta100:somar_vai" : "conta100:somar", `Quanto é ${a} mais ${b}?`, r, distr, { visual: { k: "armada", a, b, op: "+" } });
    }
  }
  function qTiraDezenas() { const a = randint(3, 9) * 10, b = randint(1, a / 10 - 1) * 10; return opNum("conta100:tirar_dez", `Quanto é ${a} menos ${b}?`, a - b, numsPerto(a - b, 0, 100, [10, -10, 1]), { visual: { k: "conta", txt: `${a} − ${b} = ?` } }); }
  function qTira100(comEmp) {
    for (;;) {
      const a = randint(31, 99), b = randint(11, a - 10);
      const emp = (a % 10) < (b % 10);
      if (emp !== comEmp) continue;
      const r = a - b;
      const distr = comEmp ? [(Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs((a % 10) - (b % 10)), r + 10, r - 1] : [r + 10, r - 1, r + 1];
      return opNum(comEmp ? "conta100:tirar_emp" : "conta100:tirar", `Quanto é ${a} menos ${b}?`, r, distr, { visual: { k: "armada", a, b, op: "−" } });
    }
  }
  const PROB100 = [
    () => { const a = randint(15, 45), b = randint(12, 40); return [`Numa escola tem ${a} meninos e ${b} meninas. Quantas crianças ao todo?`, a + b]; },
    () => { const a = randint(40, 90), b = randint(10, a - 10); return [`Um livro tem ${a} páginas. Já li ${b}. Quantas páginas faltam?`, a - b]; },
    () => { const a = randint(20, 60), b = randint(10, 35); return [`A Bia tinha ${a} figurinhas e ganhou mais ${b}. Com quantas ficou?`, a + b]; },
    () => { const a = randint(30, 80), b = randint(10, a - 5); return [`Tinha ${a} balas no pote. As crianças comeram ${b}. Quantas sobraram?`, a - b]; },
    () => { const a = randint(30, 70), b = randint(10, 25); return [`O Teo tem ${a} carrinhos. O Rafa tem ${b}. Quantos carrinhos o Teo tem a mais?`, a - b]; },
  ];
  function qProb100() { const [t, r] = choice(PROB100)(); return opNum("conta100:problemas", t, r, numsPerto(r, 0, 200, [10, -10, 1, -1]), { texto: t, textoClasse: "historia" }); }
  // M16 multiplicação
  function qGrupos() {
    const gq = randint(2, 5), n = randint(2, 5), e = choice(OBJETOS)[0];
    return opNum("mult:grupos", `São ${gq} grupos com ${n} em cada um. Quantos ao todo?`, gq * n, [gq + n, gq * n + n, gq * n - n, gq * n + 1], { visual: { k: "grupos", e, grupos: Array(gq).fill(n) } });
  }
  function qSomaRepetida() {
    const gq = randint(2, 5), n = randint(2, 9);
    const soma = Array(gq).fill(n).join(" + ");
    return mc("mult:repetida", `${soma}: é o mesmo que qual conta?`, [`${gq} + ${n}`, `${n} × ${n}`, `${gq + 1} × ${n}`], `${gq} × ${n}`,
      { visual: { k: "conta", txt: `${soma} = ?` }, estilo: "txt", falarResposta: `${gq} vezes ${n}` });
  }
  function qTabuada(k) {
    const m = randint(1, 10);
    const [a, b] = Math.random() < 0.7 ? [k, m] : [m, k];
    const r = k * m;
    return opNum(`tabuada:${k}`, `Quanto é ${a} vezes ${b}?`, r, [k * (m + 1), k * (m - 1), (k + 1) * m, r + 1, r + 10].filter((x) => x > 0 && x !== r),
      { visual: { k: "conta", txt: `${a} × ${b} = ?`, matriz: k * m <= 30 ? [a, b] : null } });
  }
  const PROBMULT = [[6, "Cada caixa tem 6 ovos. Quantos ovos tem em {n} caixas?", "🥚"], [4, "Um carro tem 4 rodas. Quantas rodas tem {n} carros?", "🚗"],
    [8, "Uma aranha tem 8 patas. Quantas patas tem {n} aranhas?", "🕷️"], [5, "Cada mão tem 5 dedos. Quantos dedos tem {n} mãos?", "✋"],
    [3, "Cada triciclo tem 3 rodas. Quantas rodas tem {n} triciclos?", "🛺"], [10, "Cada pacote tem 10 figurinhas. Quantas figurinhas tem em {n} pacotes?", "📦"]];
  function qProbMult() { const [k, t, e] = choice(PROBMULT), n = randint(2, 6), txt = t.replace("{n}", n); return opNum("mult:problemas", txt, k * n, [k + n, k * (n + 1), k * (n - 1)], { texto: txt, textoClasse: "historia", emoji: e }); }
  // M17 divisão
  function qRepartir() {
    const gq = randint(2, 5), n = randint(2, 6), t = gq * n, e = choice(OBJETOS)[0];
    return opNum("div:repartir", `Vamos repartir ${t} igualmente entre ${gq} crianças. Quantos cada uma ganha?`, n, [n + 1, n - 1, t - gq, gq].filter((x) => x > 0 && x !== n), { visual: { k: "emojis", e, n: t } });
  }
  function qQuantosGrupos() {
    const n = randint(2, 5), gq = randint(2, 6), t = gq * n;
    return opNum("div:grupos", `Tenho ${t} balas e quero fazer saquinhos com ${n} balas cada um. Quantos saquinhos consigo fazer?`, gq, [gq + 1, gq - 1, t - n, n].filter((x) => x > 0 && x !== gq), { visual: { k: "emojis", e: "🍬", n: t } });
  }
  function qMetade() { const n = randint(1, 25) * 2; return opNum("div:metade", `Qual é a metade de ${n}?`, n / 2, [n * 2, n / 2 + 1, n / 2 - 1, n - 2].filter((x) => x > 0), { visual: { k: "conta", txt: `metade de ${n} = ?` } }); }
  function qDividir() {
    const d = randint(2, 10), q = randint(1, 10), t = d * q;
    return opNum("div:tabuada", `Quanto é ${t} dividido por ${d}?`, q, [q + 1, q - 1, d, t - d].filter((x) => x > 0 && x !== q), { visual: { k: "conta", txt: `${t} ÷ ${d} = ?` } });
  }
  const PROBDIV = [["{t} figurinhas para {d} amigos, todos com a mesma quantidade. Quantas para cada um?", "🃏"], ["{t} lápis em {d} estojos iguais. Quantos lápis em cada estojo?", "✏️"],
    ["{t} biscoitos em {d} pratos iguais. Quantos biscoitos em cada prato?", "🍪"], ["{t} alunos em {d} grupos do mesmo tamanho. Quantos alunos em cada grupo?", "🧒"]];
  function qProbDiv() { const [t, e] = choice(PROBDIV), d = randint(2, 6), q = randint(2, 8), txt = t.replace("{t}", d * q).replace("{d}", d); return opNum("div:problemas", txt, q, [q + 1, q - 1, d * q - d, d].filter((x) => x > 0 && x !== q), { texto: txt, textoClasse: "historia", emoji: e }); }
  // M18 até 1000
  function qCentenas() {
    const c = randint(1, 9), d = randint(0, 9), u = randint(0, 9), n = c * 100 + d * 10 + u;
    return opNum("num1000:blocos", "A placa vale 100, a barra vale 10 e o cubinho vale 1. Quanto tem ao todo?", n, [c * 100 + u * 10 + d, c + d + u, c * 100 + d + u, n + 100].filter((x) => x !== n), { visual: { k: "blocos", c, d, u } });
  }
  function qLer1000() {
    const c = randint(1, 9), d = randint(1, 9), u = randint(1, 9), n = c * 100 + d * 10 + u;
    if (d === u) return qLer1000();
    if (Math.random() < 0.6) return opNum("num1000:ler", `Como se escreve ${extenso(n)} com números?`, n, [c * 1000 + d * 10 + u, c * 100 + u * 10 + d, n + 10], { texto: extenso(n), textoClasse: "frase" });
    return mc("num1000:ler", `Como se lê o número ${n}?`, [extenso(c * 100 + u * 10 + d), extenso(n + 100), extenso(n - 10)], extenso(n), { texto: String(n), textoClasse: "numero", estilo: "txt" });
  }
  function qSomaCentenas() {
    const a = randint(1, 6) * 100 + randint(0, 4) * 10, b = randint(1, 3) * 100 + randint(0, 4) * 10;
    return opNum("num1000:somar", `Quanto é ${a} mais ${b}?`, a + b, [a + b + 100, a + b - 100, a + b + 10], { visual: { k: "armada", a, b, op: "+" } });
  }
  // M19 frações
  const DEN = { 2: ["meio", "meios"], 3: ["terço", "terços"], 4: ["quarto", "quartos"], 5: ["quinto", "quintos"], 6: ["sexto", "sextos"], 8: ["oitavo", "oitavos"] };
  const falaFracao = (p, n) => `${ext(p, "m")} ${p === 1 ? DEN[n][0] : DEN[n][1]}`;
  function qFracao(dens = [2, 3, 4], umaParte = true) {
    const n = choice(dens), p = umaParte ? 1 : randint(1, n - 1);
    const forma = choice(n === 4 || n === 2 ? ["pizza", "barra", "quadrado"] : ["pizza", "barra"]);
    const distr = uniq([`${n - p}/${n}`, `${p}/${n + 1}`, `${n}/${p}`, ...dens.filter((x) => x !== n).map((x) => `${p}/${x}`)]).filter((x) => x !== `${p}/${n}` && !/\/1$/.test(x) && x !== "0/" + n);
    return mc("fracao:figura", "Que parte da figura está pintada?", distr, `${p}/${n}`,
      { visual: { k: "fracao", forma, partes: n, pintadas: p }, estilo: "txt", falarResposta: falaFracao(p, n), dica: "Embaixo: em quantas partes iguais foi dividido. Em cima: quantas estão pintadas." });
  }
  function qFracaoQtd() {
    const n = choice([2, 3, 4]), q = randint(2, 5), t = n * q;
    const nomeF = { 2: "a metade", 3: "um terço", 4: "um quarto" }[n];
    return opNum("fracao:quantidade", `Quanto é ${nomeF} de ${t}?`, q, [q + 1, t / 2, t - q, q * 2].filter((x) => x > 0 && x !== q && Number.isInteger(x)),
      { visual: { k: "grupos", e: choice(OBJETOS)[0], grupos: Array(n).fill(q) }, texto: `1/${n} de ${t}`, textoClasse: "numero" });
  }
  // M20 gráficos e chances
  const FRUTAS = ["🍎", "🍌", "🍇", "🍓", "🍊"];
  const NOME_FRUTA = { "🍎": "a maçã", "🍌": "a banana", "🍇": "a uva", "🍓": "o morango", "🍊": "a laranja" };
  function dadosVotos() { const fs = sample(FRUTAS, 4); const vs = sample(range(1, 11), 4); return fs.map((f, i) => [f, vs[i]]); }
  function qDados(tipoVis) {
    const d = dadosVotos(), t = randint(0, 3);
    const vis = { k: tipoVis, dados: d, titulo: "Fruta preferida da turma" };
    if (t === 0) { const m = d.reduce((a, b) => (b[1] > a[1] ? b : a)); return mc(`dados:${tipoVis}`, "Qual fruta teve mais votos?", d.map((x) => x[0]), m[0], { visual: vis, estilo: "emoji", falarResposta: NOME_FRUTA[m[0]] }, 4); }
    if (t === 1) { const m = d.reduce((a, b) => (b[1] < a[1] ? b : a)); return mc(`dados:${tipoVis}`, "Qual fruta teve menos votos?", d.map((x) => x[0]), m[0], { visual: vis, estilo: "emoji", falarResposta: NOME_FRUTA[m[0]] }, 4); }
    if (t === 2) { const x = choice(d); return opNum(`dados:${tipoVis}`, `Quantos votos teve ${NOME_FRUTA[x[0]]}?`, x[1], numsPerto(x[1], 0, 12, [1, -1, 2]), { visual: vis }); }
    const [a, b] = sample(d, 2), [mx, mn] = a[1] > b[1] ? [a, b] : [b, a];
    return opNum(`dados:${tipoVis}`, `Quantos votos ${NOME_FRUTA[mx[0]]} teve a mais que ${NOME_FRUTA[mn[0]]}?`, mx[1] - mn[1], [mx[1] + mn[1], mx[1], mx[1] - mn[1] + 1].filter((x) => x !== mx[1] - mn[1]), { visual: vis });
  }
  const NOME_COR = { "🔴": "vermelha", "🔵": "azul", "🟢": "verde", "🟡": "amarela" };
  function qChance() {
    const [c1, c2, c3] = sample(["🔴", "🔵", "🟢", "🟡"], 3);
    const n1 = randint(4, 7), n2 = randint(1, 3);
    const bolas = { [c1]: n1, [c2]: n2 };
    const t = randint(0, 2);
    if (t === 0) return mc("chance:provavel", "Tirando uma bola sem olhar, qual cor é mais provável sair?", [c2], c1, { visual: { k: "saco", bolas }, estilo: "emoji", falarResposta: NOME_COR[c1] }, 2);
    if (t === 1) return mc("chance:provavel", "Tirando uma bola sem olhar, qual cor é menos provável sair?", [c1], c2, { visual: { k: "saco", bolas }, estilo: "emoji", falarResposta: NOME_COR[c2] }, 2);
    return mc("chance:possivel", `Tirando uma bola sem olhar, é possível sair uma bola ${NOME_COR[c3]}?`, ["Sim, é possível", "Com certeza vai sair"], "Não, é impossível", { visual: { k: "saco", bolas }, estilo: "txt" }, 3);
  }
  // M22 desafios
  function qDuasEtapas() {
    const a = randint(10, 30), b = randint(3, 12), c = randint(2, a + b - 2);
    const nome = choice(["A Luna", "O Teo", "A Bia", "O Rafa"]);
    const txt = `${nome} tinha ${a} figurinhas. Ganhou ${b} e depois deu ${c} para um amigo. Com quantas figurinhas ficou?`;
    const r = a + b - c;
    return opNum("desafio:etapas", txt, r, [a + b, a - c, r + 1, a + b + c].filter((x) => x >= 0), { texto: txt, textoClasse: "historia" });
  }
  function qRegra() {
    const p = randint(2, 6), ini = randint(1, 10), seq = range(0, 4).map((i) => ini + i * p);
    if (Math.random() < 0.5) return mc("desafio:regra", "Qual é a regra desta sequência?", [`+${p + 1}`, `+${p - 1 || 7}`, `×${p}`], `+${p}`, { visual: { k: "fila", seq }, estilo: "txt", falarResposta: `mais ${p}` });
    const prox = ini + 4 * p;
    return opNum("desafio:regra", "Descubra a regra. Qual é o próximo número?", prox, [prox + 1, prox - p, prox + p], { visual: { k: "fila", seq: [...seq, null] } });
  }
  function qBalanca() {
    const a = randint(2, 9), b = randint(2, 9), c = randint(1, a + b - 1), x = a + b - c;
    return opNum("desafio:balanca", `A balança está equilibrada. ${c} mais quanto é igual a ${a} mais ${b}?`, x, [a + b, x + 1, x - 1, a].filter((y) => y >= 0 && y !== x), { visual: { k: "balanca", esq: `${c} + ?`, dir: `${a} + ${b}` } });
  }
  function qEstimar() {
    const alvo = choice([10, 20, 40]), n = alvo + randint(-2, 2);
    return opNum("desafio:estimar", "Sem contar um por um: mais ou menos quantas balas tem aqui?", alvo, [10, 20, 40].filter((x) => x !== alvo), { visual: { k: "emojis", e: "🍬", n, apertado: true } }, 3);
  }
  const CABECA = [["99 + 1", 100], ["50 + 50", 100], ["25 + 25", 50], ["100 − 1", 99], ["10 × 10", 100], ["45 + 5", 50], ["30 + 30", 60], ["200 + 300", 500], ["1000 − 1", 999], ["19 + 1", 20], ["60 − 30", 30], ["5 × 20", 100], ["75 + 25", 100], ["90 − 45", 45]];
  function qCabeca() { const [c, r] = choice(CABECA); return opNum("desafio:cabeca", `Faça de cabeça: quanto é ${c.replace("−", "menos").replace("+", "mais").replace("×", "vezes")}?`, r, numsPerto(r, 0, 1000, [1, -1, 10, -10]), { visual: { k: "conta", txt: `${c} = ?` } }); }

  const M = (id, title, icon, gen) => ({ id, title, icon, gen });
  const misturar = (...fs) => () => shuffle(fs.map((f) => f()));
  const matematica = [
    { id: "M8", title: "Números até 20", lessons: [
      M("M8-1", "Contar até 20", "20", g("c20", () => vezes(7, qContar20))),
      M("M8-2", "Comparar até 20", "⚖️", g("cmp20", () => vezes(8, qComparar20))),
      M("M8-3", "Par ou ímpar", "👯", g("par", () => vezes(8, qParImpar))),
      M("M8-4", "Dobro", "✌️", g("dob", () => vezes(8, () => qDobro(10)))),
    ] },
    { id: "M9", title: "Contas até 20", lessons: [
      M("M9-1", "Amigos do 10", "🤝", g("am10", () => vezes(8, qAmigos10))),
      M("M9-2", "Dobros e quase dobros", "➕", g("dobs", () => vezes(8, qDobros))),
      M("M9-3", "Somar até 20", "➕", g("s20", () => vezes(8, qSomar20))),
      M("M9-4", "Tirar até 20", "➖", g("t20", () => vezes(8, qTirar20))),
      M("M9-5", "Família de contas", "👨‍👩‍👧", g("fam", () => vezes(8, qFamilia))),
      M("M9-6", "Histórias até 20", "📖", g("h20", () => vezes(7, () => U.qHistoria(20)))),
    ] },
    { id: "M10", title: "Números até 100", lessons: [
      M("M10-1", "De 10 em 10", "🔟", g("d10", () => vezes(8, qDe10em10))),
      M("M10-2", "Dezenas e unidades", "🧱", g("du", () => vezes(8, qDezUni))),
      M("M10-3", "Ler números até 100", "💯", g("l100", () => vezes(8, qLer100))),
      M("M10-4", "Quadro do 100", "🔢", g("q100", () => vezes(8, qQuadro100))),
      M("M10-5", "Antes e depois", "↔️", g("ad100", () => vezes(8, () => qAntesDepois(100)))),
      M("M10-6", "Maior e menor até 100", "⚖️", g("m100", () => vezes(8, () => qMaior100(100)))),
      M("M10-7", "De 2 em 2, de 5 em 5", "🦘", g("pul", () => vezes(8, qPulos))),
    ] },
    { id: "M11", title: "Dinheiro", lessons: [
      M("M11-1", "Moedas", "🪙", g("moe", () => vezes(7, qMoedas))),
      M("M11-2", "Notas", "💵", g("not", () => vezes(7, qNotas))),
      M("M11-3", "Juntar dinheiro", "🛒", g("jd", () => vezes(7, qJuntarDinheiro))),
      M("M11-4", "Troco", "🧾", g("tro", () => vezes(7, () => qTroco(false)))),
    ] },
    { id: "M12", title: "Medidas", lessons: [
      M("M12-1", "Comprido e curto", "📏", g("comp", () => vezes(7, qComprimento))),
      M("M12-2", "Pesado e leve", "🐘", g("peso", () => vezes(7, qPeso))),
      M("M12-3", "Cheio e vazio", "🥛", g("cheio", () => vezes(7, qCheio))),
      M("M12-4", "Régua", "📐", g("reg", () => vezes(7, qRegua))),
    ] },
    { id: "M13", title: "Tempo", lessons: [
      M("M13-1", "Partes do dia", "🌅", g("per", () => vezes(7, qPeriodo))),
      M("M13-2", "Dias da semana", "📅", g("dia", () => vezes(8, qDias))),
      M("M13-3", "Meses do ano", "🗓️", g("mes", () => vezes(8, qMeses))),
      M("M13-4", "Hora exata", "🕒", g("hx", () => vezes(7, () => qRelogio("exata")))),
      M("M13-5", "Meia hora", "🕞", g("hm", () => vezes(7, () => qRelogio("meia")))),
    ] },
    { id: "M14", title: "Formas e posição", lessons: [
      M("M14-1", "Lados e cantos", "🔷", g("lad", () => vezes(7, qLados))),
      M("M14-2", "Sólidos", "🎲", g("sol", () => vezes(7, qSolido))),
      M("M14-3", "Direita e esquerda", "👉", g("pos", () => vezes(7, qPosicao))),
      M("M14-4", "Simetria", "🦋", g("sim", () => vezes(7, qSimetria))),
    ] },
    { id: "M15", title: "Contas até 100", lessons: [
      M("M15-1", "Somar dezenas", "➕", g("sd", () => vezes(8, qSomaDezenas))),
      M("M15-2", "Somar sem reserva", "➕", g("s100", () => vezes(7, () => qSoma100(false)))),
      M("M15-3", "Somar com vai-um", "☝️", g("sv", () => vezes(7, () => qSoma100(true)))),
      M("M15-4", "Tirar dezenas", "➖", g("td", () => vezes(8, qTiraDezenas))),
      M("M15-5", "Tirar sem empréstimo", "➖", g("t100", () => vezes(7, () => qTira100(false)))),
      M("M15-6", "Tirar com empréstimo", "🔁", g("te", () => vezes(7, () => qTira100(true)))),
      M("M15-7", "Problemas até 100", "📖", g("p100", () => vezes(7, qProb100))),
    ] },
    { id: "M16", title: "Multiplicação", lessons: [
      M("M16-1", "Grupos iguais", "🧺", g("gru", () => vezes(7, qGrupos))),
      M("M16-2", "Soma repetida", "🔁", g("rep", () => vezes(7, qSomaRepetida))),
      ...[2, 3, 4, 5, 10].map((k) => M(`M16-t${k}`, `Tabuada do ${k}`, `×${k}`, g(`tab${k}`, () => vezes(8, () => qTabuada(k))))),
      M("M16-8", "Problemas de multiplicar", "📖", g("pm", () => vezes(7, qProbMult))),
    ] },
    { id: "M17", title: "Divisão", lessons: [
      M("M17-1", "Repartir igual", "🍬", g("rpt", () => vezes(7, qRepartir))),
      M("M17-2", "Quantos grupos?", "🛍️", g("qg", () => vezes(7, qQuantosGrupos))),
      M("M17-3", "Metade e dobro", "✂️", g("md", () => shuffle([...vezes(4, qMetade), ...vezes(4, () => qDobro(50))]))),
      M("M17-4", "Dividir com a tabuada", "➗", g("dv", () => vezes(8, qDividir))),
      M("M17-5", "Problemas de dividir", "📖", g("pd", () => vezes(7, qProbDiv))),
    ] },
    { id: "M18", title: "Até 1000", lessons: [
      M("M18-1", "Centenas", "🟧", g("cen", () => vezes(7, qCentenas))),
      M("M18-2", "Ler até 1000", "🔢", g("l1000", () => vezes(8, qLer1000))),
      M("M18-3", "Comparar até 1000", "⚖️", g("c1000", () => vezes(8, () => qMaior100(1000)))),
      M("M18-4", "Somar centenas", "➕", g("sc", () => vezes(7, qSomaCentenas))),
    ] },
    { id: "M19", title: "Frações", lessons: [
      M("M19-1", "Metade", "🍕", g("f2", () => vezes(7, () => qFracao([2, 4], true)))),
      M("M19-2", "Terço e quarto", "🥧", g("f34", () => vezes(7, () => qFracao([3, 4], true)))),
      M("M19-3", "Fração da figura", "🟪", g("ffig", () => vezes(8, () => qFracao([3, 4, 5, 6, 8], false)))),
      M("M19-4", "Fração de quantidade", "🍪", g("fq", () => vezes(7, qFracaoQtd))),
    ] },
    { id: "M20", title: "Gráficos e chances", lessons: [
      M("M20-1", "Ler tabela", "📋", g("tab", () => vezes(7, () => qDados("tabela")))),
      M("M20-2", "Gráfico de barras", "📊", g("gra", () => vezes(7, () => qDados("grafico")))),
      M("M20-3", "Mais provável", "🎲", g("cha", () => vezes(7, qChance))),
    ] },
    { id: "M21", title: "Tabuada do 6 ao 9", lessons: [
      ...[6, 7, 8, 9].map((k) => M(`M21-t${k}`, `Tabuada do ${k}`, `×${k}`, g(`tab${k}`, () => vezes(8, () => qTabuada(k))))),
      M("M21-5", "Todas as tabuadas", "✖️", g("taball", () => vezes(10, () => qTabuada(randint(2, 9))))),
    ] },
    { id: "M22", title: "Desafios", lessons: [
      M("M22-1", "Problemas de duas etapas", "🧩", g("de", () => vezes(7, qDuasEtapas))),
      M("M22-2", "Regra da sequência", "🔍", g("rg", () => vezes(7, qRegra))),
      M("M22-3", "Balança equilibrada", "⚖️", g("bal", () => vezes(7, qBalanca))),
      M("M22-4", "Estimar", "🤔", g("est", () => vezes(6, qEstimar))),
      M("M22-5", "Contas de cabeça", "🧠", g("cab", () => vezes(8, qCabeca))),
      M("M22-6", "Troco 2", "💰", g("tr2", () => vezes(7, () => qTroco(true)))),
      M("M22-7", "Relógio de 5 em 5", "⏰", g("r5", () => vezes(7, () => qRelogio("cinco")))),
      M("M22-8", "Grande desafio final", "👑", g("dFinalM", misturar(qDuasEtapas, qRegra, qBalanca, () => qSoma100(true), () => qTira100(true), () => qTabuada(randint(2, 9)), qDividir, () => qFracao([2, 3, 4], false), () => qRelogio("cinco"), () => qTroco(true)))),
    ] },
  ];

  Curriculo.registrar({ leitura, matematica }, G);
  if (typeof module !== "undefined") module.exports = { extenso, fmtReais, falaReais, G };
})();
