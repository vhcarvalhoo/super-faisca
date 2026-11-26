"""Gera os ícones do app (pasta icones/) a partir das imagens dos personagens.

Uso (na pasta do projeto):  python ferramentas/gerar_icones.py
Precisa do Pillow (pip install pillow). Rode de novo se as imagens dos personagens mudarem.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
PERS = RAIZ / "personagens"
SAIDA = RAIZ / "icones"
GRANDE = 1024  # desenha grande e reduz no fim (fica mais nítido)


def fundo(tam):
    """Céu: azul claro no centro, mais forte nas bordas (cores do app)."""
    centro, borda = (224, 242, 254), (56, 189, 248)
    img = Image.new("RGB", (tam, tam), borda)
    mascara = Image.new("L", (tam, tam), 0)
    d = ImageDraw.Draw(mascara)
    passos = 60
    for i in range(passos):
        r = tam * 0.75 * (1 - i / passos)
        d.ellipse((tam / 2 - r, tam * 0.42 - r, tam / 2 + r, tam * 0.42 + r), fill=int(255 * i / passos))
    mascara = mascara.filter(ImageFilter.GaussianBlur(tam / 30))
    img.paste(Image.new("RGB", (tam, tam), centro), (0, 0), mascara)
    return img


def busto(nome, altura_corte):
    """Recorta o personagem da cabeça até a cintura (sem o espaço vazio em volta)."""
    im = Image.open(PERS / f"{nome}.webp").convert("RGBA")
    x0, y0, x1, _ = im.getchannel("A").getbbox()
    return im.crop((x0, y0, x1, y0 + altura_corte))


def desenhar(tam, escala):
    """Super Faísca da cabeça até a cintura, centralizado e cortado pela borda de baixo."""
    img = fundo(GRANDE).convert("RGBA")
    heroi = busto("faisca-basico", 300)
    alvo = GRANDE * escala  # altura do personagem
    heroi = heroi.resize((round(heroi.width * alvo / heroi.height), round(alvo)), Image.LANCZOS)
    x, y = (GRANDE - heroi.width) // 2, GRANDE - heroi.height
    # sombra suave atrás, para destacar do céu
    sombra = Image.new("RGBA", (GRANDE, GRANDE), (0, 0, 0, 0))
    a = heroi.getchannel("A").point(lambda v: v * 0.35)
    sombra.paste(Image.new("RGBA", heroi.size, (30, 58, 138, 255)), (x, y + 10), a)
    img.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(GRANDE / 70)))
    img.alpha_composite(heroi, (x, y))
    return img.convert("RGB").resize((tam, tam), Image.LANCZOS)


def main():
    SAIDA.mkdir(exist_ok=True)
    feitos = {
        "icone-512.png": desenhar(512, 0.90),
        "icone-192.png": desenhar(192, 0.90),
        "apple-touch-icon.png": desenhar(180, 0.90),
        # "maskable": o Android corta em círculo/gota; o rosto precisa ficar no miolo
        "icone-maskable-512.png": desenhar(512, 0.74),
        "icone-maskable-192.png": desenhar(192, 0.74),
    }
    for nome, im in feitos.items():
        im.save(SAIDA / nome, optimize=True)
        print(f"  {nome}: {im.size[0]}x{im.size[1]}, {(SAIDA / nome).stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
