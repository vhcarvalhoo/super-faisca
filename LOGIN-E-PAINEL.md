# Como ligar o login, os 7 dias grátis e o painel

Enquanto você não fizer estes passos, o app funciona **sem login**, do jeito de antes. Quando terminar, todo mundo que abrir o app vai precisar criar uma conta. Cada conta ganha 7 dias grátis. Depois disso, você decide no painel quem continua.

Tempo estimado: **20 minutos**. Custo: **zero** (plano gratuito do Supabase).

---

## Passo 1 — Criar o projeto no Supabase
1. Entre em **supabase.com** e clique em **Start your project**. Dá para entrar com a sua conta do GitHub.
2. Clique em **New project**.
   - **Name:** `super-faisca`
   - **Database Password:** crie uma senha forte e guarde. Você quase nunca vai usar.
   - **Region:** **South America (São Paulo)**
3. Clique em **Create new project** e espere uns 2 minutos.

## Passo 2 — Criar as tabelas e as regras
1. No menu da esquerda, abra o **SQL Editor** e clique em **New query**.
2. Abra o arquivo **`supabase.sql`** (está na pasta do app), copie **tudo** e cole no editor.
3. Clique em **Run**. Deve aparecer *"Success. No rows returned"*.

## Passo 3 — Tornar-se administrador
Ainda no SQL Editor, apague o que está escrito e rode esta linha, **com o seu e-mail**:

```sql
insert into public.admins (email) values ('seu-email@exemplo.com') on conflict do nothing;
```

## Passo 4 — Ajustar os e-mails de confirmação
No menu **Authentication**:
1. Em **URL Configuration**:
   - **Site URL:** `https://vhcarvalhoo.github.io/super-faisca/`
   - Em **Redirect URLs**, adicione esse mesmo endereço.

   Isso faz os links de "confirmar e-mail" e de "esqueci a senha" abrirem o app.
2. Em **Sign In / Providers → Email**, escolha uma das duas opções:
   - **Deixar "Confirm email" ligado:** é o mais seguro. A pessoa precisa clicar no link do e-mail antes de entrar.
   - **Desligar:** a pessoa entra na hora, sem confirmar. É mais simples para começar.

   O plano grátis do Supabase envia poucos e-mails por hora. Se o app crescer, vale configurar um serviço de e-mail próprio (em **Authentication → Emails → SMTP**).

## Passo 5 — Copiar as chaves para o app
1. Abra **Project Settings → API Keys** e **Project Settings → Data API**. Em projetos mais antigos, as duas ficam na mesma tela, chamada **API**.
2. Copie:
   - **Project URL:** algo como `https://abcdxyz.supabase.co`
   - **Publishable key**, ou a chave **anon public** em projetos mais antigos.

   **Não use a chave "secret" ou "service_role"**: essa nunca pode ir para o app.
3. Abra o arquivo **`config.js`** e preencha:

```js
supabaseUrl: "https://abcdxyz.supabase.co",
supabaseAnonKey: "cole-a-chave-publica-aqui",
preco: "R$ 19,90 por mês",
pixChave: "sua-chave-pix",
whatsapp: "5511999998888",
```

A chave pública **pode** ficar no app. A segurança está nas regras do banco (passo 2): cada pessoa só enxerga a própria conta, e ninguém consegue liberar o próprio acesso.

## Passo 6 — Publicar
1. No GitHub, no repositório `super-faisca`, clique em **Add file → Upload files**.
2. Envie **todos** os arquivos da pasta.
3. Clique em **Commit changes** e espere 1 ou 2 minutos.

## Passo 7 — Testar
1. Abra `https://vhcarvalhoo.github.io/super-faisca/`. Vai aparecer a tela de **Entrar**.
2. Toque em **Criar conta — 7 dias grátis** e crie uma conta de teste.
3. Abra `https://vhcarvalhoo.github.io/super-faisca/admin.html` e entre com o **seu** e-mail de administrador. Para isso, você também precisa ter criado uma conta no app com esse e-mail.

---

## Como usar o painel no dia a dia
| Botão | O que faz |
|---|---|
| **+30 dias / +1 ano** | Libera o acesso. Os dias são somados a partir de hoje ou do fim do acesso atual, o que for maior. |
| **Sem prazo** | Libera para sempre. Bom para família e amigos. |
| **+7 dias de teste** | Dá mais tempo de teste para quem pediu. |
| **Tirar liberação** | Volta a conta para "teste acabou". |
| **Bloquear / Desbloquear** | Suspende o acesso na hora. Na próxima vez que o app verificar, a pessoa cai na tela de bloqueio. |
| **📝 Nota** | Anotação só sua, por exemplo *"pagou Pix 10/12"*. |

Os quadros no alto da página filtram a lista. **"Teste acabou (cobrar)"** mostra quem testou e ainda não pagou.

## Como o app verifica
- Ao abrir o app, ele pergunta ao servidor se a conta está ativa. Quem conta os dias é o **relógio do servidor**, então mudar a data do tablet não adianta.
- **Sem internet**, o app continua funcionando por até 7 dias (dá para mudar em `diasSemInternet`) depois da última verificação, desde que o acesso ainda esteja dentro do prazo.
- Quando o acesso termina, aparece uma tela com o preço, a chave Pix e um botão de WhatsApp. O botão já leva o e-mail da conta na mensagem. Depois de liberar no painel, a pessoa toca em **"Já paguei — verificar de novo"**.

## Atenção: Play Store
Se um dia o app for publicado na **Play Store**, o Google **não permite** indicar Pix ou outro pagamento dentro do app. Nesse caso:
- no `config.js` da versão da loja, use `mostrarPagamentoNoApp: false`;
- ou use o sistema de cobrança da Play Store (ou o programa de cobrança alternativa disponível no Brasil).

Nessa hora, a gente ajusta junto.

## Privacidade
A conta guarda só **nome e e-mail do adulto**. O progresso da criança continua **só no aparelho**. Preencha os `[colchetes]` do arquivo `privacidade.html` com o seu nome e e-mail de contato.
