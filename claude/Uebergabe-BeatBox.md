# Übergabe-Notiz Boxolo (Stand 10.10.2026, Build 3 auf `main`)

> Diese Datei ist der Startpunkt für jeden neuen Chat zu diesem Projekt. Bitte vollständig lesen.
> Der Code ist die technische Grundlage, nicht diese Beschreibung. Weichen beide voneinander ab:
> den Code prüfen, die Abweichung benennen, Änderungsvorschlag machen — erst danach ändern.

---

## 1. Projekt in Kürze

- iPhone-Spiel **„Boxolo"** (Anzeigename seit Build 3; interne Bezeichner, Bundle-ID und URL-Schema heißen weiterhin BeatBox) — Reaktions- und Rhythmusspiel. Sechs Trefferzonen in Boxnotation, der Spieler tippt sie so schnell und so genau wie möglich an. Gemessen werden Reaktionszeit in Millisekunden, Trefferquote und Serienlänge.
- Repo: https://github.com/oenerdurmaz-create/boxolo (Branch `main`, **öffentlich** seit 11.10.2026; vorher privat und unter dem Namen `beatbox`). Arbeit nur per Git (commit + push), keine ZIPs.
- Bundle-ID: `de.LaraJade.beatbox`. Apple-ID der App in App Store Connect: `6814647151`. Version 1.0, iOS 16+, nur iPhone, nur Hochformat.
- Architektur wie Rechenpyramide: **native Hülle + WKWebView**, gesamte Spiellogik im Web-Paket (HTML/CSS/JavaScript, keine Bibliotheken, kein Build-Schritt). Besonderheit gegenüber der Rechenpyramide: Die Web-Dateien werden über ein eigenes URL-Schema `beatbox://localhost/` ausgeliefert statt über `file://`, damit `localStorage` eine stabile Herkunft hat und erhalten bleibt.
- Das Xcode-Projekt wird aus `ios/project.yml` per **XcodeGen** erzeugt und ist bewusst **nicht** eingecheckt.
- Spielstand: `localStorage`, kein Server, keine Konten, keine Tracker, kein Netzwerkzugriff im Swift-Code.
- Sprachen: **alle zwölf aktiv seit Build 3** (de, en, fr, es, it, pt, nl, pl, tr, ar, ja, zh) wie bei der Rechenpyramide. Die Struktur in `js/i18n.js` ist darauf ausgelegt, jede Sprache trägt Leserichtung und Locale. Eine Sprache wird aktiv, sobald sie in `SPRACHEN` steht. Arabisch ist RTL; Zahlen und Rechnungen bleiben isoliert.
- **Zielgruppe: Kinder** (Entscheidung 10.10.2026). Daraus folgt die Kinder-Kategorie im App Store: keine Tracker, keine Werbung, keine Analytik Dritter, keine externen Links und keine Käufe ohne Elternhürde. Das Spiel erfüllt das bereits, weil es ohne Netzwerk auskommt. Wichtig für die Darstellung: Es wird auf **Pratzen** geschlagen wie im Training, nicht auf einen Gegner. Kein Kampf, kein Treffer am Körper, keine Niederlage.

### Herkunft

Build 1 und 2 wurden von einem anderen Werkzeug (Z.AI) nach einem schriftlichen Auftrag gebaut. Die Weiterentwicklung läuft ab jetzt mit Claude. Der Stand ist vollständig und sauber dokumentiert; es gibt keinen Grund, ihn neu zu bauen.

---

## 2. Spielaufbau

### Die sechs Zonen (Boxnotation)

| Zone | Schlag | Position |
|---|---|---|
| 1 | Jab links | oben links |
| 2 | Cross rechts | oben rechts |
| 3 | Haken links | Mitte links |
| 4 | Haken rechts | Mitte rechts |
| 5 | Uppercut links | unten links |
| 6 | Uppercut rechts | unten rechts |

### Fünf Modi, je zehn Level

| Modus | Aufgabe | Besonderheit |
|---|---|---|
| Reaktion | Zufälliges Ziel leuchtet auf, so schnell wie möglich tippen | Eigene Schwellen, kein Takt: Perfekt bis 350 ms, Gut bis 500 ms, Ok bis Zeitlimit (1200 ms in Level 1 bis 700 ms in Level 10). Unter 100 ms gilt als Fehlstart. |
| Timing | Schrumpfender Ring, im Moment des Zusammentreffens tippen | Bewertet wird die Abweichung mit Vorzeichen |
| Kombination | Folge wird vorgeführt, dann auf Klick nachgeschlagen | Acht Folgen je Level, Standardfolgen `1-2`, `1-2-3`, `1-2-5-2`, `3-4-6-2`, `1-1-2-3-2` |
| Ausdauer | Dauerfeuer, Tempo +8 BPM alle 10 Sekunden | Beat-Positionen stehen in Grund-BPM in der Beatmap |
| Rhythmus | Ruf und Antwort: erster Takt vorgespielt, zweiter nachgeschlagen | Ab Level 5 Achtel, Level 9/10 Sechzehntel, nur auf gegenüberliegenden Hälften |

### Bewertung

| Urteil | Fenster (Takt-Modi) | Punkte |
|---|---|---|
| Perfekt | ±40 ms | 100 |
| Gut | ±80 ms | 60 |
| Ok | ±130 ms | 25 |
| Daneben | darüber oder falsche Zone | 0, Serie endet |

- Das Levelfenster begrenzt die Tabelle nach außen: bei ±70 ms (Level 10) gibt es nur noch Perfekt und Gut.
- Serienmultiplikator alle 10 Treffer in Folge: ×1 → ×1,5 → ×2 → ×3 → ×4 als Obergrenze. In die Endpunktzahl geht der **höchste** in der Runde erreichte Multiplikator ein.
- Endpunktzahl = Summe der Schlagpunkte × höchster Multiplikator × Levelfaktor (1,0 bei Level 1 bis 1,9 bei Level 10).
- Sterne: 1 ab 60 %, 2 ab 80 %, 3 ab 95 % Trefferquote.
- **Punkte werden ausschließlich gezählt, niemals abgezogen.** Keine Währung, kein Einkauf, keine verbrauchbare Ressource.

### Freischaltung — festgelegt und nicht verhandelbar

**Alle Modi und alle Level sind von Anfang an sichtbar und frei wählbar. Keine Freischaltung, keine Fortschrittssperre, keine Schloss-Symbole.**

Grund: Bei der Rechenpyramide führte genau das (Build 5, Level bauten aufeinander auf) zu einer Ablehnung im App Store nach Guideline 5.6. Sterne, Bestwerte und Abzeichen dürfen angezeigt werden, dürfen aber nie Voraussetzung für den Zugang zu einem Inhalt sein. Prüfung P11 sichert das maschinell ab.

### Bestenlisten

Zehn Einträge je Modus **und** Level, in `localStorage`. Der Spielername kommt aus den Einstellungen (Standard „Spieler"), damit nach der Runde kein Eingabefeld nötig ist. Der Verlaufsbildschirm zeigt nur den Modus Reaktion, weil nur dort echte Reaktionszeit gemessen wird.

---

## 3. Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Gerüst aller Bildschirme, enthält **keinen** sichtbaren Text |
| `css/style.css` | Darstellung, sichere Bereiche, Zonen, Ringe |
| `js/main.js` | Oberfläche, Eingabe (`pointerdown`), Bildschleife, Hintergrund-Behandlung |
| `js/audio.js` | Web-Audio-Engine, Takt-Uhr, Klangerzeugung, Uhrabgleich |
| `js/game.js` | Bewertung, fünf Modi, Kalibrierung — ohne DOM-Zugriff |
| `js/levels.js` | Stellschrauben, Beatmap-Generator, Spielbarkeitsprüfung |
| `js/storage.js` | Bestenlisten, Verlauf, Einstellungen |
| `js/i18n.js` | Alle Texte und der Aufbau der Hilfe |
| `tools/pruefung.js` | Prüfskript |
| `HILFE.md` | Wird aus `i18n.js` erzeugt, zeichengleich mit dem Hilfe-Bildschirm |
| `ios/` | XcodeGen-Projekt, Swift-Hülle, App-Symbol, Datenschutz-Manifest |
| `codemagic.yaml` | Build und Upload zu TestFlight |

Ladereihenfolge: `i18n.js`, `levels.js`, `storage.js`, `audio.js`, `game.js`, `main.js`. Alle Module hängen am globalen Objekt `BB`. Klassische Skripte statt ES-Module, weil Module bei `file://` blockiert werden.

---

## 4. Technische Kernpunkte (nicht ohne Not anfassen)

- **Taktgeber ist ausschließlich `AudioContext.currentTime`.** Kein `setInterval`, kein `Date.now()` in `game.js` und `audio.js` — Prüfung P06 erzwingt das. Die Bildschleife plant Klänge mit 200 ms Vorlauf.
- **Eingaben über `pointerdown` mit `event.timeStamp`**, abgebildet auf die Audiozeit über einen laufend gemessenen Versatz (Minimum aus den letzten 90 Bildern, weil `currentTime` blockweise springt). Vor dem Rundenstart werden mindestens zehn Abgleichproben abgewartet.
- **Kalibrierung:** 100 BPM, 4 Vorzähler, 8 Messschläge, Suchfenster ±300 ms. Der Median wird gespeichert und von jeder Messung abgezogen.
- **Hintergrund:** Die laufende Runde wird verworfen, weil sie nicht mehr fair messbar ist. Beim Wiedereintritt wird der `AudioContext` geschlossen und vollständig neu aufgebaut, einschließlich aller Klangpuffer.
- **Haptik:** `navigator.vibrate` fehlt unter iOS. `main.js` sendet die Dauer an die native Seite (`webkit.messageHandlers.vibrieren`), unter 30 ms leichter Impuls, sonst harter.
- **Ton:** Audiositzung auf `playback`, damit der Ton auch bei eingeschaltetem Stummschalter hörbar ist.
- **Keine Binärdaten im Quelltext**, keine Bild-, Audio- oder Schriftdateien im Web-Paket. Alle Klänge werden zur Laufzeit erzeugt, alle Symbole sind CSS oder Inline-SVG. Prüfungen P04 und P05.

---

## 5. Stand Build 3

`node tools/pruefung.js` → **22 Prüfungen, 22 bestanden.** Die Prüfungen sind in `tools/pruefung.js` einzeln benannt (P01 bis P22) und decken Struktur, Syntax, Latenzregeln, Beatmap-Spielbarkeit, Textschlüssel, Bewertungslogik, Bedienung, iOS-Hülle und Darstellungsregeln ab.

Zusätzlich geprüft: Gegenproben mit absichtlich eingebauten Fehlern (alle erkannt), Simulation aller 50 Runden, Rendern in Headless Chromium bei 375 × 812 und 375 × 667.

### Ausdrücklich **nicht** geprüft

Das ist die wichtigste Liste des ganzen Dokuments:

- **Swift wurde nie kompiliert, XcodeGen nie ausgeführt, Codemagic nie gestartet.** Der erste echte Nachweis ist der erste Codemagic-Build.
- **Kein echtes iPhone, kein WKWebView.** Alle Tests liefen in Chromium, nicht in WebKit. Latenz, Entsperren des Tons, Verhalten nach dem Hintergrund und Mehrfingereingabe sind ungeprüft.
- **`localStorage` über `beatbox://`** nur im Browser über HTTP nachgestellt.
- **Klänge nie angehört.** Sie laufen fehlerfrei, ob sie gut klingen, ist offen.
- **Schwierigkeitskurve nie von Menschen gespielt.** Die Simulation beweist Spielbarkeit, nicht Spielspaß.
- Sichere Bereiche auf Geräten mit Notch oder Dynamic Island nur im Code vorhanden, nie gesehen.

### Erledigt in Build 3

Der GitHub-Workflow rief einen Pfad auf, den es im Repository nicht gibt, und schlug bei jedem Push fehl. Repariert.

---

## 6. Arbeitsregeln (aus der Rechenpyramide bewährt)

1. **Validator:** `node tools/pruefung.js` muss bestanden melden. Jede neue wichtige Regel wird dort als Prüfung ergänzt, mit **eng gefasstem Geltungsbereich** — eine zu breit greifende Prüfung blockiert später legitime Änderungen.
2. **Sichtbare Änderungen rendern und ansehen** (Headless Chromium, 375 × 812 und 375 × 667), nicht nur im Code lesen. Statische Prüfungen finden keine visuellen Fehler.
3. **JS-Syntax prüfen:** `node --check` über alle Dateien.
4. **Bei Punkten, Zeit oder Fortschritt vorher in einem Satz festlegen:** abgezogen oder nur gezählt? einmalig oder wiederholbar?
5. **Batch-Ersetzungen:** Treffer vorher zählen, bei Abweichung den ganzen Lauf abbrechen statt teilweise zu schreiben. Anker müssen global eindeutig sein.
6. **Bevor etwas als Fehler eingestuft wird:** prüfen, ob es Absicht sein könnte. Gibt es UI-Elemente oder Datenfelder, die nur Sinn ergeben, wenn das aktuelle Verhalten gewollt ist?
7. **Nach Textänderungen:** `node tools/pruefung.js --hilfe-schreiben`, damit `HILFE.md` und Hilfe-Bildschirm gleich bleiben.
8. **Buildnummer:** Die Web-Buildnummer in `js/main.js` und im README muss übereinstimmen (Prüfung P19). Die iOS-Buildnummer setzt Codemagic selbst. Je Build eine `DEPLOY_BUILDxx.md`.
9. **„Fertig" heißt:** Logik + UI + alle aktiven Sprachen + Hilfe-Text + Prüfregel + Screenshot geprüft.
10. **Neue Features zuerst auf eigenem Branch**, `main` erst nach Freigabe. Mehrere Ausbaustufen dürfen in einem Build gebündelt werden.
11. **Am Ende jeder Änderung ausdrücklich sagen, was geprüft wurde und was nicht geprüft werden konnte.**

---

## 7. CI/CD

- **Codemagic**, Workflow `ios-testflight` („BeatBox iOS TestFlight"), `mac_mini_m2`. Erster Schritt ist `node tools/pruefung.js --release`; er bricht ab, solange Platzhalter übrig sind. Danach XcodeGen, Signierprofile, Buildnummer aus der letzten TestFlight-Nummer plus 1, Build, Upload.
- Der Name des App-Store-Connect-API-Schlüssels steht in `codemagic.yaml` als `BeatBox API-Schluessel` und muss in Codemagic genauso heißen.
- **GitHub Actions** `.github/workflows/validate.yml` läuft bei jedem Push, ist aber zurzeit defekt (siehe Abschnitt 5).

---

## 8. Offene Punkte (Öner)

1. Codemagic: Anwendung aus dem Repository hinzufügen, API-Schlüssel unter dem Namen `BeatBox API-Schluessel` anlegen, Signierzertifikat und App-Store-Profil für `de.LaraJade.beatbox` hinterlegen.
2. Apple Developer: App-ID `de.LaraJade.beatbox` registrieren, falls noch nicht geschehen.
3. App Store Connect: Eintrag zur Apple-ID `6814647151` prüfen (Name, Primärsprache, SKU).
4. Datenschutz- und Support-URL für den Store-Eintrag.
5. Ersten TestFlight-Build auf dem iPhone durchspielen — das ist der einzige Weg, die Latenz und den Ton zu beurteilen.

---

## 9. Entscheidungen vom 10.10.2026

- **Zielgruppe: Kinder.** Kinder-Kategorie im App Store, Altersband noch festzulegen (6 bis 8 oder 9 bis 11). Tonfall und Farbwelt entsprechend.
- **Alle zwölf Sprachen** kommen in den ersten Store-Build, nicht nur Deutsch und Englisch.
- **Name: Boxolo.** Untertitel „Reaktion und Rhythmus für Kinder" / „Reaction and rhythm for kids". Nur über Websuche geprüft, nicht über DPMA, EUIPO oder TMview.
- **Build 3 ist gebaut:** Name, alle zwölf Sprachen, GitHub-Workflow. Einzelheiten in `DEPLOY_BUILD3.md`.

### Noch offen

1. **Markenprüfung Boxolo** in DPMAregister, EUIPO eSearch und TMview, Klassen 9 und 28.
2. **Altersband** in App Store Connect: 6 bis 8 oder 9 bis 11 Jahre.
3. **Musik.** Zurzeit nur erzeugte Klänge. Richtige Musikstücke wären spürbar besser, brauchen aber eine saubere Lizenz und würden die Regel „keine Audiodateien im Paket" aufheben.
4. **Muttersprachliche Prüfung der elf Übersetzungen**, besonders Japanisch, Chinesisch, Arabisch und Türkisch. Sie sind maschinell erstellt und nicht gegengelesen.
5. **Android.** Später über eine Kotlin-WebView-Hülle möglich, wie bei der Rechenpyramide geplant.

---

## 10. Erster Arbeitsschritt in einem neuen Chat

Antworte zuerst mit:

- **A.** Gefundener Ist-Zustand (aus dem Code, nicht aus dieser Datei)
- **B.** Was bereits sauber umgesetzt ist und nicht angefasst werden sollte
- **C.** Welche Risiken für Regressionen du siehst
- **D.** Welche Dateien du für die anstehende Aufgabe konkret anfassen würdest
- **E.** Vorschlag für den Zuschnitt des nächsten Builds

Erst danach bauen.
