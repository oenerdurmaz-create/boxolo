# BeatBox – Reaktionsspiel (Build 2)

Sechs Trefferzonen in Boxnotation, fünf Modi, je zehn Level. Das Web-Paket ist reines HTML, CSS und JavaScript ohne Bibliotheken, ohne Build-Schritt, ohne Server; `index.html` im Browser öffnen genügt. Die iOS-Hülle in `ios/` bettet es unverändert in eine App mit WKWebView ein, `codemagic.yaml` baut daraus einen TestFlight-Build.

**Build 2:** iOS-Hülle (XcodeGen-Projekt, Swift, App-Symbol, Datenschutz-Manifest), Codemagic-Ablauf, Haptik-Brücke und Audiositzung im Web-Paket, Prüfung P22.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Gerüst aller Bildschirme, enthält keinen sichtbaren Text |
| `css/style.css` | Darstellung, sichere Bereiche, Zonen, Ringe |
| `js/main.js` | Oberfläche, Eingabe (`pointerdown`), Bildschleife, Hintergrund-Behandlung |
| `js/audio.js` | Web-Audio-Engine, Takt-Uhr, Klangerzeugung, Uhrabgleich |
| `js/game.js` | Bewertung, fünf Modi, Kalibrierung – ohne DOM-Zugriff |
| `js/levels.js` | Stellschrauben, Beatmap-Generator, Spielbarkeitsprüfung |
| `js/storage.js` | Bestenlisten, Verlauf, Einstellungen in `localStorage` |
| `js/i18n.js` | Alle Texte und der Aufbau der Hilfe |
| `tools/pruefung.js` | Prüfskript, `node tools/pruefung.js` |
| `HILFE.md` | Hilfe, wird aus `i18n.js` erzeugt und ist zeichengleich mit dem Hilfe-Bildschirm |
| `ios/project.yml` | Beschreibung des Xcode-Projekts für XcodeGen |
| `ios/BeatBox/SpielViewController.swift` | Vollbild-WKWebView, Navigationssperre, Haptik |
| `ios/BeatBox/WebDateiHandler.swift` | Liefert das Web-Paket über `beatbox://localhost/` aus |
| `ios/BeatBox/AppDelegate.swift`, `SceneDelegate.swift`, `Audiositzung.swift` | App-Start, Fenster, Audiositzung |
| `ios/BeatBox/Assets.xcassets` | App-Symbol 1024 × 1024, Farbe des Startbildschirms |
| `ios/BeatBox/PrivacyInfo.xcprivacy` | Datenschutz-Manifest: kein Tracking, keine Datenerhebung |
| `codemagic.yaml` | Build und Upload zu TestFlight |

Ladereihenfolge: `i18n.js`, `levels.js`, `storage.js`, `audio.js`, `game.js`, `main.js`. Alle Module hängen sich an das globale Objekt `BB`.

## Entscheidungen

Der Auftrag verlangte, offene Punkte selbst zu entscheiden. Das habe ich so gelöst:

**Sprachen.** Abweichend vom Auftrag (Deutsch und Englisch) ist nach Vorgabe nur Deutsch aktiv, die Struktur ist auf zwölf Sprachen ausgelegt: `de, en, fr, es, it, pt, nl, pl, tr, ar, ja, zh` stehen als geplanter Umfang in `i18n.js`. Eine Sprache wird aktiv, sobald sie in `SPRACHEN` steht; der Sprachumschalter in den Einstellungen listet dann automatisch alle aktiven Sprachen. Jede Sprache trägt Leserichtung und Locale; `main.js` setzt `lang` und `dir` am Dokument, Zahlen stehen in isolierten Elementen (`unicode-bidi: isolate`), Zahlen und Datum werden über `Intl` formatiert. Das Prüfskript verlangt in jeder aktiven Sprache identische Schlüssel und identische Platzhalter. Einheiten hängen mit geschütztem Leerzeichen am Wert.

**Klassische Skripte statt ES-Module.** Module werden bei `file://` in Chromium blockiert. Klassische Skripte laufen im Browser, in WKWebView und im Prüfskript (Node `vm`) gleich.

**Taktgeber.** Spielzeit ist ausschließlich `AudioContext.currentTime`. Die Bildschleife (`requestAnimationFrame`) plant Klänge mit 200 ms Vorlauf ein; es gibt kein `setInterval`. Für Eingaben wird `event.timeStamp` (Zeitbasis `performance`) über einen gemessenen Versatz auf die Audiozeit abgebildet. Der Versatz ist das Minimum von `performance.now() − currentTime` über die letzten 90 Bilder, weil `currentTime` blockweise springt. Vor dem Rundenstart wird gewartet, bis mindestens zehn Abgleichproben vorliegen.

**Kalibrierung.** 100 BPM, 4 Vorzähler, 8 Messschläge, Suchfenster ±300 ms, mindestens 6 erfasste Schläge. Der Median wird gespeichert und von **jeder** Messung abgezogen, wie im Auftrag gefordert – auch im Modus Reaktion. Physikalisch misst die Kalibrierung vor allem den Ton- und Berührungsweg; im Modus Reaktion zählt der Bildweg. Damit der Wert dort nicht völlig fremd ist, blinkt die Kalibrierfläche zu jedem Schlag mit.

**Bewertung.** Das Levelfenster begrenzt die Tabelle nach außen: Bei ±70 ms (Level 10) gibt es Perfekt und Gut, alles darüber ist Daneben. „Erreichter Serienmultiplikator“ in der Endpunktzahl ist der **höchste** in der Runde erreichte. Der Ergebnisbildschirm zeigt die Formel mit den eingesetzten Werten. Sterne: 1 ab 60 %, 2 ab 80 %, 3 ab 95 % Trefferquote. Levelfaktor 1,0 (Level 1) bis 1,9 (Level 10). Punkte werden ausschließlich gezählt, niemals abgezogen.

**Modus Reaktion.** Ohne Takt gibt es keinen Sollzeitpunkt; deshalb eigene Schwellen: Perfekt bis 350 ms, Gut bis 500 ms, Ok bis zum Zeitlimit des Levels (1200 ms in Level 1 bis 700 ms in Level 10). Unter 100 ms oder vor dem Aufleuchten gilt als Fehlstart. Pausen zwischen den Zielen 1,0 bis 2,6 s, bei jedem Start neu ausgewürfelt und vor dem Start geprüft.

**Modus Kombination.** Die Folge wird vorgeführt (Zonen leuchten, eigener Ton je Zone), dann folgt ein Los-Signal, danach wird auf einen Klick pro Schlag geschlagen. Jeder Schlag wird gegen seinen Klick bewertet. Jedes Daneben, jede falsche Zone und jedes Störziel beendet die Folge und die Serie; nicht mehr geschlagene Ziele zählen als nicht getroffen. Acht Folgen je Level, passende Standardfolgen zuerst.

**Modus Rhythmus.** Ruf und Antwort: Im ersten Takt wird die Folge vorgespielt, im zweiten mit Ringen nachgeschlagen. Ab Level 5 Achtel, in Level 9 und 10 Sechzehntel – aber nur, wenn die beiden Schläge auf gegenüberliegenden Hälften liegen.

**Modus Ausdauer.** Ringe wie im Modus Timing, Tempo +8 BPM alle 10 Sekunden (Level 10: 160 bis 200 BPM). Die Beat-Positionen stehen in Grund-BPM in der Beatmap, damit der Prüfer ohne Tempotabelle rechnen kann.

**Tipps ohne Ziel.** Ein Tipp auf eine aktive Zone ohne nahes Ziel ist ein Fehltipp: Die Serie endet, es wird kein Ziel verbraucht. Tipps auf inaktive Zonen werden ignoriert. Liegt ein Ziel derselben Zone innerhalb von 250 ms, wird es verbraucht und mit Vorzeichen als Daneben gewertet.

**Störziele.** Rot gestreift bzw. gestrichelter roter Ring, beschriftet mit „✕ Nicht treffen“. Sie zählen nicht als Ziel, beenden beim Treffen aber die Serie. Nie auf der Zone einer echten Note innerhalb von 300 ms.

**Ringe.** Der Ring startet 2 Beats (mindestens 0,8 s) vor dem Sollzeitpunkt mit 24 Punkten Überstand und liegt zum Sollzeitpunkt genau auf dem Zonenrand. Der Überstand ist in Punkten fest, damit der Ring auf keinem Gerät über den Rand läuft.

**Hintergrund.** Geht die App in den Hintergrund, wird die laufende Runde verworfen, weil sie nicht mehr fair messbar ist. Beim Wiedereintritt wird der `AudioContext` geschlossen und vollständig neu aufgebaut, einschließlich aller Klangpuffer. Das Menü zeigt oben einen Hinweis. Der neue Kontext wird beim nächsten Tipp auf „Runde starten“ entsperrt.

**Bestenlisten und Verlauf.** Zehn Einträge je Modus und Level. Der Name kommt aus den Einstellungen (Standard „Spieler“), damit nach der Runde kein Eingabefeld nötig ist. „Ø ms“ ist im Modus Reaktion die Reaktionszeit, sonst die mittlere Abweichung vom Takt. Der Verlauf zeigt nur den Modus Reaktion, weil nur dort echte Reaktionszeit gemessen wird.

**Hilfe.** Hilfe-Bildschirm und `HILFE.md` entstehen aus denselben Bausteinen; Zahlen wie Fenster und Punkte werden aus `game.js` und `levels.js` eingesetzt. Nach Textänderungen: `node tools/pruefung.js --hilfe-schreiben`.

**iOS: Projekt aus XcodeGen.** Das Xcode-Projekt wird aus `ios/project.yml` erzeugt, in Codemagic bei jedem Build und auf einem Mac mit `cd ios && xcodegen generate`. Die erzeugte `BeatBox.xcodeproj` wird nicht eingecheckt (`.gitignore`); so gibt es genau eine lesbare Quelle und keine unprüfbare Projektdatei.

**iOS: eigenes URL-Schema.** Die Web-Dateien liegen im App-Bundle und werden über `beatbox://localhost/` ausgeliefert, nicht über `file://`. Das gibt der Seite eine stabile Herkunft, damit `localStorage` dauerhaft erhalten bleibt (dasselbe Verfahren nutzt Capacitor). Ausgeliefert werden nur `index.html`, `css/` und `js/`; Navigation zu anderen Adressen wird abgebrochen. Die App enthält keinen Netzwerkzugriff.

**iOS: Haptik und Ton.** `navigator.vibrate` fehlt unter iOS. `js/main.js` sendet deshalb in der App die Dauer an die native Seite (`webkit.messageHandlers.vibrieren`): unter 30 ms leichter Impuls (Treffer), sonst harter Impuls (Fehler). Die Audiositzung steht auf `playback`, damit der Ton auch bei eingeschaltetem Stummschalter zu hören ist – für ein Rhythmusspiel ist er spielentscheidend. `js/audio.js` setzt zusätzlich `navigator.audioSession.type`, wo WebKit es kennt.

**iOS: Darstellung.** Nur iPhone, nur Hochformat, ab iOS 16. Statusleiste und Home-Balken ausgeblendet, Randgesten verzögert, damit ein Wischen am Rand keine Runde beendet. Die Webansicht reicht bis unter die Aussparungen (`contentInsetAdjustmentBehavior = .never`); die sicheren Bereiche übernimmt das CSS über `env(safe-area-inset-*)`. Hintergrund in der Spielfarbe, damit beim Start nichts weiß aufblitzt.

**iOS: Buildnummer.** Codemagic setzt sie auf die letzte TestFlight-Nummer plus 1 (`agvtool`, dafür `VERSIONING_SYSTEM = apple-generic`). Die Versionsnummer für Nutzer (1.0) steht in `project.yml`. Die Web-Buildnummer in `js/main.js` zählt davon getrennt die Stände des Web-Pakets.

**Level erweitern.** `EIGENE_BEATMAPS` in `levels.js` nimmt handgeschriebene Beatmaps auf und ersetzt das generierte Level mit gleicher `id`. Jede Beatmap durchläuft vor dem Start `pruefeBeatmap()`.

## Geprüft

`node tools/pruefung.js` – 22 Prüfungen, alle bestanden, auch aus dem entpackten ZIP heraus:

1. Struktur vollständig, keine leeren Dateien
2. Syntax aller JavaScript-Dateien
3. Keine externen URLs, alle lokalen Verweise existieren
4. Keine Base64-Blöcke
5. Keine Bild-, Audio- oder Schriftdateien im Web-Paket (die iOS-Hülle ist ausgenommen, sie braucht ein App-Symbol)
6. Kein `setInterval`, kein `Date.now()` in `game.js` und `audio.js`; keine eigene Uhr in `game.js`
7. Alle Beatmaps spielbar, geprüft von einem eigenen Prüfer im Prüfskript **und** vom Prüfer in `levels.js`; 300 Zufallsläufe je Reaktionslevel; Gegenproben (Zone 7, Zone 0, 100 ms gleiche Seite, 100 ms gegenüber, genau 120 ms, Störziel auf Notenzone)
8. Stellschrauben von Level 1 und 10 exakt laut Auftrag, Schwierigkeit steigt stetig, alle Standardfolgen vorhanden
9. Textschlüssel und Platzhalter vollständig, jeder genutzte Schlüssel existiert
10. Kein sichtbarer Text in `index.html`, keine Sätze in Oberflächen-JavaScript
11. Kein Freischaltungs- oder Sperrfeld, kein Schloss-Symbol
12. `HILFE.md` zeichengleich mit dem Hilfe-Bildschirm, alle Modi, Zonen, Urteile und der Bluetooth-Hinweis enthalten
13. Bewertungsgrenzen, Multiplikator, Endpunktzahl, Quote, Sterne, Median
14. Simulation aller 50 Runden mit Test-Spielern: fehlerfrei ergibt 100 %, untätig ergibt 0 Punkte, Störziele werden gezählt, falsche Zone beendet die Folge, Punkte sinken nie
15. `pointerdown` mit `event.timeStamp`, Klangpuffer vorab, Neuaufbau nach Hintergrund, Kalibrierung per Median, Haptik-Brücke
16. `touch-action`, sichere Bereiche, keine Textauswahl, kein Überscrollen, Zonen ≥ 64 × 64
17. Kein Netzwerk, `localStorage` nur in `storage.js`
18. Punkte nur gezählt, keine Währungsbegriffe
19. Buildnummer in `main.js` und README gleich
20. README vollständig
21. Darstellungsregeln aus der Screenshot-Kontrolle (fester Ringüberstand, Aufblitzen als Fläche, Hinweis oben, geschützte Leerzeichen)
22. iOS-Hülle: alle Dateien vorhanden; Bundle-ID in `project.yml` und `codemagic.yaml` gleich; jede Datei, die `index.html` lädt, wird vom Schema-Handler ausgeliefert; Name der Haptik-Nachricht auf beiden Seiten gleich; kein Netzwerkzugriff im Swift-Code; Klammern ausgeglichen; App-Symbol 1024 × 1024 ohne Alphakanal; Pflichtangaben im Info.plist; Codemagic führt das Prüfskript aus. Mit `--release` (so in `codemagic.yaml`) sind nicht ersetzte Platzhalter ein Fehler.

Zusätzlich außerhalb des Pakets:

* Gegenproben gegen das Prüfskript: sieben absichtlich eingebaute Fehler (setInterval, Schloss-Symbol, fehlender Schlüssel, externe URL, Sperrfeld, Zone 7, Punktabzug) wurden alle erkannt.
* Headless Chromium bei 375 × 812 und 375 × 667: alle Bildschirme gerendert und angesehen, keine Konsolenfehler; eine komplette Reaktionsrunde automatisch durchgespielt; Kalibrierung mit bekannter Tippverzögerung (0, 40, 90 ms) ergab 18, 48 und 93 ms, also Verzögerung plus höchstens ein Bild; Hintergrund und Rückkehr simuliert, `AudioContext` danach wieder im Zustand `running`.
* Zonen auf 375 × 667: 164 × 166 Punkte.
* Build 2: Gegenproben gegen P22 (abweichende Bundle-ID, App-Symbol mit Alphakanal, falscher Nachrichtenname, fehlende Klammer, Netzadresse im Swift-Code, unvollständige Pfadliste, Platzhalter im Release-Modus) wurden alle erkannt. Browsertest über HTTP statt `file://` mit nachgebildeter `webkit`-Brücke: Fehlstart sendet 40, Treffer 12, `localStorage` bleibt nach Neuladen erhalten, keine Konsolenfehler. `project.yml`, `codemagic.yaml`, alle JSON-Dateien und das Datenschutz-Manifest sind syntaktisch gültig.

## Nicht geprüft

Diese Punkte konnte ich **nicht** prüfen:

* **Swift nicht kompiliert, XcodeGen nicht ausgeführt, Codemagic nicht gestartet.** Ohne Mac gibt es hier keinen Swift-Compiler für iOS. Die Swift-Dateien sind sorgfältig geschrieben und grob geprüft (P22), der erste echte Nachweis ist der erste Codemagic-Build.
* **`localStorage` über `beatbox://`** ist nur im Browser über HTTP nachgestellt, nicht in einer echten WKWebView.
* **Audiositzung:** Ob WKWebView den Ton bei eingeschaltetem Stummschalter tatsächlich wiedergibt, hängt von der iOS-Version ab und ist ungeprüft.

* **Kein echtes iPhone, kein WKWebView.** Alle Browsertests liefen in Chromium, nicht in WebKit. Latenz, Entsperren des Tons, Verhalten nach dem Hintergrund und Mehrfingereingabe müssen auf dem Gerät bestätigt werden.
* **Klänge nicht angehört.** Die Klangerzeugung läuft fehlerfrei, ob Kick, Snare, Hi-Hat und Zonentöne gut klingen, ist ungeprüft.
* **Vibration im Browser auf dem iPhone:** In Safari gibt es weiterhin keine Vibration; in der App übernimmt die Haptik-Brücke.
* **Schrift:** Die vorgesehene Schrift „Avenir Next Condensed“ gibt es nur auf Apple-Geräten; die Screenshots zeigen die Ersatzschrift.
* **Sichere Bereiche auf Geräten mit Notch oder Dynamic Island** nicht gesehen, nur im Code vorhanden.
* **Echte Menschen** haben die Schwierigkeitskurve nicht gespielt. Die Simulation beweist Spielbarkeit, nicht Spielspaß.
* Weitere Sprachen außer Deutsch existieren noch nicht.

## Testanleitung

**Im Browser öffnen.** Ordner entpacken und `boxreaktion/index.html` per Doppelklick öffnen. Am Rechner in den Entwicklerwerkzeugen die Gerätesimulation (z. B. iPhone, 375 Punkte breit) einschalten. Modus und Level wählen, „Runde starten“ tippen. Ton muss eingeschaltet sein.

**Kalibrieren.** Im Menü „Kalibrieren“ oder die Zeile „Kalibrierung: …“ antippen, am besten mit Lautsprecher oder Kabelkopfhörer. „Messung starten“, vier Vorzähler abwarten, dann die acht folgenden Schläge auf der runden Fläche mittippen. Der Wert erscheint danach im Menü. „Auf 0 ms zurücksetzen“ löscht ihn.

**Prüfskript.** Mit Node (ab Version 16) im Ordner `boxreaktion`: `node tools/pruefung.js`. Rückgabewert 0 heißt alles bestanden. Nach Textänderungen zuerst `node tools/pruefung.js --hilfe-schreiben`. Optional `--build=1` prüft die erwartete Buildnummer.

### iOS-Build in Codemagic einrichten

Einmalig, in dieser Reihenfolge:

1. **Bundle-ID festlegen**, z. B. `de.deinname.beatbox`, und in `ios/project.yml` (`PRODUCT_BUNDLE_IDENTIFIER`) und `codemagic.yaml` (`bundle_identifier`) eintragen. P22 prüft, dass beide gleich sind.
2. **Apple Developer:** unter Certificates, Identifiers & Profiles eine App-ID mit genau dieser Bundle-ID anlegen.
3. **App Store Connect:** unter Apps eine neue App mit dieser Bundle-ID anlegen. Unter App-Informationen steht die **Apple-ID** (eine Zahl) – sie kommt in `codemagic.yaml` als `APP_STORE_APPLE_ID`.
4. **API-Schlüssel:** In App Store Connect unter Benutzer und Zugriff → Integrationen einen App-Store-Connect-API-Schlüssel mit der Rolle App-Manager erzeugen. In Codemagic unter Integrationen → Developer Portal hinzufügen. Den dort vergebenen Namen in `codemagic.yaml` bei `app_store_connect:` eintragen.
5. **Signierung:** In Codemagic unter Code signing identities ein iOS-Distributionszertifikat erzeugen oder hochladen und das App-Store-Profil für die Bundle-ID abrufen.
6. **Starten:** Anwendung in Codemagic hinzufügen, `codemagic.yaml` wird erkannt, Workflow „BeatBox iOS TestFlight“ starten. Der erste Schritt ist `node tools/pruefung.js --release`; er bricht ab, solange Platzhalter übrig sind.

Auf einem Mac lokal: `brew install xcodegen`, dann `cd ios && xcodegen generate` und `BeatBox.xcodeproj` in Xcode öffnen.
