/* Lista de tudo o que o app fala, para gravar com o Azure.
   ATENÇÃO: falasDaQuestao() espelha o que os R.* do app.js falam, e FALAS_FIXAS espelha
   as outras chamadas de Voz.falar do app.js. Ao mudar uma fala lá, mude aqui também.
   Cada item é [texto, lento]: lento = falado devagar (sílabas), gravado à parte. */
"use strict";

const ELOGIOS_APP = ["Muito bem!", "Isso aí!", "Incrível!", "Mandou bem!", "Super!", "Que demais!", "Uau!", "Perfeito!"];

/** O que o app pode falar numa pergunta (pergunta, dicas, resposta certa e "A resposta é..."). */
function falasDaQuestao(q) {
  const f = [];
  const n = (t) => f.push([String(t), false]);
  const lento = (t) => f.push([String(t), true]);
  const resposta = (t) => { if (t == null || t === "") return; n(t); n(`A resposta é... ${t}`); };
  const low = (t) => String(t).toLowerCase();
  if (q.speech) n(q.speech);
  switch (q.type) {
    case "syllable_hear": lento(q.say); resposta(low(q.answer)); break;
    case "blend": lento(q.say); resposta(q.say); break;
    case "letter_sound": resposta(q.answer); break;
    case "initial_letter": resposta(`${low(q.word)} começa com ${q.answer}`); break;
    case "build_word":
      for (const s of q.syllables) {
        lento(low(s));
        n(q.frase ? `A frase é: ${low(q.word)}. Agora a palavra ${low(s)}.` : `Escute: ${low(q.word)}. Agora a sílaba ${low(s)}.`);
      }
      resposta(low(q.word)); break;
    case "read_word":
      for (const s of q.syllables) lento(q.minusculas ? low(s) : low(s));
      resposta(low(q.word)); break;
    case "missing_syllable": resposta(low(q.word)); break;
    case "read_sentence":
      for (const p of q.sentence.split(" ")) lento(low(p));
      resposta(low(q.sentence)); break;
    case "trace": break; // falas fixas
    case "count":
      for (let i = 1; i <= q.n; i++) n(String(i));
      resposta(String(q.answer)); break;
    case "sequence":
      for (const x of q.seq) n(x === null ? "e agora?" : String(x));
      resposta(String(q.answer)); break;
    case "teen":
      n(q.tens === 1 ? `Uma barra é dez. E mais ${q.ones} cubinhos.` : `Cada barra é dez. ${q.tens} barras.`);
      resposta(String(q.answer)); break;
    case "compare": resposta(`aqui tem ${q.answer === 0 ? q.left : q.right}`); break;
    case "subitize": case "bigger_number": case "ten_frame": case "add": case "subtract": case "hidden_part": case "story":
      resposta(String(q.answer)); break;
    case "mc":
      if (q.leitura) n(q.leitura.texto.replace(/\n/g, " "));
      resposta(q.falarResposta || (q.estilo === "num" ? String(q.answer) : low(q.answer))); break;
    default: break; // numeral_to_qty, shape, pattern, intro_letter: só a pergunta
  }
  return f;
}

/** Falas fora das perguntas, com os nomes padrão (Faísca e Lumi) e sem o nome da criança. */
function falasFixas() {
  const f = [];
  const n = (t) => f.push([t, false]);
  [
    "Quem vai jogar? Escolha o seu personagem.",
    "Oi! Eu sou o Faísca. Escolha uma missão!", "Oi! Eu sou a Lumi. Escolha uma missão!",
    "Oi! Eu sou a Fada Lumi. Vamos aprender juntas? Escolha uma missão!",
    "Oi! Eu sou o Super Faísca. Vamos aprender juntos? Escolha uma missão!",
    "Termine a missão anterior para abrir esta!", "Quase! Tente de novo.",
    "Que número bonito!", "Que letra bonita!", "Bom treino! Vamos continuar.",
    "Passe o dedo por toda a linha, devagarinho.", "Tente ficar dentro da linha pontilhada.",
    "Letras!", "Números!", "e agora?",
    "Boa tentativa!", "Muito bem!", "Missão perfeita!", "E ganhou uma medalha nova!",
    "Hora de descansar os olhos! O Faísca foi recarregar a energia. Amanhã tem mais missão!",
    "Hora de descansar os olhos! A Lumi foi recarregar a energia. Amanhã tem mais missão!",
    "Escolha a roupa do seu herói!", "Escolha a roupa da sua fada!",
    "Toque no herói para trocar.", "Toque na fada para trocar.",
    "Oi! Vamos ler juntos? B com A faz ba. Bola! Três mais dois é igual a cinco.",
    ...ELOGIOS_APP,
  ].forEach(n);
  for (let p = 5; p <= 50; p++) n(`Você ganhou ${p} pontos de energia!`);
  for (let v = 2; v <= 21; v++) n(`Você chegou ao nível ${v}!`);
  for (const t of TRILHAS_NOMES.faisca) n(t.tipo === "roupa" ? `Ganhou uma roupa nova: ${t.nome}!` : t.tipo === "poder" ? `Ganhou um poder novo: ${t.nome}!` : `O Faísca evoluiu: ${t.nome}!`);
  for (const t of TRILHAS_NOMES.fada) n(t.tipo === "roupa" ? `Ganhou uma roupa nova: ${t.nome}!` : t.tipo === "poder" ? `Ganhou um poder novo: ${t.nome}!` : `A Lumi evoluiu: ${t.nome}!`);
  return f;
}
/* Nomes da trilha de evolução (motor.js, TRILHAS). Manter igual. */
const TRILHAS_NOMES = {
  faisca: [["roupa", "Craque Turbo"], ["roupa", "Super Faísca"], ["poder", "Pulo Relâmpago"], ["poder", "Rastro Turbo"], ["poder", "Escudo de Ideias"],
    ["efeito", "Aura Elétrica"], ["efeito", "Faíscas em Órbita"], ["efeito", "Brilho Dourado"]].map(([tipo, nome]) => ({ tipo, nome })),
  fada: [["roupa", "Princesa Lumi"], ["roupa", "Astronauta Lumi"], ["poder", "Pó de Pistas"], ["poder", "Chuva de Pétalas"], ["poder", "Bolha de Imaginação"],
    ["efeito", "Asas de Luz"], ["efeito", "Corações em Órbita"], ["efeito", "Brilho Aurora"]].map(([tipo, nome]) => ({ tipo, nome })),
};
