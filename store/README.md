# Boxolo – Screenshots für App Store Connect

84 Bilder: 12 Sprachen × 7 Bilder.

**Format:** 1320 × 2868 Pixel, Hochformat, PNG ohne Alphakanal.
Das ist die 6,9-Zoll-Größe. Sie ist die einzige Pflichtgröße; Apple
rechnet alle kleineren iPhone-Klassen daraus herunter.

**Ordner:** nummeriert in der Reihenfolge des Sprach-Aufklappmenüs von
App Store Connect. Innerhalb eines Ordners sind die Bilder 1 bis 7 in
der Reihenfolge nummeriert, in der sie hochgeladen werden sollen.

| Nr. | Bild | Überschrift (immer Englisch) |
|---|---|---|
| 1 | Menü | Five modes. Fifty levels. |
| 2 | Reaktion | Tap the second it lights up |
| 3 | Timing | Right on the beat |
| 4 | Kombination | Real boxing combinations |
| 5 | Ergebnis | Every punch scored |
| 6 | Verlauf | Get faster every week |
| 7 | Bestenliste | It all stays on your device |

Die Oberfläche im Bild ist jeweils in der Sprache des Ordners, die
Überschrift darüber bleibt laut Vorgabe englisch.

Alle Bilder stammen aus der echten App (Build 3), nicht aus einer
Nachbildung. Die gezeigten Bestenlisten und die Verlaufskurve sind
Beispieldaten.

## Neu erzeugen

Die 84 PNG-Dateien liegen **nicht** im Repository (15 MB). Sie werden aus
dem echten Spielstand erzeugt:

```
node store/werkzeuge/szenen.js    # Rohaufnahmen, 12 Sprachen × 7 Szenen
python3 store/werkzeuge/rahmen.py # Rahmen 1320 × 2868 mit englischer Überschrift
python3 store/werkzeuge/texte.py  # Textdateien, prüft die Apple-Grenzen
```

Nach jeder Änderung am Spiel, die man sieht, gehören die Bilder neu erzeugt.
Die Pfade am Kopf der drei Dateien zeigen auf ein Arbeitsverzeichnis und sind
vor dem Lauf anzupassen.

## Texte

`store/texte/` enthält je Sprache eine Datei mit Promotional Text,
Description, Keywords und Subtitle, jeweils mit der Zeichenzahl im
Zwischentitel. `texte.py` bricht ab, wenn eine Grenze überschritten ist.
