/* Motor do Super Faísca: progresso, pontos, medalhas, revisão e relatório.
   Guarda tudo no próprio aparelho (localStorage). Nada é enviado para a internet. */
"use strict";

const Motor = (() => {
  const CHAVE = "superfaisca:progresso:v1";

  /* Trilha de evolução: a cada 10 missões diferentes concluídas o personagem ganha algo.
     tipo "roupa"  = nova roupa (imagem em personagens/<img>.webp); "em_breve" = arte ainda não feita
     tipo "poder"  = efeito que aparece numa hora certa (acerto, dica, sequência, fim da missão)
     tipo "efeito" = enfeite que fica sempre em volta do personagem
     cor = cor de destaque do app com aquela roupa (botões, barras e desenhos das lições) */
  const TRILHAS = {
    faisca: [
      { licoes: 0, tipo: "roupa", id: "basico", nome: "Explorador da Faísca", img: "faisca-basico", cor: "#2563eb", icone: "👕" },
      { licoes: 10, tipo: "poder", id: "pulo", nome: "Pulo Relâmpago", icone: "⚡", desc: "Pula com faíscas no fim da missão" },
      { licoes: 20, tipo: "efeito", id: "aura", nome: "Aura Elétrica", icone: "💙", desc: "Um brilho azul em volta do herói" },
      { licoes: 30, tipo: "roupa", id: "esportivo", nome: "Craque Turbo", img: "faisca-esportivo", cor: "#0284c7", icone: "⚽" },
      { licoes: 40, tipo: "poder", id: "rastro", nome: "Rastro Turbo", icone: "💨", desc: "Raios de luz a cada acerto" },
      { licoes: 50, tipo: "efeito", id: "orbita", nome: "Faíscas em Órbita", icone: "✨", desc: "Faíscas girando em volta do herói" },
      { licoes: 60, tipo: "roupa", id: "heroi", nome: "Super Faísca", img: "faisca-heroi", cor: "#dc2626", icone: "🦸" },
      { licoes: 70, tipo: "poder", id: "escudo", nome: "Escudo de Ideias", icone: "🛡️", desc: "Um escudo de luz depois de 3 acertos seguidos" },
      { licoes: 80, tipo: "efeito", id: "dourado", nome: "Brilho Dourado", icone: "🌟", desc: "Estrelas douradas em volta do herói" },
      { licoes: 90, tipo: "em_breve", id: "tempestade", nome: "Capitão Tempestade", icone: "🌩️" },
      { licoes: 120, tipo: "em_breve", id: "cosmico", nome: "Lenda Cósmica", icone: "🌌" },
    ],
    fada: [
      { licoes: 0, tipo: "roupa", id: "basica", nome: "Aprendiz das Estrelas", img: "fada-basica", cor: "#db2777", icone: "👗" },
      { licoes: 10, tipo: "poder", id: "pistas", nome: "Pó de Pistas", icone: "✨", desc: "Brilhinhos mágicos quando aparece uma dica" },
      { licoes: 20, tipo: "efeito", id: "asas", nome: "Asas de Luz", icone: "🧚", desc: "A fada ganha asas brilhantes" },
      { licoes: 30, tipo: "roupa", id: "princesa", nome: "Princesa Lumi", img: "fada-princesa", cor: "#9333ea", icone: "👑" },
      { licoes: 40, tipo: "poder", id: "petalas", nome: "Chuva de Pétalas", icone: "🌸", desc: "Pétalas caem a cada acerto" },
      { licoes: 50, tipo: "efeito", id: "coracoes", nome: "Corações em Órbita", icone: "💖", desc: "Corações girando em volta da fada" },
      { licoes: 60, tipo: "roupa", id: "astronauta", nome: "Astronauta Lumi", img: "fada-astronauta", cor: "#7c3aed", icone: "🚀" },
      { licoes: 70, tipo: "poder", id: "bolha", nome: "Bolha de Imaginação", icone: "🫧", desc: "Uma bolha mágica depois de 3 acertos seguidos" },
      { licoes: 80, tipo: "efeito", id: "aurora", nome: "Brilho Aurora", icone: "🌈", desc: "Um brilho de arco-íris em volta da fada" },
      { licoes: 90, tipo: "em_breve", id: "aurora_roupa", nome: "Fada Aurora", icone: "🌈" },
      { licoes: 120, tipo: "em_breve", id: "cosmica", nome: "Guardiã Cósmica", icone: "🌌" },
    ],
  };
  const trilhaDe = (p) => TRILHAS[p === "fada" ? "fada" : "faisca"];
  /** Missões diferentes já concluídas (repetir a mesma missão não conta de novo). */
  const licoesFeitas = (est) => Object.values(est.licoes).filter((i) => (i.vezes || 0) > 0).length;
  const nivelDe = (feitas) => Math.floor(feitas / 10) + 1;
  /** Tudo que o personagem tem, para as telas. */
  function evolucao(est, p) {
    const feitas = licoesFeitas(est);
    const trilha = trilhaDe(p).map((t) => ({ ...t, tem: t.tipo !== "em_breve" && feitas >= t.licoes }));
    const roupas = trilha.filter((t) => t.tipo === "roupa" || t.tipo === "em_breve");
    const escolhida = est.config[p === "fada" ? "roupa_fada" : "roupa"];
    const roupa = roupas.find((r) => r.id === escolhida && r.tem) || roupas[0];
    const proximo = trilha.find((t) => t.tipo !== "em_breve" && feitas < t.licoes) || null;
    return {
      licoes_feitas: feitas, nivel: nivelDe(feitas), trilha, roupas, roupa,
      poderes: trilha.filter((t) => t.tem && (t.tipo === "poder" || t.tipo === "efeito")).map((t) => t.id),
      proximo: proximo && { ...proximo, faltam: proximo.licoes - feitas },
    };
  }
  const MEDALHAS = [
    ["primeira", "Primeira missão", "🚀"], ["vogais", "Mestre das vogais", "🅰️"], ["palavras", "Primeiras palavras", "📖"],
    ["leitor", "Pequeno leitor", "📚"], ["contador", "Contador até 5", "🖐️"], ["dez", "Amigo do dez", "🔟"],
    ["somador", "Juntar e tirar", "➕"], ["vinte", "Até 20!", "🏅"], ["perfeito", "Lição perfeita", "🌟"],
    ["seq3", "3 dias seguidos", "🔥"], ["seq7", "7 dias seguidos", "🌈"], ["xp500", "500 pontos", "💎"],
    ["digrafos", "Mestre do CH, LH e NH", "🧩"], ["textos", "Leitor de histórias", "📜"], ["superleitor", "Super leitor", "🏆"],
    ["cem", "Até 100!", "💯"], ["tabuada", "Tabuada na ponta da língua", "✖️"], ["genio", "Gênio da matemática", "🧠"], ["xp2000", "2000 pontos", "🚀"],
  ];
  const MEDALHA_POR_UNIDADE = { L1: "vogais", L2: "palavras", L6: "leitor", M1: "contador", M2: "dez", M5: "somador", M7: "vinte",
    L9: "digrafos", L19: "textos", L20: "superleitor", M10: "cem", M21: "tabuada", M22: "genio" };

  /* ---------- datas (sempre no fuso do aparelho) ---------- */
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hoje = () => iso(new Date());
  const diasAtras = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
  const diasEntre = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);

  /* ---------- armazenamento ---------- */
  function estadoInicial() {
    return {
      config: { nome_crianca: "", personagem: null, nome_heroi: "Faísca", nome_fada: "Lumi", roupa: "basico", roupa_fada: "basica",
        minutos_dia: 15, meta_licoes: 2, voz_velocidade: 0.9, voz_nome: "", voz_v2: true, som: true, liberar_tudo: false, senha_pais: "" },
      xp: 0, licoes: {}, habilidades: {}, medalhas: [], dias: {}, sequencia: 0, ultimo_dia: null, criado: hoje(),
    };
  }
  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return estadoInicial();
      const dados = JSON.parse(bruto);
      const base = { ...estadoInicial(), ...dados };
      base.config = { ...estadoInicial().config, ...(dados.config || {}) };
      // A voz gravada (Francisca) chegou na v9. Quem salvou a área dos pais antes disso ficou com a voz
      // do aparelho gravada sem ter escolhido: volta uma vez para o padrão (Francisca).
      if (!(dados.config || {}).voz_v2) { base.config.voz_nome = ""; base.config.voz_v2 = true; }
      return base;
    } catch (e) {
      return estadoInicial();
    }
  }
  function salvar(est) {
    try { localStorage.setItem(CHAVE, JSON.stringify(est)); } catch (e) { console.error("Não foi possível salvar o progresso", e); }
  }
  const diaDe = (est, d = hoje()) => (est.dias[d] = est.dias[d] || { licoes: 0, segundos: 0, xp: 0 });

  /* ---------- telas ---------- */
  function trilhasComStatus(est) {
    const trilhas = Curriculo.construirTrilhas();
    for (const unidades of Object.values(trilhas)) {
      let anteriorOk = true;
      for (const u of unidades) {
        for (const l of u.lessons) {
          const info = est.licoes[l.id] || {};
          l.stars = info.estrelas || 0;
          l.done = (info.vezes || 0) > 0;
          l.unlocked = anteriorOk || l.done || !!est.config.liberar_tudo;
          anteriorOk = l.done;
          delete l.gen;
        }
        u.done = u.lessons.every((l) => l.done);
      }
    }
    return trilhas;
  }

  function resumo(est) {
    let sequencia = est.sequencia;
    if (est.ultimo_dia && est.ultimo_dia < diasAtras(1)) sequencia = 0; // perdeu a sequência
    const { senha_pais, ...config } = est.config;
    const p = config.personagem || "faisca";
    return {
      config, tem_senha: !!senha_pais, xp: est.xp, sequencia,
      hoje: { ...(est.dias[hoje()] || { licoes: 0, segundos: 0, xp: 0 }) },
      personagem: p, ...evolucao(est, p),
      // as duas trilhas, para desenhar o menino e a menina na tela de escolha
      inicio_trilhas: { faisca: evolucao(est, "faisca"), fada: evolucao(est, "fada") },
      medalhas: MEDALHAS.map(([id, nome, icone]) => ({ id, nome, icone, tem: est.medalhas.includes(id) })),
      trilhas: trilhasComStatus(est),
      revisao_disponivel: licoesParaRevisar(est).length > 0,
    };
  }

  /** Revisão espaçada simples: lições já feitas, priorizando as com mais erros
      e as praticadas há mais tempo (3 estrelas: 7 dias; 2: 3 dias; 1: 1 dia). */
  function licoesParaRevisar(est) {
    const mapa = Curriculo.mapaLicoes();
    const fila = [];
    for (const [lid, info] of Object.entries(est.licoes)) {
      if (!mapa[lid] || !info.vezes) continue;
      const erro = 1 - (info.acerto ?? 1);
      const dias = diasEntre(info.ultima || hoje(), hoje());
      const intervalo = { 3: 7, 2: 3, 1: 1 }[info.estrelas] || 1;
      const prioridade = erro * 3 + Math.max(0, dias - intervalo) * 0.5;
      if (dias >= intervalo || erro > 0.25) fila.push([prioridade, lid]);
    }
    return fila.sort((a, b) => b[0] - a[0]).map(([, lid]) => lid);
  }

  function iniciarLicao(est, lid) {
    const mapa = Curriculo.mapaLicoes();
    if (lid === "revisao") {
      let ids = licoesParaRevisar(est).slice(0, 3);
      if (!ids.length) ids = Object.keys(est.licoes).slice(0, 3);
      let qs = [];
      for (const i of ids) {
        if (!mapa[i]) continue;
        const sub = Curriculo.gerarLicao(mapa[i].licao.gen).filter((q) => q.type !== "intro_letter");
        qs.push(...Curriculo.sample(sub, 4));
      }
      return { id: "revisao", title: "Revisão do herói", trilha: "revisao", questions: Curriculo.shuffle(qs).slice(0, 10) };
    }
    if (!mapa[lid]) throw new Error("Lição não encontrada: " + lid);
    const { trilha, unidade, licao } = mapa[lid];
    return { id: lid, title: licao.title, unidade: unidade.title, trilha, questions: Curriculo.gerarLicao(licao.gen) };
  }

  function concluirLicao(est, { id: lid, resultados = [] }) {
    const avaliadas = resultados.filter((r) => r.avaliada !== false);
    const total = Math.max(1, avaliadas.length);
    const certas = avaliadas.filter((r) => (r.tentativas ?? 1) === 1).length;
    const acerto = certas / total;
    const erros = total - certas;
    const estrelas = erros <= 1 ? 3 : acerto >= 0.6 ? 2 : 1;
    let xp = 10 + certas * 2 + (estrelas === 3 ? 5 : 0);
    const novas = [];
    const feitasAntes = licoesFeitas(est);

    if (lid !== "revisao") {
      const info = (est.licoes[lid] = est.licoes[lid] || { vezes: 0, estrelas: 0 });
      const primeiraVez = info.vezes === 0;
      info.vezes += 1;
      info.estrelas = Math.max(info.estrelas, estrelas);
      info.acerto = Math.round(acerto * 100) / 100;
      info.ultima = hoje();
      if (!primeiraVez) xp = Math.max(5, Math.floor(xp / 2));
    } else {
      xp += 5;
    }

    for (const r of resultados) {
      if (!r.skill) continue;
      const h = (est.habilidades[r.skill] = est.habilidades[r.skill] || { tentativas: 0, acertos: 0 });
      h.tentativas += 1;
      h.acertos += (r.tentativas ?? 1) === 1 ? 1 : 0;
      h.ultima = hoje();
    }

    est.xp += xp;
    const d = diaDe(est);
    d.licoes += 1; // o tempo de tela é somado à parte
    d.xp += xp;

    if (est.ultimo_dia !== hoje()) {
      est.sequencia = est.ultimo_dia === diasAtras(1) ? est.sequencia + 1 : 1;
      est.ultimo_dia = hoje();
    }

    const medalha = (m) => { if (!est.medalhas.includes(m)) { est.medalhas.push(m); novas.push(m); } };
    medalha("primeira");
    if (estrelas === 3) medalha("perfeito");
    if (est.sequencia >= 3) medalha("seq3");
    if (est.sequencia >= 7) medalha("seq7");
    if (est.xp >= 500) medalha("xp500");
    if (est.xp >= 2000) medalha("xp2000");
    for (const unidades of Object.values(Curriculo.construirTrilhas())) {
      for (const u of unidades) {
        if (MEDALHA_POR_UNIDADE[u.id] && u.lessons.every((l) => (est.licoes[l.id]?.vezes || 0) > 0)) medalha(MEDALHA_POR_UNIDADE[u.id]);
      }
    }

    const nomes = Object.fromEntries(MEDALHAS.map(([m, n, i]) => [m, [n, i]]));
    return {
      estrelas, xp, acerto: Math.round(acerto * 100) / 100,
      medalhas: novas.map((m) => ({ id: m, nome: nomes[m][0], icone: nomes[m][1] })),
      // o que o personagem ganhou nesta missão (roupa, poder ou efeito)
      ganhos: trilhaDe(est.config.personagem).filter((t) => t.tipo !== "em_breve" && feitasAntes < t.licoes && t.licoes <= licoesFeitas(est)),
      subiu_nivel: nivelDe(licoesFeitas(est)) > nivelDe(feitasAntes),
    };
  }

  const ROTULOS = {
    letra: "Letras (som e nome)", silaba: "Sílabas", escrita: "Traçado", palavra: "Escrever palavras", leitura: "Ler palavras",
    frase: "Ler frases", contar: "Contagem", ver: "Ver sem contar", numeral: "Número e quantidade", comparar: "Comparar",
    sequencia: "Sequência numérica", dez: "Quadro de dez", somar: "Juntar (adição)", tirar: "Tirar (subtração)",
    compor: "Partes de um número", historia: "Problemas em histórias", padrao: "Padrões", forma: "Formas", dezena: "Dezenas (até 20)",
    grafia: "Novas letras e sons", minuscula: "Letras minúsculas", orto: "Ortografia", fono: "Rimas e sílabas", texto: "Entender textos",
    gram: "Palavras e sentidos", num20: "Números até 20", conta: "Contas até 20", num100: "Números até 100", dinheiro: "Dinheiro",
    medida: "Medidas", tempo: "Tempo e relógio", geo: "Geometria", conta100: "Contas até 100", mult: "Multiplicação", tabuada: "Tabuada",
    div: "Divisão", num1000: "Números até 1000", fracao: "Frações", dados: "Tabelas e gráficos", chance: "Chances", desafio: "Desafios",
  };

  function relatorio(est) {
    const grupos = {};
    for (const [sk, h] of Object.entries(est.habilidades)) {
      const g = sk.split(":")[0];
      const gg = (grupos[g] = grupos[g] || { grupo: ROTULOS[g] || g, tentativas: 0, acertos: 0, dificeis: [] });
      gg.tentativas += h.tentativas;
      gg.acertos += h.acertos;
      if (h.tentativas >= 2 && h.acertos / h.tentativas < 0.6) gg.dificeis.push(sk.includes(":") ? sk.split(":").slice(1).join(":") : sk);
    }
    const lista = Object.values(grupos).sort((a, b) => a.acertos / Math.max(1, a.tentativas) - b.acertos / Math.max(1, b.tentativas));
    const semana = [6, 5, 4, 3, 2, 1, 0].map((i) => { const d = diasAtras(i); return { dia: d, ...(est.dias[d] || { licoes: 0, segundos: 0, xp: 0 }) }; });
    return {
      habilidades: lista, semana,
      total_licoes: Object.values(est.licoes).reduce((s, v) => s + (v.vezes || 0), 0),
      xp: est.xp, sequencia: est.sequencia,
    };
  }

  /* ---------- "API" local: mesmas rotas que a versão com servidor ---------- */
  const CONFIG_PERMITIDA = ["nome_crianca", "personagem", "nome_heroi", "nome_fada", "roupa", "roupa_fada", "minutos_dia", "meta_licoes",
    "voz_velocidade", "voz_nome", "som", "liberar_tudo", "senha_pais"];

  async function api(caminho, dados) {
    const est = carregar();
    switch (caminho) {
      case "/api/estado": return resumo(est);
      case "/api/relatorio": return relatorio(est);
      case "/api/licao/iniciar": return iniciarLicao(est, dados.id);
      case "/api/licao/concluir": { const r = concluirLicao(est, dados); salvar(est); return { resultado: r, estado: resumo(est) }; }
      case "/api/tempo": { const d = diaDe(est); d.segundos += Math.max(0, Math.min(120, Math.floor(dados.segundos || 0))); salvar(est); return { hoje: d }; }
      case "/api/pais/entrar": { const s = est.config.senha_pais || ""; return { ok: !s || dados.senha === s }; }
      case "/api/config": { for (const k of CONFIG_PERMITIDA) if (k in dados) est.config[k] = dados[k]; salvar(est); return resumo(est); }
      case "/api/pais/liberar": { diaDe(est).segundos = 0; salvar(est); return resumo(est); }
      case "/api/pais/zerar": {
        if (dados.confirmar !== "ZERAR") return resumo(est);
        const novo = estadoInicial(); novo.config = est.config; salvar(novo); return resumo(novo);
      }
      default: throw new Error("Rota desconhecida: " + caminho);
    }
  }

  /* ---------- backup (para trocar de aparelho ou reinstalar) ---------- */
  function exportar() {
    return JSON.stringify({ app: "super-faisca", versao: 1, exportado: new Date().toISOString(), progresso: carregar() }, null, 1);
  }
  function importar(texto) {
    const dados = JSON.parse(texto);
    const prog = dados.progresso || dados;
    if (typeof prog !== "object" || !("xp" in prog) || !("licoes" in prog)) throw new Error("Arquivo de backup inválido.");
    salvar({ ...estadoInicial(), ...prog, config: { ...estadoInicial().config, ...(prog.config || {}) } });
  }

  return { api, exportar, importar, _interno: { carregar, salvar, estadoInicial, concluirLicao, iniciarLicao, resumo, relatorio } };
})();

if (typeof module !== "undefined") module.exports = Motor;
