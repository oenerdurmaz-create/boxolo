# QA-Report — BeatBox Build 1

Datum: 2026-09-21 · Umfang: Erststand (Web-Paket + iOS-Hülle + CI)

## Automatisierte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `node --check` alle 7 JS-Dateien | PASS |
| `node boxreaktion/tools/pruefung.js` | 12/12 PASS |
| Dateistruktur vollständig, keine leeren Dateien | PASS |
| Keine externen URLs / kein Base64 | PASS |
| `setInterval`/`Date.now` in game.js, audio.js | PASS (nicht vorhanden) |
| 50 Level/Beatmaps spielbar | PASS |
| i18n DE/EN deckungsgleich | PASS |
| Keine Freischaltungsfelder / Schloss-Symbole | PASS |
| Alle 5 Modi in der Hilfe (DE+EN) | PASS |
| codemagic.yaml / validate.yml / devcontainer.json | PASS (Parser) |

## Manuelle Prüfungen — offen (vorm Release erforderlich)

- [ ] Spiel auf iPhone (Safari): alle 5 Modi, 2–3 Level je Modus
- [ ] Kalibrierung plausibel, wird abgezogen
- [ ] Ton kehrt nach App-Wechsel zurück
- [ ] TestFlight-Build auf Gerät installiert
- [ ] Hilfe-Bildschirm = HILFE.md (Gegenprobe)
- [ ] Screenshot-Kontrolle jeder Ansicht

## Bekannte Einschränkungen

- Xcode-Projekt nicht gebaut (kein macOS); erstes `xcodegen && xcodebuild`
  in Codemagic prüft die Hülle.
- Team-ID / Bundle-ID sind Platzhalter (vor Build 2 ersetzen).
