# Boxolo – Screenshots für App Store Connect

168 Bilder: 2 Größen × 12 Sprachen × 7 Bilder. PNG, RGB, **ohne Alphakanal**.

## Welcher Ordner gehört in welches Feld

App Store Connect benennt die Felder seit 2025 nicht mehr nach Zoll,
sondern nach Gerätefamilie. Ein Bild mit der falschen Pixelgröße wird
mit „File dimensions are invalid" abgelehnt.

| Ordner | Feld in App Store Connect | Pflicht |
|---|---|---|
| `6.3-inch_1206x2622_PFLICHT` | iPhone with Dynamic Island (medium display) | **ja, immer** |
| `6.9-inch_1320x2868` | iPhone with Dynamic Island (large display) | ja, sofern kein Face-ID-Satz hochgeladen wird |

Alle übrigen Felder sind freiwillig. Apple rechnet sie aus dem
nächstgelegenen vorhandenen Satz herunter.

## Reihenfolge

Die Sprachordner sind in der Reihenfolge des Sprach-Aufklappmenüs
nummeriert, `01_Arabic` bis `12_Turkish`. Innerhalb eines Ordners sind
die Bilder 1 bis 7 in der Reihenfolge nummeriert, in der sie
hochgeladen werden sollen.

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
Nachbildung, und sind in beiden Größen einzeln gerendert statt
hochskaliert. Die gezeigten Bestenlisten und die Verlaufskurve sind
Beispieldaten.

## Neu erzeugen

Die 168 PNG-Dateien liegen **nicht** im Repository (26 MB). Sie werden aus
dem echten Spielstand erzeugt:

```
node store/werkzeuge/szenen.js 1040   # Rohaufnahmen für 1320 × 2868
node store/werkzeuge/szenen.js 950    # Rohaufnahmen für 1206 × 2622
python3 store/werkzeuge/rahmen.py     # Rahmen beider Größen, prüft die Maße
python3 store/werkzeuge/texte.py      # Textdateien, prüft die Apple-Grenzen
python3 store/werkzeuge/kreativ.py    # Header und Suchergebnis-Bild
```

Nach jeder Änderung am Spiel, die man sieht, gehören die Bilder neu erzeugt.
Die Pfade am Kopf der drei Dateien zeigen auf ein Arbeitsverzeichnis und sind
vor dem Lauf anzupassen.

## Texte

`store/texte/` enthält je Sprache eine Datei mit Promotional Text,
Description, Keywords und Subtitle, jeweils mit der Zeichenzahl im
Zwischentitel. `texte.py` bricht ab, wenn eine Grenze überschritten ist.

## Creative Assets (Feld „Header and Search Results")

Freiwillig, erzeugt von `store/werkzeuge/kreativ.py`:

| Datei | Platzierung | Maße |
|---|---|---|
| `Header_3840x1646_21-9.png` | Product page header, 21:9 | 3840 × 1646 |
| `SearchResult_3840x2560_3-2.png` | Search results, 3:2 | 3840 × 2560 |

Beide in Englisch, damit ein Satz für alle zwölf Sprachen genügt. Ohne
Suchergebnis-Bild zeigt der App Store in der Suche die Screenshots.
