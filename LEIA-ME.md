# ⚡ Super Faísca — Letras & Números (versão instalável)

App educativo para crianças de 4 a 7 anos aprenderem a ler, escrever e contar. Esta versão **roda inteira no aparelho**: não precisa de servidor, funciona **sem internet** depois de instalada, e o progresso fica salvo no próprio tablet.

## O que tem na pasta

```
super_faisca_app/
├── index.html            telas + o herói (SVG)
├── style.css             visual
├── app.js                interação, voz, sons, traçado
├── curriculo.js          TODO o conteúdo: trilhas, lições e perguntas
├── motor.js              progresso, pontos, medalhas, revisão, relatório, backup
├── sw.js                 guarda o app no aparelho (modo offline)
├── manifest.webmanifest  nome, ícone e cores do app instalado
├── icones/               ícones do app
├── privacidade.html      política de privacidade (preencha os [colchetes])
└── servir.py             para testar no computador antes de publicar
```

## 1. Testar no computador

```powershell
cd super_faisca_app
python servir.py
```

## 2. Colocar no ar com o GitHub Pages (grátis, só pelo navegador)

1. Crie uma conta em **github.com**.
2. Clique em **+ → New repository**. Dê o nome `super-faisca`, deixe como **Public** e clique em **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Arraste **todo o conteúdo** da pasta `super_faisca_app`, incluindo a pasta `icones`, e clique em **Commit changes**.
5. Vá em **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, depois a branch **main**, a pasta **/ (root)**, e clique em **Save**.
6. Em 1 ou 2 minutos, o endereço aparece no topo dessa página, algo como `https://SEU-USUARIO.github.io/super-faisca/`.

Nenhum dado da criança vai para o GitHub. Lá ficam só os arquivos do app.

## 3. Instalar no tablet Android

1. Abra o endereço no **Chrome** do tablet, com internet.
2. No menu **⋮**, toque em **Instalar app** ou **Adicionar à tela inicial**.
3. O ícone do Super Faísca aparece junto com os outros apps. A partir daí, ele abre em tela cheia e funciona sem internet.
4. **Voz sem internet:** vá em *Configurações → Sistema (ou Acessibilidade) → Saída de texto para fala → Serviços de fala do Google → Instalar dados de voz → Português (Brasil)*.

**No iPad ou iPhone:** abra no **Safari**, toque em **Compartilhar → Adicionar à Tela de Início**.

## 4. Publicar uma versão nova

1. Altere os arquivos que quiser.
2. Em `sw.js`, aumente o número da versão: `super-faisca-v1` passa a ser `super-faisca-v2`.
3. Envie os arquivos de novo para o GitHub (*Add file → Upload files*).
4. O tablet baixa a versão nova sozinho. Ela aparece na segunda vez que o app for aberto com internet.

O progresso não se perde nas atualizações.

## 5. Backup do progresso

Na área dos pais, use **💾 Fazer backup** antes de trocar de tablet ou de limpar o navegador. Para recuperar, use **📂 Restaurar backup** no aparelho novo.

## 6. Mais tarde: Play Store

Com o app já publicado no GitHub Pages:
1. Abra **pwabuilder.com**, cole o endereço e gere o pacote **Android**. Ele cria o arquivo `.aab` e um arquivo `assetlinks.json`.
2. Envie o `assetlinks.json` para uma pasta `.well-known` no seu site, seguindo as instruções do PWABuilder.
3. Crie a conta no Google Play Console (US$ 25), faça o teste fechado (12 testadores por 14 dias) e publique.
4. Use o `privacidade.html` (com os seus dados preenchidos) como política de privacidade.

**Atenção:** no GitHub Pages, o `assetlinks.json` precisa ficar na raiz do domínio. Para isso, o repositório deve se chamar `SEU-USUARIO.github.io`, ou você usa um domínio próprio. Resolvemos isso quando chegar a hora.

## Como mexer no conteúdo

Tudo está em `curriculo.js`:
- **Palavras novas:** acrescente em `PALAVRAS`, no formato `["PALAVRA", ["SÍ", "LA", "BAS"], "emoji"]`. A palavra entra sozinha nas lições assim que todas as letras dela tiverem sido ensinadas.
- **Frases:** use `FRASES`.
- **Unidades de letras:** use `UNIDADES_LEITURA`.

Depois de mudar, aumente a versão em `sw.js` (veja o passo 4).
