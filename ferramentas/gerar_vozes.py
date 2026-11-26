#!/usr/bin/env python3
"""Grava as falas do Super Faísca com o Azure (voz Francisca) e monta a pasta vozes/.

Uso (no terminal, dentro da pasta do projeto):
    python ferramentas/gerar_vozes.py            grava o que falta (das frases mais usadas para as menos) e monta vozes/
    python ferramentas/gerar_vozes.py --teste    grava só 5 frases, para conferir se a chave funciona
    python ferramentas/gerar_vozes.py --so-montar  só monta a pasta vozes/ com o que já foi gravado

A chave do Azure NUNCA fica no projeto. Ela fica em:
    C:\\Users\\<seu usuário>\\SuperFaisca-vozes\\chave.txt
Nessa mesma pasta ficam as gravações (gravacoes/) e o controle de uso do mês (uso.json).
Pode parar com Ctrl+C a qualquer hora: da próxima vez ele continua de onde parou.

Só usa a biblioteca padrão do Python (não precisa instalar nada).
"""
import argparse
import datetime
import getpass
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

PROJETO = Path(__file__).resolve().parent.parent
FALAS = PROJETO / "ferramentas" / "falas.json"
SAIDA = PROJETO / "vozes"
TRABALHO = Path.home() / "SuperFaisca-vozes"
GRAVACOES = TRABALHO / "gravacoes"
USO = TRABALHO / "uso.json"

VOZ = "pt-BR-FranciscaNeural"
REGIAO_PADRAO = "eastus"
FORMATO = "audio-16khz-32kbitrate-mono-mp3"  # leve e bom para fala (~4 KB por segundo)
VELOCIDADE = "-8%"          # um pouco mais devagar que o normal, para criança pequena
VELOCIDADE_LENTA = "-35%"   # sílabas faladas devagar
SILENCIO_FIM = "250ms"      # pausa no fim de cada frase (antes da próxima)
LIMITE_MES = 450_000       # o plano grátis (F0) dá 500 mil caracteres por mês; deixamos uma folga
PAUSA = 3.2                 # segundos entre pedidos: o plano grátis aceita 20 por minuto
TAMANHO_PACOTE = 3 * 1024 * 1024


def limpar_chave(bruta):
    """Ao colar, alguns terminais mandam códigos invisíveis junto (ex.: ESC[200~ ... ESC[201~).
    A chave do Azure só tem letras e números, então fica só com isso."""
    s = re.sub(r"\x1b\[[0-9;]*[~A-Za-z]", "", bruta)
    s = s.replace("[200~", "").replace("[201~", "")
    return "".join(c for c in s if c.isascii() and c.isalnum())


def ler_config():
    chave_arq = TRABALHO / "chave.txt"
    if not chave_arq.exists() or not chave_arq.read_text(encoding="utf-8").strip():
        # pede a chave no terminal (não aparece na tela) e guarda FORA do projeto
        TRABALHO.mkdir(parents=True, exist_ok=True)
        print("\n  Ainda não tenho a chave do Azure.")
        print("  Cole a CHAVE 1 do seu recurso de Fala (clique com o botão direito ou Ctrl+V) e aperte Enter.")
        print("  Por segurança, a chave não aparece enquanto você cola.\n")
        chave = limpar_chave(getpass.getpass("  Chave: "))
        print(f"  Recebi uma chave com {len(chave)} letras e números.")
        if len(chave) not in (32, 84):
            print("\n  Uma chave do Azure tem 32 ou 84 letras e números. Essa parece incompleta ou com algo a mais.")
            print("  Copie de novo a CHAVE 1 no portal (botão de copiar ao lado dela) e rode outra vez.")
            sys.exit(1)
        chave_arq.write_text(chave + "\n", encoding="utf-8")
        print(f"  Chave guardada em {chave_arq} (fora do projeto, não vai para o GitHub).\n")
        print("  Agora a região. No portal do Azure, na mesma página da chave, veja o campo \"Local/Região\"")
        print("  (por exemplo: eastus, brazilsouth, westeurope). Digite e aperte Enter.")
        regiao = input(f"  Região (só Enter = {REGIAO_PADRAO}): ").strip().lower().replace(" ", "")
        (TRABALHO / "regiao.txt").write_text((regiao or REGIAO_PADRAO) + "\n", encoding="utf-8")
    chave = chave_arq.read_text(encoding="utf-8").strip()
    regiao_arq = TRABALHO / "regiao.txt"
    regiao = regiao_arq.read_text(encoding="utf-8").strip() if regiao_arq.exists() else REGIAO_PADRAO
    return chave, regiao or REGIAO_PADRAO


def arquivo_de(chave):
    return GRAVACOES / (hashlib.sha1(chave.encode("utf-8")).hexdigest() + ".mp3")


def mes_atual():
    return datetime.date.today().strftime("%Y-%m")


def ler_uso():
    try:
        return json.loads(USO.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def salvar_uso(uso):
    USO.write_text(json.dumps(uso, indent=1), encoding="utf-8")


def ssml(texto, lento):
    vel = VELOCIDADE_LENTA if lento else VELOCIDADE
    # silêncio curto antes e depois: o app junta várias frases seguidas
    return (f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='pt-BR'>"
            f"<voice name='{VOZ}'><mstts:silence type='Leading-exact' value='40ms'/><mstts:silence type='Tailing-exact' value='{SILENCIO_FIM}'/>"
            f"<prosody rate='{vel}'>{escape(texto)}</prosody></voice></speak>").encode("utf-8")


def sintetizar(texto, lento, chave, regiao):
    req = urllib.request.Request(
        f"https://{regiao}.tts.speech.microsoft.com/cognitiveservices/v1",
        data=ssml(texto, lento), method="POST",
        headers={"Ocp-Apim-Subscription-Key": chave, "Content-Type": "application/ssml+xml",
                 "X-Microsoft-OutputFormat": FORMATO, "User-Agent": "SuperFaisca-gerar-vozes"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def gravar(falas, so_teste):
    chave, regiao = ler_config()
    GRAVACOES.mkdir(parents=True, exist_ok=True)
    uso = ler_uso()
    mes = mes_atual()
    faltam = [f for f in falas if not arquivo_de(f["chave"]).exists()]
    if so_teste:
        faltam = faltam[:5]
    total = sum(len(f["texto"]) for f in faltam)
    print(f"\n  Frases para gravar: {len(faltam)} ({total:,} caracteres)".replace(",", "."))
    print(f"  Usado neste mês ({mes}): {uso.get(mes, 0):,} de {LIMITE_MES:,} caracteres".replace(",", "."))
    if faltam:
        minutos = len(faltam) * PAUSA / 60
        print(f"  Tempo estimado: {minutos:.0f} minutos. Pode parar com Ctrl+C e continuar depois.\n")
    feitas = 0
    try:
        for i, f in enumerate(faltam, 1):
            custo = len(f["texto"])
            if uso.get(mes, 0) + custo > LIMITE_MES:
                print("\n  Chegou ao limite grátis deste mês. Rode de novo no mês que vem para continuar.")
                break
            for tentativa in range(5):
                try:
                    audio = sintetizar(f["texto"], f["lento"], chave, regiao)
                    break
                except urllib.error.HTTPError as e:
                    if e.code in (401, 403):
                        # na próxima vez ele pede a chave e a região de novo
                        (TRABALHO / "chave.txt").unlink(missing_ok=True)
                        (TRABALHO / "regiao.txt").unlink(missing_ok=True)
                        print(f"\n  O Azure recusou a chave na região \"{regiao}\" (erro {e.code}).")
                        print("  Confira no portal, na página \"Chaves e Ponto de Extremidade\" do recurso de Fala:")
                        print("   - a CHAVE 1 (use o botão de copiar ao lado dela);")
                        print("   - o campo \"Local/Região\".")
                        print("  Depois rode de novo: ele vai pedir a chave e a região.")
                        return feitas
                    if e.code == 429:
                        print("  Muitos pedidos seguidos; esperando 60 segundos...")
                        time.sleep(60)
                    else:
                        print(f"  Erro {e.code} do Azure; tentando de novo em 10 segundos...")
                        time.sleep(10)
                except (urllib.error.URLError, TimeoutError) as e:
                    print(f"  Sem conexão ({e}); tentando de novo em 15 segundos...")
                    time.sleep(15)
            else:
                print("  Não deu certo depois de 5 tentativas. Rode de novo mais tarde.")
                break
            arquivo_de(f["chave"]).write_bytes(audio)
            uso[mes] = uso.get(mes, 0) + custo
            salvar_uso(uso)
            feitas += 1
            if i % 25 == 0 or i == len(faltam):
                print(f"  {i}/{len(faltam)} gravadas  (mês: {uso[mes]:,} caracteres)".replace(",", "."))
            time.sleep(PAUSA)
    except KeyboardInterrupt:
        print("\n  Parado. Da próxima vez continua de onde parou.")
    return feitas


def montar(falas):
    """Junta as gravações em pacotes de até 3 MB e escreve vozes/indice.json.
    Pacotes já publicados são mantidos (o aparelho não precisa baixar de novo);
    as frases novas entram em pacotes novos."""
    antigo = {}
    try:
        antigo = json.loads((SAIDA / "indice.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        pass
    indice = {"voz": VOZ, "tipo": "audio/mpeg", "pacotes": [], "falas": {}}

    # 1) mantém os pacotes antigos cheios (com o mesmo nome)
    if antigo.get("voz") == VOZ:
        por_pacote = {}
        for ch, (p, ini, tam) in antigo.get("falas", {}).items():
            por_pacote.setdefault(p, []).append((ini, tam, ch))
        for p, nome in enumerate(antigo.get("pacotes", [])):
            arq = SAIDA / nome
            if not arq.exists() or arq.stat().st_size < TAMANHO_PACOTE * 0.9:
                continue  # pacote incompleto: as frases dele entram de novo nos pacotes novos
            novo_p = len(indice["pacotes"])
            indice["pacotes"].append(nome)
            for ini, tam, ch in por_pacote.get(p, []):
                indice["falas"][ch] = [novo_p, ini, tam]

    # 2) frases gravadas que ainda não estão em pacote, na ordem de prioridade
    def bytes_de(ch):
        arq = arquivo_de(ch)
        if arq.exists():
            return arq.read_bytes()
        if ch in antigo.get("falas", {}):  # gravada em outro computador: tira do pacote antigo
            p, ini, tam = antigo["falas"][ch]
            arq_p = SAIDA / antigo["pacotes"][p]
            if arq_p.exists():
                return arq_p.read_bytes()[ini:ini + tam]
        return None

    atual, membros = bytearray(), []

    def fechar():
        nonlocal atual, membros
        if not membros:
            return
        nome = f"pacote-{hashlib.sha1(atual).hexdigest()[:10]}.mp3"
        SAIDA.mkdir(exist_ok=True)
        (SAIDA / nome).write_bytes(atual)
        p = len(indice["pacotes"])
        indice["pacotes"].append(nome)
        for ch, ini, tam in membros:
            indice["falas"][ch] = [p, ini, tam]
        atual, membros = bytearray(), []

    for f in falas:
        ch = f["chave"]
        if ch in indice["falas"]:
            continue
        dados = bytes_de(ch)
        if not dados:
            continue
        if len(atual) + len(dados) > TAMANHO_PACOTE:
            fechar()
        membros.append((ch, len(atual), len(dados)))
        atual += dados
    fechar()

    if not indice["falas"]:
        print("\n  Ainda não há nenhuma frase gravada; a pasta vozes/ não foi criada.")
        return
    (SAIDA / "indice.json").write_text(json.dumps(indice, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    usados = set(indice["pacotes"])
    for arq in SAIDA.glob("pacote-*.mp3"):
        if arq.name not in usados:
            arq.unlink()
    tamanho = sum((SAIDA / n).stat().st_size for n in indice["pacotes"]) / 1024 / 1024
    print(f"\n  Pasta vozes/ pronta: {len(indice['falas'])} frases em {len(indice['pacotes'])} pacotes ({tamanho:.1f} MB).")
    print("  Agora é só publicar (aumentar a VERSAO no sw.js não é preciso só por causa das vozes).")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description="Grava as falas do Super Faísca com o Azure.")
    ap.add_argument("--teste", action="store_true", help="grava só 5 frases")
    ap.add_argument("--so-montar", action="store_true", help="não grava; só monta a pasta vozes/")
    a = ap.parse_args()
    if not FALAS.exists():
        print("  Falta o ferramentas/falas.json. Gere com a página ferramentas/extrair_falas.html (veja o VOZES-AZURE.md).")
        sys.exit(1)
    falas = json.loads(FALAS.read_text(encoding="utf-8"))["falas"]
    if not a.so_montar:
        gravar(falas, a.teste)
    montar(falas)


if __name__ == "__main__":
    main()
