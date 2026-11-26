# 🎙️ Vozes gravadas com o Azure (voz Francisca)

Hoje o app fala com a voz do aparelho, que em alguns tablets soa robótica.
Com este guia, você grava **todas as falas do app** com a voz **Francisca** da Microsoft (Azure), que é muito mais natural.
O plano grátis do Azure dá conta: o app tem cerca de **12 mil frases (276 mil letras)**, e o plano grátis libera **500 mil letras por mês**.

Como funciona no app:
- Se a frase foi gravada, o app toca a gravação. Se não foi (por exemplo, quando fala o nome da criança), usa a voz do aparelho, como hoje.
- As gravações ficam guardadas no tablet e funcionam **sem internet** depois de tocar a primeira vez.
- Na **área dos pais → Voz** aparece a opção **⭐ Francisca (voz gravada)**. Ela já vem escolhida. Se os pais escolherem outra voz, o app usa só a voz do aparelho.

---

## Passo 1 — Criar a conta grátis no Azure (uma vez só)
1. Abra **https://azure.microsoft.com/pt-br/free/** e clique em **Comece gratuitamente**.
2. Entre com uma conta Microsoft (Outlook/Hotmail) ou crie uma.
3. O Azure pede um **cartão de crédito só para confirmar que você é uma pessoa**. O recurso que vamos criar é o **gratuito (F0)**: ele não cobra nada e para sozinho quando chega no limite do mês.

## Passo 2 — Criar o recurso de Fala
1. Abra **https://portal.azure.com**.
2. No alto, na busca, digite **Fala** (ou **Speech**) e clique em **Serviços de Fala** (*Speech services*).
3. Clique em **+ Criar** e preencha:
   - **Assinatura:** a sua (ex.: "Avaliação gratuita").
   - **Grupo de recursos:** clique em **Criar novo** e digite `super-faisca`.
   - **Região:** **East US** (Leste dos EUA).
   - **Nome:** `super-faisca-voz` (se já existir, coloque outro, como `super-faisca-voz-victor`).
   - **Tipo de preço:** **Free F0**. ⚠️ Confira bem: tem que ser **F0**, não S0.
4. Clique em **Examinar + criar** e depois em **Criar**. Espere 1 minuto e clique em **Ir para o recurso**.

## Passo 3 — Copiar a chave
1. Dentro do recurso, no menu da esquerda, clique em **Chaves e Ponto de Extremidade** (*Keys and Endpoint*).
2. Clique no botão de copiar ao lado de **CHAVE 1**.
3. Repare no campo **Local/Região**: tem que estar `eastus`.

## Passo 4 — Guardar a chave no seu computador (fora do GitHub)
A chave é como uma senha: **não coloque no projeto nem mande por mensagem**. Ela fica numa pasta só sua.

No terminal do VS Code, rode este comando. Ele cria a pasta e abre o Bloco de Notas:

```powershell
New-Item -ItemType Directory -Force "$HOME\SuperFaisca-vozes"; notepad "$HOME\SuperFaisca-vozes\chave.txt"
```

O Bloco de Notas pergunta se quer criar o arquivo: clique em **Sim**. Cole a chave (só ela, numa linha), salve com **Ctrl+S** e feche.

> Se a região do seu recurso **não** for `eastus`, crie também o arquivo `regiao.txt` na mesma pasta, com a região escrita (ex.: `brazilsouth`).

## Passo 5 — Testar com 5 frases
No terminal do VS Code, dentro da pasta do projeto:

```powershell
python ferramentas/gerar_vozes.py --teste
```

Se aparecer **"Pasta vozes/ pronta: 5 frases"**, a chave funcionou. Se aparecer **"O Azure recusou a chave"**, confira a chave e a região.

## Passo 6 — Gravar tudo
```powershell
python ferramentas/gerar_vozes.py
```

- Leva **umas 10 horas**, porque o plano grátis aceita 20 frases por minuto. Dá para deixar rodando à noite. **Não deixe o computador dormir** (Configurações → Sistema → Energia → "Suspender": Nunca, só nessa noite).
- Pode parar com **Ctrl+C** quando quiser. Na próxima vez, ele continua de onde parou e não grava nada repetido.
- Ele grava primeiro as frases mais usadas (as das primeiras missões). Mesmo que você pare no meio, o app já fica bem melhor.
- Ele nunca passa de 450 mil letras no mês. Se chegar ao limite, avisa e você continua no mês seguinte.

## Passo 7 — Publicar
No fim, ele monta a pasta **`vozes/`** no projeto (uns 70 MB, em pacotes de até 3 MB). Peça ao Claude para publicar, ou suba a pasta `vozes/` inteira no GitHub.
O tablet baixa os pacotes aos poucos, conforme as frases vão sendo usadas.

---

## Quando as lições mudarem
Se lições ou falas forem alteradas, as frases novas precisam ser gravadas:
1. Rode `python servir.py` e abra **http://localhost:8765/ferramentas/extrair_falas.html**.
2. Clique em **Extrair e salvar** (isso atualiza `ferramentas/falas.json`).
3. Rode `python ferramentas/gerar_vozes.py` de novo. Ele grava **só as frases novas**.

## Onde fica cada coisa
| O quê | Onde |
|---|---|
| Chave e região do Azure | `C:\Users\<você>\SuperFaisca-vozes\chave.txt` e `regiao.txt` (fora do projeto) |
| Gravações uma a uma e uso do mês | `C:\Users\<você>\SuperFaisca-vozes\gravacoes\` e `uso.json` |
| Lista de frases para gravar | `ferramentas/falas.json` (gerada pela página `ferramentas/extrair_falas.html`) |
| Gravador | `ferramentas/gerar_vozes.py` |
| O que o app publica | pasta `vozes/` (`indice.json` + `pacote-*.mp3`) |
| Quem toca as gravações no app | `vozes.js` |
