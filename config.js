/* Configuração do Super Faísca.
   Enquanto supabaseUrl estiver vazio, o app funciona SEM login (do jeito de antes).
   Para ligar o login, siga o passo a passo do arquivo LOGIN-E-PAINEL.md. */
window.SUPER_FAISCA_CONFIG = {
  // Supabase > Project Settings > API (ou Data API): "Project URL" e a chave "anon public"
  supabaseUrl: "https://efisjfchjzofasyajnst.supabase.co",
  supabaseAnonKey: "sb_publishable_4e24GuAgTJKLP01AFyEE0Q_ra37pTk_",

  // Texto da tela que aparece quando o teste grátis acaba (pode mudar à vontade)
  preco: "R$ 9,90 por ano",
  pixChave: "39304898803",          // ex.: "seu-email@exemplo.com" ou CPF/CNPJ/telefone
  whatsapp: "5511948797739",         // só números com DDI e DDD, ex.: "5511999998888"
  mensagemPagamento: "Para continuar usando, faça o pagamento pelo Pix e mande o comprovante pelo WhatsApp com o e-mail da sua conta. Liberamos em até 24 horas.",

  // Na versão da Play Store, o Google não permite indicar pagamento fora da loja dentro do app.
  // Nesse caso, mude para false: a tela mostra só que o acesso terminou, sem Pix nem WhatsApp.
  mostrarPagamentoNoApp: true,

  // Quantos dias o app pode ficar sem internet antes de pedir uma nova verificação da conta
  diasSemInternet: 7,
};
