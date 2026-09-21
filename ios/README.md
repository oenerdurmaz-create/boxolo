# BeatBox — iOS-App (WKWebView-Huelle)

Dieser Ordner verpackt das Web-Paket `../boxreaktion` als native iOS-App.
Das Projekt wird mit [XcodeGen](https://github.com/yonsm/XcodeGen) erzeugt —
das `.xcodeproj` wird NICHT ins Repository eingecheckt, sondern bei jedem Build
frisch generiert (keine Binaerdateien im Repo).

## Lokales Bauen

    cd ios
    brew install xcodegen
    xcodegen
    open BeatBox.xcodeproj

## Vor dem ersten Release anpassen

1. `project.yml`: `bundleIdPrefix` und `PRODUCT_BUNDLE_IDENTIFIER` auf deine
   Domain aendern (Platzhalter: `de.beatbox.game`).
2. `exportOptions.plist`: `teamID` eintragen.
3. `fastlane/Appfile`: Apple-ID und ITC-Team-ID eintragen (nur fuer Fastlane-Fallback).
4. Im Apple-Developer-Portal: App ID anlegen, Distribution-Zertifikat und
   App-Store-Provisioning-Profil erzeugen (oder "Automatically manage signing"
   im Xcode-Projekt aktivieren).

## Ablauf im Detail

1. GitHub-Repo pushen, Tag `v1.0.1` setzen.
2. Codemagic (siehe `../codemagic.yaml`) laeuft auf macOS:
   `pruefung.js` → `xcodegen` → Archiv → Export → Upload zu TestFlight.
3. In App Store Connect: Build in TestFlight pruefen, Tester einladen.

## Audio-Verhalten

Das Spiel baut den `AudioContext` bei `visibilitychange` selbst vollstaendig neu
(siehe `boxreaktion/js/audio.js`). Die Swift-Huelle laedt die Seite nach einem
App-Wechsel nur nach, falls WKWebView keine URL mehr hat.
