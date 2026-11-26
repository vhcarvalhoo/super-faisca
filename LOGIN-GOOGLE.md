# Entrar com o Google + celular obrigatório

O app já tem o botão **"Entrar com o Google"** e pede o **celular** no cadastro. Para funcionar, você faz 3 coisas, só uma vez:

1. Atualizar o banco no Supabase (5 minutos). É o que liga o celular.
2. Criar o acesso no Google Cloud (15 minutos).
3. Ligar o Google no Supabase (5 minutos).

No fim, avise o Claude ("configurei o Google") para ele ligar o botão no app.

Como fica para quem usa o app:
- **Criar conta com e-mail:** pede nome, **celular**, e-mail e senha.
- **Entrar com o Google:** a pessoa escolhe a conta Google e volta para o app. Na primeira vez, aparece a tela **"Falta pouco!"**, que pede o celular.
- **Contas antigas** (criadas antes do celular): na próxima vez que abrirem o app, também aparece "Falta pouco!" pedindo o celular.
- No **painel** (`admin.html`), cada conta mostra o celular. É só tocar nele para abrir uma conversa no WhatsApp.

---

## Parte 1 — Atualizar o banco no Supabase
1. Entre em **supabase.com** e abra o projeto **super-faisca**.
2. No menu da esquerda, abra o **SQL Editor** e clique em **New query**.
3. Abra o arquivo **`supabase.sql`** (está na pasta do app), copie **tudo** e cole no editor.
4. Clique em **Run**. Deve aparecer *"Success. No rows returned"*.

Pode rodar sem medo: o script não apaga contas nem liberações. Ele só acrescenta o celular e aceita o nome que vem do Google.

## Parte 2 — Criar o acesso no Google Cloud
1. Abra **https://console.cloud.google.com** e entre com a sua conta Google.
2. Crie um projeto:
   1. No alto, clique no seletor de projetos e depois em **Novo projeto**.
   2. Em nome, coloque `Super Faisca` e clique em **Criar**.
   3. Confira se esse projeto ficou selecionado no alto da tela.
3. Na busca do alto, digite **Google Auth Platform** (ou **Tela de consentimento OAuth**) e abra. Clique em **Começar**:
   - **Nome do app:** `Super Faísca`
   - **E-mail para suporte:** o seu e-mail
   - **Público:** **Externo**
   - **Dados de contato:** o seu e-mail
   - Aceite a política e clique em **Criar**.
4. No menu da esquerda, abra **Branding** (Identidade visual). Preencha:
   - **Página inicial do app:** `https://vhcarvalhoo.github.io/super-faisca/`
   - **Política de privacidade:** `https://vhcarvalhoo.github.io/super-faisca/privacidade.html`
   - **Domínios autorizados:** adicione `efisjfchjzofasyajnst.supabase.co`
   - ⚠️ **Não envie logotipo.** Com logotipo, o Google exige uma verificação que demora semanas.
   - Clique em **Salvar**.
5. Abra **Público** (Audience) e clique em **Publicar app** → **Confirmar**. O status deve mudar para **Em produção**.
   Sem isso, só e-mails de teste conseguem entrar. O app só pede nome e e-mail, por isso o Google não exige verificação.
6. Abra **Clientes** (Clients) e clique em **+ Criar cliente**:
   - **Tipo de aplicativo:** **Aplicativo da Web**
   - **Nome:** `Super Faísca web`
   - **Origens JavaScript autorizadas:** clique em **+ Adicionar URI** e coloque `https://vhcarvalhoo.github.io`
   - **URIs de redirecionamento autorizados:** clique em **+ Adicionar URI** e coloque `https://efisjfchjzofasyajnst.supabase.co/auth/v1/callback`
   - Clique em **Criar**.
7. Vai aparecer uma janela com o **ID do cliente** e a **Chave secreta do cliente**. **Deixe essa janela aberta** para a parte 3.

   🔒 A **chave secreta** é como uma senha: cole **só no Supabase**. Não coloque no projeto e não mande por mensagem (nem para o Claude).

## Parte 3 — Ligar o Google no Supabase
1. No Supabase, abra **Authentication** → **Sign In / Providers** e clique em **Google**.
2. Ligue a opção **Enable Sign in with Google** e preencha:
   - **Client IDs:** cole o **ID do cliente** do Google (termina em `.apps.googleusercontent.com`).
   - **Client Secret (for OAuth):** cole a **chave secreta do cliente**.
   - Clique em **Save**.
3. Ainda em **Authentication**, abra **URL Configuration**:
   - **Site URL:** `https://vhcarvalhoo.github.io/super-faisca/`
   - Em **Redirect URLs**, clique em **Add URL** e adicione `https://vhcarvalhoo.github.io/super-faisca/**` (com os dois asteriscos no fim). Clique em **Save**.

## Parte 4 — Ligar o botão no app
Avise o Claude: **"configurei o Google"**. Ele muda `loginGoogle: false` para `true` no `config.js` e publica.

Se preferir fazer sozinho: abra o `config.js`, troque `loginGoogle: false` por `loginGoogle: true` e suba o arquivo no GitHub.

---

## Dúvidas comuns
- **Na tela do Google aparece "efisjfchjzofasyajnst.supabase.co" em vez de "Super Faísca".** É normal no plano grátis do Supabase. Para mostrar um endereço próprio, é preciso um domínio e o plano pago.
- **Erro "redirect_uri_mismatch".** O endereço da parte 2, passo 6, está diferente. Confira se é exatamente `https://efisjfchjzofasyajnst.supabase.co/auth/v1/callback`.
- **A pessoa entra pelo Google e volta para a tela de login.** Confira o **Redirect URLs** da parte 3, passo 3 (com `/**` no fim).
- **"Acesso bloqueado: este app não foi verificado" ou "app em teste".** Volte na parte 2, passo 5, e publique o app (Em produção).
- **E se a pessoa já tinha conta com e-mail e senha?** Se o e-mail do Google for o mesmo, o Supabase junta as duas: é a mesma conta, com os mesmos dias de acesso.
