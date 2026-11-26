# ⚡ Super Faísca — Letras & Números (versão 3)

App educativo para crianças de 4 a 9 anos aprenderem a **ler, escrever e fazer contas**. Tem duas trilhas de **100 lições** cada e dois personagens originais: o **Super Faísca** e a **Fada Lumi**. Roda no próprio aparelho e funciona sem internet.

## Novidades da versão 3
- **Tudo escrito na tela.** Tudo o que o personagem fala aparece num balão de fala. Há um botão 🔊/🔇 para jogar sem som (no metrô, sem fone).
- **Menino ou menina.** Na primeira vez, a criança escolhe entre o **Super Faísca** e a **Fada Lumi**. Os dois são personagens 3D com 3 roupas (0, 30 e 60 missões) e um poder ou efeito novo a cada 10 missões. Dá para trocar de personagem na área dos pais.
- **200 lições.** São 100 de Letras e 100 de Números, cobrindo o 1º e o 2º ano e boa parte do 3º ano.
- **Login com 7 dias grátis e painel de administração** (opcional). Veja o arquivo **LOGIN-E-PAINEL.md**.
- **Vozes gravadas (opcional).** Falas com a voz Francisca, do Azure. Veja o arquivo **VOZES-AZURE.md**.
- **"Liberar todas as lições"** na área dos pais, para crianças que já sabem ler ou contar.

## Trilha de Letras (100 lições)
1. Vogais · 2. M, P, B · 3. T, D, L · 4. F, V, N, S · 5. C, G, R, J · 6. Primeiras frases
7. **Letras minúsculas** · 8. **Z, X e H** · 9. **CH, LH, NH** · 10. **R e RR** · 11. **SS, Ç, CE, CI**
12. **GE, GI, QU, GU** · 13. **Sons pelo nariz** (AN, M antes de P/B, ÃO) · 14. **R, L e S no fim da sílaba**
15. **Consoantes juntas** (BR, TR, PL…) · 16. **Vogais juntinhas** (AI, OU…) e palavras grandes
17. **Brincando com sons** (rimas, contar sílabas, mesmo começo e mesmo fim)
18. **Frases** (separar palavras, completar, ordenar, pontuação) · 19. **Pequenos textos** (bilhete, história, lista, convite, com perguntas)
20. **Palavras e sentidos** (masculino e feminino, plural, contrários, ordem alfabética)

## Trilha de Números (100 lições)
1. Até 5 · 2. Até 10 · 3. Mais e menos · 4. Padrões e formas · 5. Juntar e tirar · 6. Histórias · 7. Até 20
8. **Números até 20** (par e ímpar, dobro) · 9. **Contas até 20** (amigos do 10, família de contas)
10. **Até 100** (dezenas, quadro do 100, de 2 em 2 e de 5 em 5) · 11. **Dinheiro** (moedas, notas, troco)
12. **Medidas** (comprimento, peso, capacidade, régua) · 13. **Tempo** (semana, meses, relógio)
14. **Formas e posição** (lados, sólidos, direita e esquerda, simetria) · 15. **Contas até 100** (com vai-um e empréstimo)
16. **Multiplicação** (grupos, tabuadas do 2, 3, 4, 5 e 10) · 17. **Divisão** · 18. **Até 1000** · 19. **Frações**
20. **Gráficos e chances** · 21. **Tabuadas do 6 ao 9** · 22. **Desafios** (duas etapas, balança, estimativa, contas de cabeça)

## Arquivos
```
index.html            telas
style.css             visual
app.js                interação, personagens, poderes, voz, legendas, desenhos (relógio, dinheiro, frações...)
vozes.js              toca as falas gravadas no Azure (pasta vozes/), se existirem
personagens/          imagens dos personagens (uma por roupa)
curriculo.js          lições 1–6 de cada trilha
curriculo_extra.js    lições novas (até completar 100 + 100)
motor.js              progresso, pontos, roupas, poderes, medalhas, revisão, relatório
conta.js              login, teste grátis e verificação de acesso
config.js             ligar o login, preço, Pix, WhatsApp
admin.html            painel de administração (liberar e bloquear contas)
supabase.sql          banco de dados do login (roda uma vez no Supabase)
sw.js, manifest       app instalável e offline
privacidade.html      política de privacidade (preencha os [colchetes])
servir.py             testar no computador: python servir.py
ferramentas/          gerar_vozes.py (grava as vozes) e extrair_falas.html (lista as frases)
```

## Testar no computador
```powershell
python servir.py
```

## Publicar uma versão nova no GitHub
1. No repositório, clique em **Add file → Upload files**, arraste **todos** os arquivos e clique em **Commit changes**.
2. O tablet pega a versão nova na segunda vez que o app for aberto com internet. O progresso não se perde.
3. Sempre que mudar algum arquivo, aumente o número em `sw.js` (`super-faisca-v3` → `v4`).
