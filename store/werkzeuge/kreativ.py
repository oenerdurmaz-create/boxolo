# -*- coding: utf-8 -*-
"""Erzeugt die beiden Creative Assets für App Store Connect.

  Produktseiten-Header  3840 x 1646  (21:9)
  Suchergebnis          3840 x 2560  (3:2)

Beide in Englisch, weil die Überschriften laut Vorgabe englisch bleiben.
Ein Satz genügt damit für alle zwölf Sprachen.
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

SCRATCH = os.path.dirname(os.path.abspath(__file__))
ROH = os.path.join(SCRATCH, 'roh', '1040')
ZIEL = os.path.join(SCRATCH, 'creative')

BODEN = (10, 24, 44)
FLAECHE = (23, 54, 100)
TEXT = (242, 235, 221)
LEISE = (169, 184, 208)
SEIL = (229, 72, 77)
LINIE = (44, 76, 125)

FETT = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
KURSIV = '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf'
NORMAL = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'

# Englische Oberfläche, damit das Bild auch ohne Lokalisierung stimmig ist
SZENEN = ['en-2-reaktion.png', 'en-1-menue.png', 'en-6-verlauf.png']


def runde_maske(groesse, radius):
    m = Image.new('L', groesse, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, groesse[0] - 1, groesse[1] - 1], radius, fill=255)
    return m


def verlauf_flaeche(B, H):
    bild = Image.new('RGB', (B, H), BODEN)
    d = ImageDraw.Draw(bild)
    for x in range(B):
        a = x / B
        d.line([(x, 0), (x, H)], fill=tuple(
            int(BODEN[i] + (FLAECHE[i] - BODEN[i]) * a) for i in range(3)))
    return bild


def telefone(bild, hoehe, mitte_x, mitte_y, abstand, szenen=None):
    """Gerätebilder nebeneinander; bei drei Bildern ist das mittlere größer."""
    szenen = szenen or SZENEN
    n = len(szenen)
    for i, name in enumerate(szenen):
        gross = (n == 3 and i == 1) or n == 2
        h = int(hoehe * (1.0 if gross else 0.86))
        roh = Image.open(os.path.join(ROH, name)).convert('RGB')
        w = int(roh.width * h / roh.height)
        roh = roh.resize((w, h), Image.LANCZOS)
        radius = max(8, int(w * 0.045))
        versatz = (i - (n - 1) / 2.0) * abstand
        x = int(mitte_x + versatz - w / 2)
        y = int(mitte_y - h / 2)
        schatten = Image.new('RGB', (w, h), (0, 0, 0))
        bild.paste(schatten, (x + 10, y + 14), runde_maske((w, h), radius))
        bild.paste(roh, (x, y), runde_maske((w, h), radius))
        ImageDraw.Draw(bild).rounded_rectangle(
            [x, y, x + w - 1, y + h - 1], radius, outline=LINIE, width=4)


def wortmarke(d, x, y, groesse):
    f = ImageFont.truetype(KURSIV, groesse)
    d.text((x, y), 'Boxolo', font=f, fill=TEXT)
    breite = d.textlength('Boxolo', font=f)
    yy = y + int(groesse * 1.12)
    d.rounded_rectangle([x, yy, x + breite, yy + int(groesse * 0.055)], int(groesse * 0.03), fill=SEIL)
    d.rounded_rectangle([x, yy + int(groesse * 0.11), x + breite, yy + int(groesse * 0.165)],
                        int(groesse * 0.03), fill=SEIL)
    return yy + int(groesse * 0.165)


def header(pfad):
    B, H = 3840, 1646
    bild = verlauf_flaeche(B, H)
    d = ImageDraw.Draw(bild)
    unten = wortmarke(d, 300, 330, 320)
    f = ImageFont.truetype(NORMAL, 110)
    d.text((300, unten + 110), 'Reaction, beat and combos', font=f, fill=TEXT)
    d.text((300, unten + 110 + 150), 'Six pads. Fifty levels. No ads.', font=f, fill=LEISE)
    telefone(bild, 1500, 2870, 980, 780, ['en-2-reaktion.png', 'en-1-menue.png'])
    bild.save(pfad, 'PNG')
    return Image.open(pfad).size


def suche(pfad):
    B, H = 3840, 2560
    bild = verlauf_flaeche(B, H)
    d = ImageDraw.Draw(bild)
    unten = wortmarke(d, 0, 300, 360)
    # Wortmarke mittig setzen: neu zeichnen auf frischer Fläche
    bild = verlauf_flaeche(B, H)
    d = ImageDraw.Draw(bild)
    f_marke = ImageFont.truetype(KURSIV, 360)
    breite = d.textlength('Boxolo', font=f_marke)
    unten = wortmarke(d, int((B - breite) / 2), 250, 360)

    f = ImageFont.truetype(FETT, 150)
    zeile = 'Tap the second it lights up'
    d.text(((B - d.textlength(zeile, font=f)) / 2, unten + 110), zeile, font=f, fill=TEXT)
    f2 = ImageFont.truetype(NORMAL, 96)
    zeile2 = 'Your reaction time, measured in milliseconds'
    d.text(((B - d.textlength(zeile2, font=f2)) / 2, unten + 110 + 200), zeile2, font=f2, fill=LEISE)

    telefone(bild, 1250, B // 2, 1930, 880)
    bild.save(pfad, 'PNG')
    return Image.open(pfad).size


def main():
    if os.path.isdir(ZIEL):
        shutil.rmtree(ZIEL)
    os.makedirs(ZIEL)
    a = header(os.path.join(ZIEL, 'Header_3840x1646_21-9.png'))
    b = suche(os.path.join(ZIEL, 'SearchResult_3840x2560_3-2.png'))
    assert a == (3840, 1646), a
    assert b == (3840, 2560), b
    for n in os.listdir(ZIEL):
        im = Image.open(os.path.join(ZIEL, n))
        assert im.mode == 'RGB', (n, im.mode)
    print('Header', a, '| Suchergebnis', b, '| beide RGB ohne Alphakanal')


if __name__ == '__main__':
    main()
