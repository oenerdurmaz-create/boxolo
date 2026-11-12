# Boxolo – Arbeitsregeln für Claude

Kinder-Reaktionsspiel für iPhone (früher BeatBox). Web-Paket (HTML/CSS/JS) in einer nativen iOS-Hülle.

## Zuerst lesen
1. `claude/Uebergabe-BeatBox.md` – Stand, Spielregeln, Technik, offene Punkte
2. `README.md` – Aufbau und Dateien

## Regeln
- **Nie direkt auf `main` pushen.** Jeder Push auf `main` startet automatisch einen TestFlight-Build in Öners Codemagic-Konto. Immer auf eigenem Branch arbeiten und einen Pull Request öffnen; zusammengeführt wird erst nach Absprache mit Öner.
- Vor jedem Commit: `node tools/pruefung.js` – alle Prüfungen müssen bestehen.
- Alle Level und Modi bleiben frei wählbar: keine Schlösser, keine Freischaltketten (App-Store-Regel 5.6, frühere Ablehnung).
- Zeitmessung nur über die Audio-Uhr (`AudioContext.currentTime`) und `event.timeStamp`; kein `setInterval`/`Date.now` im Spielablauf.
- Jeder neue Text kommt in alle 12 Sprachen (`js/i18n.js`), dazu Hilfe-Text. Die Übersetzungen sind maschinell, nicht von Muttersprachlern geprüft.
- Zielgruppe sind Kinder: kurze Texte, keine Strafen, kein Rot für „zu langsam".
- Fertig heißt: Logik, Oberfläche, Texte in 12 Sprachen, Hilfe, Prüfregel, Bildschirmfoto angesehen.
- `ios/project.yml` behält `name: BeatBox` (passt zum Pfad in `codemagic.yaml`).

## Nicht ins Repository
API-Schlüssel, Zertifikate, Passwörter. Signierung läuft nur über Codemagic.

## Absprache
Öner und Martin arbeiten nicht gleichzeitig an denselben Dateien. Vor größeren Änderungen kurz klären, wer was übernimmt.
