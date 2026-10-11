"""Setzt die Rohaufnahmen in 1320x2868-Rahmen mit englischer Überschrift."""
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

SCRATCH = os.path.dirname(os.path.abspath(__file__))
ROH = os.path.join(SCRATCH, 'roh')
ZIEL = os.path.join(SCRATCH, 'screenshots')

B, H = 1320, 2868
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
    ('1-menue',       'Five modes. Fifty levels.',      'Reaction, timing, combinations, stamina and rhythm'),
    ('2-reaktion',    'Tap the second it lights up',    'Your reaction time, measured in milliseconds'),
    ('3-timing',      'Right on the beat',              'The ring closes in — strike when it meets the edge'),
    ('4-kombination', 'Real boxing combinations',       'Jab, cross, hook, uppercut — in the right order'),
    ('5-ergebnis',    'Every punch scored',             'Points only go up. Nothing is ever taken away.'),
    ('6-verlauf',     'Get faster every week',          'Your reaction time over the last 30 days'),
    ('7-bestenliste', 'It all stays on your device',    'No ads, no account, nothing to buy'),
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
    # passt nicht in zwei Zeilen: normal fluten
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


def rahmen(roh_pfad, ueberschrift, unterzeile, ziel_pfad):
    bild = Image.new('RGB', (B, H), BODEN)
    d = ImageDraw.Draw(bild)

    # Farbverlauf nach unten, damit die Fläche nicht tot wirkt
    for y in range(H):
        f = y / H
        d.line([(0, y), (B, y)], fill=(
            int(BODEN[0] + (FLAECHE[0] - BODEN[0]) * f * 0.85),
            int(BODEN[1] + (FLAECHE[1] - BODEN[1]) * f * 0.85),
            int(BODEN[2] + (FLAECHE[2] - BODEN[2]) * f * 0.85)))

    rand = 90
    innen = B - 2 * rand

    f_gross = ImageFont.truetype(FETT, 100)
    f_klein = ImageFont.truetype(NORMAL, 42)

    zeilen = umbrechen(d, ueberschrift, f_gross, innen)
    while len(zeilen) > 2:
        f_gross = ImageFont.truetype(FETT, f_gross.size - 6)
        zeilen = umbrechen(d, ueberschrift, f_gross, innen)

    y = 150
    for z in zeilen:
        d.text((rand, y), z, font=f_gross, fill=TEXT)
        y += int(f_gross.size * 1.18)

    y += 18
    d.rounded_rectangle([rand, y, rand + 150, y + 10], 5, fill=SEIL)
    y += 44

    for z in umbrechen(d, unterzeile, f_klein, innen):
        d.text((rand, y), z, font=f_klein, fill=LEISE)
        y += int(f_klein.size * 1.3)

    # Gerätebild unten bündig, oben abgeschnitten, falls nötig
    roh = Image.open(roh_pfad).convert('RGB')
    oben = H - 130 - roh.height
    if oben < y + 40:
        oben = y + 40
        roh = roh.crop((0, 0, roh.width, H - 130 - oben))

    links = (B - roh.width) // 2
    maske = runde_maske(roh.size, 46)
    bild.paste(roh, (links, oben), maske)
    d.rounded_rectangle(
        [links, oben, links + roh.width - 1, oben + roh.height - 1],
        46, outline=LINIE, width=3)

    bild.save(ziel_pfad, 'PNG')


def main():
    if os.path.isdir(ZIEL):
        shutil.rmtree(ZIEL)
    anzahl = 0
    for nr, (code, ordner) in enumerate(SPRACHEN, start=1):
        pfad = os.path.join(ZIEL, '%02d_%s' % (nr, ordner))
        os.makedirs(pfad)
        for i, (szene, kopf, unter) in enumerate(SZENEN, start=1):
            quelle = os.path.join(ROH, '%s-%s.png' % (code, szene))
            ziel = os.path.join(pfad, '%d_%s_%s.png' % (i, ordner, szene.split('-')[1]))
            rahmen(quelle, kopf, unter, ziel)
            anzahl += 1
    print('erzeugt:', anzahl)


if __name__ == '__main__':
    main()
