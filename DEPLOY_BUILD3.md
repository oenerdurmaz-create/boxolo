# Build 3 – Boxolo, zwölf Sprachen

Stand 10.10.2026. Web-Build 3, Marketing-Version 1.0.

## Inhalt

1. **Name Boxolo.** Der Anzeigename der App (`CFBundleDisplayName`) und der Projektname in `ios/project.yml` heißen jetzt Boxolo, ebenso der Titel im Spiel und die Überschrift der Hilfe in allen zwölf Sprachen.
2. **Alle zwölf Sprachen aktiv:** de, en, fr, es, it, pt, nl, pl, tr, ar, ja, zh. 186 Textschlüssel je Sprache, einschließlich der Sprachnamen für den Umschalter.
3. **GitHub-Workflow repariert.** `.github/workflows/validate.yml` rief `boxreaktion/tools/pruefung.js` auf; diesen Ordner gibt es im Repository nicht.

## Bewusst nicht geändert

Interne Bezeichner bleiben auf BeatBox, weil ein Umbenennen den App-Store-Eintrag und den gespeicherten Spielstand gefährden würde:

- **Bundle-ID `de.LaraJade.beatbox`** – ist in App Store Connect mit der Apple-ID 6814647151 verknüpft. Eine Änderung bedeutet eine neue App.
- **Ziel- und Schemaname `BeatBox`**, Ordner `ios/BeatBox/`, URL-Schema `beatbox://localhost/` – das Schema ist die Herkunft für `localStorage`. Eine Änderung löscht alle Bestenlisten auf den Geräten.
- **Name des Codemagic-API-Schlüssels** `BeatBox API-Schluessel`.

Nichts davon ist für Nutzer sichtbar.

## Geprüft

- `node tools/pruefung.js`: 22 Prüfungen, 22 bestanden. P09 bestätigt in allen zwölf Sprachen gleiche Schlüssel und gleiche Platzhalter.
- `node --check` über alle JavaScript-Dateien.
- Headless Chromium bei 375 × 812 und 375 × 667: Menü, Einstellungen und Hilfe in Arabisch, Japanisch, Chinesisch, Türkisch, Polnisch und Englisch gerendert und angesehen. Keine Konsolenfehler, kein waagerechter Überlauf.
- Arabisch: `dir="rtl"` und `lang="ar"` werden gesetzt, die Levelkacheln laufen von rechts nach links, Zahlen und Einheiten stehen richtig.
- `HILFE.md` nach dem Namenswechsel neu erzeugt (`--hilfe-schreiben`) und von P12 gegen den Hilfe-Bildschirm geprüft.

## Nicht geprüft

- **Die elf Übersetzungen sind nicht muttersprachlich gegengelesen.** Besonders Japanisch, Chinesisch, Arabisch und Türkisch gehören vor der Store-Einreichung geprüft.
- Alles aus Build 2, was ein echtes Gerät braucht: Swift nicht kompiliert, kein WKWebView, Latenz und Ton ungeprüft.
- Die Marke Boxolo ist nur über eine Websuche geprüft, nicht über DPMA, EUIPO oder TMview.
