# BeatBox

Fingerschlag-Reaktionsspiel für iOS: Web-Paket (`boxreaktion/`) in einer nativen
WKWebView-Hülle (`ios/`), gebaut und zu TestFlight geladen über Codemagic,
entwickelt in GitHub Codespaces.

## Schnellstart

1. **Codespaces**: Repository öffnen → Code → Codespaces → Create.
   Der Container führt automatisch `pruefung.js` aus.
2. **Lokal**: `cd boxreaktion && python3 -m http.server 8000`
3. **Prüfung vor jedem Commit**: `node boxreaktion/tools/pruefung.js`

## Release zu TestFlight

1. Platzhalter ersetzen: `ios/project.yml` (Bundle-ID), `ios/exportOptions.plist`
   (Team-ID), `ios/fastlane/Appfile`.
2. Apple Developer: App ID `de.beatbox.game` anlegen, Distribution-Zertifikat
   + App-Store-Profil erzeugen.
3. Codemagic: Repo verbinden, Environment-Gruppe `appstore-connect` mit API-Key
   (Issuer ID, Key ID, Private Key aus App Store Connect) + Code-Signing hinterlegen.
4. Tag pushen: `git tag v1.0.1 && git push origin v1.0.1`
   → Codemagic prüft, baut, exportiert, lädt zu TestFlight hoch.
5. GitHub Actions prüft zusätzlich jeden Push/PR.

## Getroffene Entscheidungen

- **Bundle-ID**: `BeatBox` (Projektregeln) ist keine gültige reverse-Domain-ID.
  Platzhalter: `de.beatbox.game`.
- **XcodeGen statt eingechecktem .xcodeproj**: keine Binärdateien im Repo.
- **Urteilsgrenzen** 31/62/100 % des Level-Trefferfensters (±130 → ±70 ms).
- **Multiplikator** am Ende auf die Punktesumme (Formel aus dem Auftrag).
- **Eingabe-Zeitstempel**: `event.timeStamp`, umgerechnet in Audio-Zeit;
  Restfehler absorbiert die Kalibrierung.

## Nicht geprüft (kein Gerät/Apple-Account verfügbar)

Spiel in Safari/WKWebView auf Hardware, Audio-Latenz auf Gerät,
Codemagic-Pipeline/Code-Signing, `xcodebuild`-Lauf (kein macOS).

## Release-Konventionen

    BeatBox-Build<N>-GitHub-Code.zip
    BeatBox-Build<N>-SHA256.txt
    QA_REPORT_BUILD<N>.md
