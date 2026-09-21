BeatBox — Web-Paket (Build 1)

Reaktionsspiel für iPhone (Hochformat): Sechs Trefferzonen in Boxnotation, fünf Modi,zehn offene Level je Modus. Das Paket ist für die spätere Einbettung in eine iOS-Appmit WKWebView gebaut und läuft ohne Server: index.html direkt im Browser öffnen.



Aufbau

boxreaktion/

index.html Oberfläche, alle Bildschirme

css/style.css dunkles Design, Safe-Areas, Zonenraster

js/main.js Navigation, Eingabe (pointerdown), Bildschirmtakt, SVG-Verlauf

js/audio.js Web-Audio-Engine, Takt-Uhr, synthetisierte Klänge

js/game.js Spiellogik, Bewertung, fünf Modi

js/levels.js 50 Beatmaps + Laufzeit-Validierung

js/storage.js Bestenlisten, Verlauf, Einstellungen (nur localStorage)

js/i18n.js alle Texte, Deutsch und Englisch

tools/pruefung.js Prüflauf: node tools/pruefung.js

HILFE.md Hilfe, identisch zum Hilfe-Bildschirm

README.md dieses Dokument

