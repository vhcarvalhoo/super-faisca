/* Configuração do Super Faísca.
   Enquanto supabaseUrl estiver vazio, o app funciona SEM login (do jeito de antes).
   Para ligar o login, siga o passo a passo do arquivo LOGIN-E-PAINEL.md. */
window.SUPER_FAISCA_CONFIG = {
  // Supabase > Project Settings > API (ou Data API): "Project URL" e a chave "anon public"
  supabaseUrl: "https://efisjfchjzofasyajnst.supabase.co",
  supabaseAnonKey: "sb_publishable_4e24GuAgTJKLP01AFyEE0Q_ra37pTk_",
  // Botão "Entrar com o Google". Só mude para true depois de configurar o Google e o Supabase (guia LOGIN-GOOGLE.md)
  loginGoogle: true,

  // Texto da tela que aparece quando o teste grátis acaba (pode mudar à vontade)
  preco: "R$ 29,90 por ano",
  // Pix "copia e cola" (gerado no app do banco). Se estiver preenchido, aparece no lugar da chave.
  // Atenção: o valor do Pix fica gravado dentro do código; ele precisa bater com o preço acima.
  pixCopiaECola: "00020126330014br.gov.bcb.pix011139304898803520400005303986540529.905802BR5925VICTOR HUGO DE OLIVEIRA C6009SAO PAULO62580520SAN2026112321053442350300017br.gov.bcb.brcode01051.0.063043FC0",
  pixChave: "39304898803",          // usada só se pixCopiaECola estiver vazio. Ex.: e-mail, CPF/CNPJ ou telefone
  whatsapp: "5511948797739",         // só números com DDI e DDD, ex.: "5511999998888"
  mensagemPagamento: "Para continuar usando, faça o pagamento pelo Pix e mande o comprovante pelo WhatsApp com o e-mail da sua conta. Liberamos em até 24 horas.",

  // Na versão da Play Store, o Google não permite indicar pagamento fora da loja dentro do app.
  // Nesse caso, mude para false: a tela mostra só que o acesso terminou, sem Pix nem WhatsApp.
  mostrarPagamentoNoApp: true,

  // Quantos dias o app pode ficar sem internet antes de pedir uma nova verificação da conta
  diasSemInternet: 7,
};
