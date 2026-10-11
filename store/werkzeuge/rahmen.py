# -*- coding: utf-8 -*-
"""Setzt die Rohaufnahmen in App-Store-Rahmen mit englischer Überschrift.

Zwei Zielgrößen, weil App Store Connect zwei iPhone-Felder verlangt:
  1320 x 2868  iPhone mit Dynamic Island, großes Display (6,9 Zoll)
  1206 x 2622  iPhone mit Dynamic Island, mittleres Display (6,3 Zoll)
Das mittlere Feld ist immer Pflicht, das große ersetzt das alte 6,5-Zoll-Feld.
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

SCRATCH = os.path.dirname(os.path.abspath(__file__))
ROH = os.path.join(SCRATCH, 'roh')
ZIEL = os.path.join(SCRATCH, 'screenshots')

# (Ordnername, Breite, Höhe, Breite der Rohaufnahme in diesem Ordner)
GROESSEN = [
    ('6.3-inch_1206x2622_PFLICHT', 1206, 2622, 950),
    ('6.9-inch_1320x2868', 1320, 2868, 1040),
]

BODEN = (10, 24, 44)
FLAECHE = (21, 48, 90)
TEXT = (242, 235, 221)
LEISE = (169, 184, 208)
SEIL = (229, 72, 77)
LINIE = (44, 76, 125)

FETT = '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
NORMAL = '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'

# Reihenfolge wie im Sprach-Aufklappmenü von App Store Connect
SPRACHEN = [
    ('ar', 'Arabic'), ('zh', 'Chinese-Simplified'), ('nl', 'Dutch'),
    ('en', 'English-US'), ('fr', 'French'), ('de', 'German'),
    ('it', 'Italian'), ('ja', 'Japanese'), ('pl', 'Polish'),
    ('pt', 'Portuguese'), ('es', 'Spanish'), ('tr', 'Turkish'),
]

SZENEN = [
    ('1-menue',       'Five modes. Fifty levels.',   'Reaction, timing, combinations, stamina and rhythm'),
    ('2-reaktion',    'Tap the second it lights up', 'Your reaction time, measured in milliseconds'),
    ('3-timing',      'Right on the beat',           'The ring closes in — strike when it meets the edge'),
    ('4-kombination', 'Real boxing combinations',    'Jab, cross, hook, uppercut — in the right order'),
    ('5-ergebnis',    'Every punch scored',          'Points only go up. Nothing is ever taken away.'),
    ('6-verlauf',     'Get faster every week',       'Your reaction time over the last 30 days'),
    ('7-bestenliste', 'It all stays on your device', 'No ads, no account, nothing to buy'),
]


def umbrechen(zeichner, text, schrift, breite):
    """Bricht auf höchstens zwei möglichst gleich lange Zeilen um."""
    worte = text.split()
    if zeichner.textlength(text, font=schrift) <= breite:
        return [text]
    bester, bestmass = None, None
    for i in range(1, len(worte)):
        a, b = ' '.join(worte[:i]), ' '.join(worte[i:])
        la, lb = zeichner.textlength(a, font=schrift), zeichner.textlength(b, font=schrift)
        if la > breite or lb > breite:
            continue
        mass = abs(la - lb)
        if bestmass is None or mass < bestmass:
            bester, bestmass = [a, b], mass
    if bester:
        return bester
    zeilen, zeile = [], ''
    for w in worte:
        probe = (zeile + ' ' + w).strip()
        if zeichner.textlength(probe, font=schrift) <= breite:
            zeile = probe
        else:
            if zeile:
                zeilen.append(zeile)
            zeile = w
    if zeile:
        zeilen.append(zeile)
    return zeilen


def runde_maske(groesse, radius):
    m = Image.new('L', groesse, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, groesse[0] - 1, groesse[1] - 1], radius, fill=255)
    return m


def rahmen(roh_pfad, ueberschrift, unterzeile, ziel_pfad, B, H):
    f = B / 1320.0  # alle Maße sind für 1320 Punkte Breite entworfen
    bild = Image.new('RGB', (B, H), BODEN)
    d = ImageDraw.Draw(bild)

    for y in range(H):
        a = y / H
        d.line([(0, y), (B, y)], fill=tuple(
            int(BODEN[i] + (FLAECHE[i] - BODEN[i]) * a * 0.85) for i in range(3)))

    rand = int(90 * f)
    innen = B - 2 * rand

    f_gross = ImageFont.truetype(FETT, int(100 * f))
    f_klein = ImageFont.truetype(NORMAL, int(42 * f))

    zeilen = umbrechen(d, ueberschrift, f_gross, innen)
    while len(zeilen) > 2:
        f_gross = ImageFont.truetype(FETT, f_gross.size - 6)
        zeilen = umbrechen(d, ueberschrift, f_gross, innen)

    y = int(150 * f)
    for z in zeilen:
        d.text((rand, y), z, font=f_gross, fill=TEXT)
        y += int(f_gross.size * 1.18)

    y += int(18 * f)
    d.rounded_rectangle([rand, y, rand + int(150 * f), y + int(10 * f)], int(5 * f), fill=SEIL)
    y += int(44 * f)

    for z in umbrechen(d, unterzeile, f_klein, innen):
        d.text((rand, y), z, font=f_klein, fill=LEISE)
        y += int(f_klein.size * 1.3)

    roh = Image.open(roh_pfad).convert('RGB')
    unten = int(130 * f)
    oben = H - unten - roh.height
    if oben < y + int(40 * f):
        oben = y + int(40 * f)
        roh = roh.crop((0, 0, roh.width, H - unten - oben))

    links = (B - roh.width) // 2
    radius = int(46 * f)
    bild.paste(roh, (links, oben), runde_maske(roh.size, radius))
    d.rounded_rectangle([links, oben, links + roh.width - 1, oben + roh.height - 1],
                        radius, outline=LINIE, width=max(2, int(3 * f)))

    bild.save(ziel_pfad, 'PNG')
    geprueft = Image.open(ziel_pfad)
    assert geprueft.size == (B, H), (ziel_pfad, geprueft.size)
    assert geprueft.mode == 'RGB', (ziel_pfad, geprueft.mode)


def main():
    if os.path.isdir(ZIEL):
        shutil.rmtree(ZIEL)
    anzahl = 0
    for ordner_groesse, B, H, rohbreite in GROESSEN:
        for nr, (code, sprache) in enumerate(SPRACHEN, start=1):
            pfad = os.path.join(ZIEL, ordner_groesse, '%02d_%s' % (nr, sprache))
            os.makedirs(pfad)
            for i, (szene, kopf, unter) in enumerate(SZENEN, start=1):
                quelle = os.path.join(ROH, '%d' % rohbreite, '%s-%s.png' % (code, szene))
                ziel = os.path.join(pfad, '%d_%s_%s.png' % (i, sprache, szene.split('-')[1]))
                rahmen(quelle, kopf, unter, ziel, B, H)
                anzahl += 1
    print('erzeugt und auf Maße geprüft:', anzahl)


if __name__ == '__main__':
    main()
