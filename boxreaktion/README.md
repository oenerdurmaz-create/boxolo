# BeatBox (boxreaktion)

Vollstaendiges, lauffaehiges Web-Spiel-Paket. Keine externen Bibliotheken, kein CDN,
kein Build-Schritt. `index.html` im Browser oeffnen genuegt — beispielsweise mit:

    python3 -m http.server 8000
    # dann http://localhost:8000 oeffnen

Das Paket wird unveraendert als Ressourcen-Bundle in eine iOS-App mit WKWebView
eingebettet (siehe `../ios` und das Projektwurzel-README). Es setzt nichts voraus,
was ein Server liefern muesste.

## Struktur

    boxreaktion/
      index.html        Einstieg, alle Bildschirme
      css/style.css     dunkles Farbschema, Hochformat, Safe-Area
      js/main.js        Bildschirmverwaltung, Eingabe, Render-Loop, Kalibrierung
      js/audio.js       Web-Audio-Engine, Takt-Uhr (AudioContext.currentTime), Klaenge
      js/game.js        Spiellogik, Bewertung, fuenf Modi
      js/levels.js      50 Level (5 Modi x 10) als Daten, inkl. Spielbarkeitspruefung
      js/storage.js     Bestenlisten und Verlauf in localStorage
      js/i18n.js        alle Textbausteine Deutsch und Englisch
      tools/pruefung.js automatisches Pruefskript (Node, ohne Abhaengigkeiten)
      HILFE.md          Spielerklaerung, identisch zum Hilfe-Bildschirm
      README.md         diese Datei

## Testanleitung

1. Browser oeffnen (idealerweise Safari auf dem iPhone oder ein WebKit-Nachbau).
2. `index.html` oeffnen beziehungsweise lokalen Server starten (siehe oben).
3. Im Menü einen Modus und ein Level waehlen — alle Level sind frei waehlbar.
4. Vor den ersten Messungen die Kalibrierung durchfuehren
   (Menü → Kalibrierung): achtmal im Takt auf eine Zone tippen.
   Bluetooth-Kopfhörer verzoegern den Ton um 100–200 ms — kabelgebundene
   Wiedergabe oder Lautsprecher gibt genauere Werte.
5. `node tools/pruefung.js` vor jedem Release laufen lassen.

## Technische Grundlagen

- Taktgeber ist ausschliesslich `AudioContext.currentTime`. Kein `setInterval`,
  kein `Date.now()` in der Spiellogik (`game.js`, `audio.js`) — per Pruefskript belegt.
- Eingaben ueber `pointerdown`; als Zeitstempel dient `event.timeStamp`
  (gleiche Zeitbasis wie `performance.now()`), umgerechnet in die Audio-Zeit.
- Klangpuffer werden beim Start vorab erzeugt; alle Klaenge sind synthetisch
  (Kick, Snare, Hi-Hat, Treffer, Fehlschlag, Metronom). Keine Audiodateien,
  keine Bilddateien, kein Base64.
- Beim Wiedereintritt in den Vordergrund wird der `AudioContext` geschlossen und
  vollstaendig neu aufgebaut — nur Anhalten/Fortsetzen laesst den Ton in
  WKWebView stumm.

## Getroffene Entscheidungen

- Urteilsgrenzen: Perfekt/Gut/Ok liegen bei 31 % beziehungsweise 62 % beziehungsweise
  100 % des Level-Trefferfensters, damit das Fenster (±130 bis ±70 ms) die
  Bewertung sauber skaliert.
- Der Serienmultiplikator wird am Ende auf die Punktesumme angewendet
  (Formel aus der Auftragsdatei), nicht schrittweise pro Treffer.
- Modus Kombination: fuenf Folgen pro Lauf; ab der zweiten Runde kann sich die
  Folge um einen Schlag verlaengern.
- Alle Level werden zur Laufzeit aus den Zahlenwerten in `levels.js` erzeugt;
  die Datei bleibt ohne Codeaenderung erweiterbar, ein deterministischer
  Zufallszahlengenerator haelt die Level reproduzierierbar.

## Nicht geprueft werden konnte hier

- Tatsaechliche Audio-Latenz und `outputLatency` auf echter Geraetehardware —
  dafuer ist die Kalibrierung vorgesehen.
- Bildrate und Touch-Verhalten in WKWebView auf einem physischen Geraet.
- Das Verhalten nach dem App-Wechsel (`visibilitychange`) nur plausibilisiert,
  nicht auf einem Geraet gemessen.
