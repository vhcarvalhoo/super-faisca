/* Login do responsável e controle de acesso (7 dias grátis + liberação manual).
   Conversa direto com o Supabase pela API REST (sem bibliotecas externas).
   Quem decide se o acesso está ativo é o SERVIDOR, com o relógio dele: mudar a data
   do tablet não adianta. A conta é do adulto; o progresso da criança fica no aparelho. */
"use strict";

const Conta = (() => {
  const CFG = window.SUPER_FAISCA_CONFIG || {};
  const ativo = () => !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const K_SESSAO = "superfaisca:sessao:v1", K_ACESSO = "superfaisca:acesso:v1";
  const ler = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const gravar = (k, v) => { try { v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k); } catch (e) { /* sem espaço */ } };
  let sessao = ler(K_SESSAO), acesso = ler(K_ACESSO);
  let modo = "entrar";

  /* ---------------------------------------------------------- servidor */
  async function req(caminho, { method = "GET", body, token } = {}) {
    const r = await fetch(CFG.supabaseUrl.replace(/\/$/, "") + caminho, {
      method,
      headers: { apikey: CFG.supabaseAnonKey, "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await r.text();
    let dados = null;
    try { dados = txt ? JSON.parse(txt) : null; } catch (e) { dados = txt; }
    if (!r.ok) {
      const e = new Error(traduzir(dados?.msg || dados?.error_description || dados?.message || dados?.error || `Erro ${r.status}`));
      e.status = r.status;
      throw e;
    }
    return dados;
  }
  function traduzir(m) {
    const t = String(m);
    if (/invalid login|invalid_grant|invalid credentials/i.test(t)) return "E-mail ou senha incorretos.";
    if (/email not confirmed/i.test(t)) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).";
    if (/already registered|already been registered|user already exists/i.test(t)) return "Este e-mail já tem conta. Use \"Já tenho conta: entrar\".";
    if (/password should be at least|weak password/i.test(t)) return "A senha precisa ter pelo menos 6 caracteres.";
    if (/rate limit|too many/i.test(t)) return "Muitas tentativas. Espere alguns minutos e tente de novo.";
    if (/valid email|invalid email|unable to validate email/i.test(t)) return "Esse e-mail não parece válido.";
    return t;
  }
  function guardarSessao(d) {
    sessao = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Math.floor(Date.now() / 1000) + Number(d.expires_in || 3600) - 60,
      email: d.user?.email || sessao?.email || "" };
    gravar(K_SESSAO, sessao);
  }
  async function token() {
    if (!sessao) throw Object.assign(new Error("sem sessão"), { status: 401 });
    if (Date.now() / 1000 < sessao.expires_at) return sessao.access_token;
    const d = await req("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: sessao.refresh_token } });
    guardarSessao(d);
    return sessao.access_token;
  }
  async function verificar() {
    const d = await req("/rest/v1/rpc/meu_acesso", { method: "POST", token: await token(), body: {} });
    if (!d) throw Object.assign(new Error("Conta não encontrada."), { status: 401 });
    acesso = { ...d, verificado_em: Date.now() };
    gravar(K_ACESSO, acesso);
    return d.ativo ? "ok" : "bloqueado";
  }
  function offlineValido() {
    if (!acesso || !acesso.ativo) return false;
    const dias = (Date.now() - acesso.verificado_em) / 86400000;
    return dias <= (CFG.diasSemInternet ?? 7) && new Date(acesso.acesso_ate).getTime() > Date.now();
  }

  /** Lê o retorno dos links de e-mail (confirmação de conta e nova senha). */
  function lerRetornoDoEmail() {
    const h = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (!h.get("access_token")) return null;
    guardarSessao({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_in: h.get("expires_in") });
    history.replaceState(null, "", location.pathname + location.search);
    return h.get("type");
  }

  /** Chamado ao abrir o app: "livre" (sem login configurado), "login", "ok" ou "bloqueado". */
  async function iniciar() {
    if (!ativo()) return "livre";
    const tipo = lerRetornoDoEmail();
    if (tipo === "recovery") { modo = "novasenha"; return "login"; }
    if (!sessao) return "login";
    try {
      return await verificar();
    } catch (e) {
      if ([400, 401, 403].includes(e.status)) { sair(false); return "login"; }
      if (offlineValido()) return "ok";       // sem internet, mas verificado há pouco tempo
      acesso = { ...(acesso || {}), status: "offline" };
      return "bloqueado";
    }
  }

  /** Revalida de tempos em tempos enquanto o app está aberto. */
  async function checarEmSegundoPlano() {
    if (!ativo() || !sessao) return;
    if (acesso && Date.now() - acesso.verificado_em < 6 * 3600000) return;
    try { if ((await verificar()) === "bloqueado") mostrarBloqueio(); } catch (e) { /* sem internet: tenta depois */ }
  }

  function sair(irParaLogin = true) {
    const t = sessao?.access_token;
    if (t) req("/auth/v1/logout", { method: "POST", token: t }).catch(() => {});
    sessao = null; acesso = null;
    gravar(K_SESSAO, null); gravar(K_ACESSO, null);
    if (irParaLogin) mostrarLogin();
  }

  /* ---------------------------------------------------------- telas */
  const $ = (s) => document.querySelector(s);
  const dataBR = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");
  const diasRestantes = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

  function trocarModo(m) {
    modo = m;
    const titulos = { entrar: "Entrar", criar: "Criar conta", esqueci: "Recuperar senha", novasenha: "Nova senha" };
    const botoes = { entrar: "Entrar", criar: "Criar conta e começar", esqueci: "Enviar link por e-mail", novasenha: "Salvar nova senha" };
    $("#login-titulo").textContent = titulos[m];
    $("#btn-login").textContent = botoes[m];
    $("#login-sub").textContent = m === "criar" ? "7 dias grátis. Depois, você decide se continua." : m === "esqueci" ? "Vamos mandar um link para você criar uma senha nova." : "Área do responsável pela criança";
    $("#lbl-nome").classList.toggle("escondido", m !== "criar");
    $("#lbl-aceite").classList.toggle("escondido", m !== "criar");
    $("#lbl-senha").classList.toggle("escondido", m === "esqueci");
    $("#login-email").closest("label").classList.toggle("escondido", m === "novasenha");
    $("#lnk-criar").classList.toggle("escondido", m === "criar" || m === "novasenha");
    $("#lnk-esqueci").classList.toggle("escondido", m !== "entrar");
    $("#lnk-entrar").classList.toggle("escondido", m === "entrar");
    $("#login-senha").autocomplete = m === "entrar" ? "current-password" : "new-password";
    msg("");
  }
  const msg = (t, ok = false) => { const e = $("#login-msg"); e.textContent = t; e.classList.toggle("ok", ok); };

  function mostrarLogin() {
    document.querySelectorAll(".tela").forEach((t) => t.classList.remove("ativa"));
    $("#tela-login").classList.add("ativa");
    if (typeof desenharHerois === "function") desenharHerois();
    trocarModo(modo === "novasenha" ? "novasenha" : "entrar");
  }

  async function enviar() {
    const email = $("#login-email").value.trim().toLowerCase(), senha = $("#login-senha").value, nome = $("#login-nome").value.trim();
    const btn = $("#btn-login");
    if (modo !== "novasenha" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return msg("Digite um e-mail válido.");
    if (modo !== "esqueci" && senha.length < 6) return msg("A senha precisa ter pelo menos 6 caracteres.");
    if (modo === "criar" && !nome) return msg("Digite o seu nome.");
    if (modo === "criar" && !$("#login-aceite").checked) return msg("Marque a caixa de confirmação para continuar.");
    btn.disabled = true; msg("Aguarde...", true);
    try {
      if (modo === "entrar") {
        guardarSessao(await req("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password: senha } }));
        return depoisDeEntrar(await verificar());
      }
      if (modo === "criar") {
        const d = await req("/auth/v1/signup", { method: "POST", body: { email, password: senha, data: { nome } } });
        if (d && d.access_token) { guardarSessao(d); return depoisDeEntrar(await verificar()); }
        trocarModo("entrar");
        $("#login-email").value = email;
        return msg("Conta criada! Enviamos um e-mail de confirmação. Clique no link do e-mail e depois entre aqui.", true);
      }
      if (modo === "esqueci") {
        await req("/auth/v1/recover", { method: "POST", body: { email } });
        return msg("Se esse e-mail tiver conta, você vai receber um link para criar uma senha nova.", true);
      }
      if (modo === "novasenha") {
        await req("/auth/v1/user", { method: "PUT", token: await token(), body: { password: senha } });
        modo = "entrar";
        return depoisDeEntrar(await verificar());
      }
    } catch (e) {
      msg(e.message || "Não foi possível conectar. Confira a internet.");
    } finally {
      btn.disabled = false;
    }
  }

  function depoisDeEntrar(r) {
    $("#login-senha").value = "";
    if (r === "bloqueado") return mostrarBloqueio();
    document.querySelectorAll(".tela").forEach((t) => t.classList.remove("ativa"));
    $("#tela-inicio").classList.add("ativa");
    textoInicio();
  }

  function mostrarBloqueio() {
    document.querySelectorAll(".tela").forEach((t) => t.classList.remove("ativa"));
    $("#tela-bloqueado").classList.add("ativa");
    if (typeof desenharHerois === "function") desenharHerois();
    const st = acesso?.status;
    const titulo = { expirado: "Seu período grátis terminou", liberado: "Seu acesso terminou", bloqueado: "Acesso suspenso", offline: "Precisamos verificar sua conta" }[st] || "Seu acesso terminou";
    let texto = {
      expirado: "Esperamos que vocês tenham gostado dos 7 dias de teste! Para continuar, é só liberar o acesso.",
      bloqueado: "O acesso desta conta está suspenso. Fale com a gente para resolver.",
      offline: "O app está sem internet há muitos dias. Conecte o aparelho à internet e toque em \"verificar de novo\".",
    }[st] || `Seu acesso terminou${acesso?.liberado_ate ? " em " + dataBR(acesso.liberado_ate) : ""}. Para continuar, é só renovar.`;
    $("#bloq-titulo").textContent = titulo;
    $("#bloq-texto").textContent = texto;
    $("#bloq-email").textContent = sessao?.email || acesso?.email || "";
    const pg = $("#bloq-pagamento");
    pg.innerHTML = "";
    if (st !== "offline" && CFG.mostrarPagamentoNoApp !== false) {
      const linhas = [];
      if (CFG.preco) linhas.push(`<p class="preco">${esc(CFG.preco)}</p>`);
      if (CFG.mensagemPagamento) linhas.push(`<p>${esc(CFG.mensagemPagamento)}</p>`);
      // Pix: o código "copia e cola" tem preferência; se não houver, mostra a chave
      const pix = CFG.pixCopiaECola || CFG.pixChave;
      if (CFG.pixCopiaECola) {
        linhas.push(`<p>Pague com o <b>Pix copia e cola</b>: toque no botão, abra o app do seu banco e cole o código.</p>`);
        linhas.push(`<button class="btn btn-azul" id="copiar-pix">Copiar código Pix</button>`);
        linhas.push(`<div class="pix-codigo">${esc(CFG.pixCopiaECola)}</div>`);
      } else if (CFG.pixChave) {
        linhas.push(`<p>Chave Pix: <b class="pix">${esc(CFG.pixChave)}</b> <button class="link" id="copiar-pix">copiar</button></p>`);
      }
      if (CFG.whatsapp) {
        const txt = encodeURIComponent(`Olá! Quero liberar o Super Faísca. Meu e-mail de cadastro é: ${sessao?.email || ""}`);
        linhas.push(`<a class="btn btn-verde" href="https://wa.me/${CFG.whatsapp.replace(/\D/g, "")}?text=${txt}" target="_blank" rel="noopener">Enviar comprovante pelo WhatsApp</a>`);
      }
      pg.innerHTML = linhas.join("");
      const cp = $("#copiar-pix");
      if (cp) cp.onclick = async () => {
        const antes = cp.textContent;
        try { await navigator.clipboard.writeText(pix); cp.textContent = "Copiado! ✓"; }
        catch {
          // sem permissão para copiar: seleciona o código para a pessoa copiar com o dedo
          const alvo = pg.querySelector(".pix-codigo, .pix");
          if (alvo) { const r = document.createRange(); r.selectNodeContents(alvo); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
          cp.textContent = "Segure o código para copiar";
        }
        setTimeout(() => { cp.textContent = antes; }, 3000);
      };
    }
    $("#bloq-msg").textContent = "";
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  async function verificarDeNovo() {
    $("#bloq-msg").textContent = "Verificando...";
    try {
      const r = await verificar();
      if (r === "ok") return depoisDeEntrar("ok");
      mostrarBloqueio();
      $("#bloq-msg").textContent = "Ainda não está liberado. Se você já pagou, aguarde a liberação.";
    } catch (e) {
      if ([400, 401, 403].includes(e.status)) return sair(true);
      $("#bloq-msg").textContent = "Sem conexão. Confira a internet e tente de novo.";
    }
  }

  function descricao() {
    if (!acesso) return "";
    if (acesso.status === "teste") { const d = diasRestantes(acesso.teste_ate); return `Teste grátis: ${d === 1 ? "falta 1 dia" : `faltam ${d} dias`} (até ${dataBR(acesso.teste_ate)}).`; }
    if (acesso.status === "liberado") return new Date(acesso.liberado_ate).getFullYear() >= 2099 ? "Acesso liberado sem prazo." : `Acesso liberado até ${dataBR(acesso.liberado_ate)}.`;
    return "";
  }
  function textoInicio() { const e = $("#inicio-conta"); if (e) e.textContent = ativo() ? descricao() : ""; }
  function preencherCartao() {
    const c = $("#cartao-conta");
    if (!c) return;
    c.classList.toggle("escondido", !ativo() || !sessao);
    if (!ativo() || !sessao) return;
    $("#pais-conta").innerHTML = `${esc(sessao.email)}<br><small>${esc(descricao())}</small>`;
  }

  function ligarTelas() {
    $("#btn-login").onclick = enviar;
    ["#login-email", "#login-senha"].forEach((s) => ($(s).onkeydown = (e) => { if (e.key === "Enter") enviar(); }));
    $("#lnk-criar").onclick = () => trocarModo("criar");
    $("#lnk-esqueci").onclick = () => trocarModo("esqueci");
    $("#lnk-entrar").onclick = () => trocarModo("entrar");
    $("#btn-verificar").onclick = verificarDeNovo;
    $("#btn-sair-bloq").onclick = () => sair(true);
    $("#btn-sair-conta").onclick = () => { if (confirm("Sair desta conta neste aparelho? O progresso da criança continua salvo aqui.")) sair(true); };
  }

  return { ativo, iniciar, mostrarLogin, mostrarBloqueio, textoInicio, preencherCartao, ligarTelas, checarEmSegundoPlano, sair, _estado: () => ({ sessao, acesso }) };
})();
