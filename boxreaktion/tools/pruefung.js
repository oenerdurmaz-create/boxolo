#!/usr/bin/env node
/* BeatBox — automatisches Pruefskript. Laeuft ohne Abhaengigkeiten:
     node tools/pruefung.js
   Ausgabe: Anzahl bestandener und fehlgeschlagener Pruefungen.
   Rueckgabewert ungleich null bei Fehlern. */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.join(__dirname, "..");
var bestanden = 0;
var fehlgeschlagen = 0;

function pruefung(name, ok, detail) {
  if (ok) {
    bestanden += 1;
    console.log("PASS  " + name);
  } else {
    fehlgeschlagen += 1;
    console.log("FAIL  " + name + (detail ? "  -> " + detail : ""));
  }
}

function lies(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/* 1. Alle Dateien der Struktur vorhanden, keine leeren Dateien. */
var STRUKTUR = [
  "index.html",
  "css/style.css",
  "js/main.js",
  "js/audio.js",
  "js/game.js",
  "js/levels.js",
  "js/storage.js",
  "js/i18n.js",
  "tools/pruefung.js",
  "HILFE.md",
  "README.md"
];
var strukturOk = true;
var strukturDetail = [];
STRUKTUR.forEach(function (rel) {
  var p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { strukturOk = false; strukturDetail.push(rel + " fehlt"); return; }
  if (fs.statSync(p).size === 0) { strukturOk = false; strukturDetail.push(rel + " ist leer"); }
});
pruefung("1. Dateistruktur vollstaendig und keine leeren Dateien", strukturOk, strukturDetail.join("; "));

/* Quelltexte der Paketdateien (ohne README/HILFE) */
var QUELL = ["index.html", "css/style.css", "js/main.js", "js/audio.js", "js/game.js", "js/levels.js", "js/storage.js", "js/i18n.js"];
var quellText = QUELL.map(lies).join("\n");

/* 2. Keine externen URLs (SVG-Namensraum ist kein externer Bezug). */
var ohneXmlns = quellText
  .replace(/http:\/\/www\.w3\.org\/2000\/svg/g, "")
  .replace(/http:\/\/www\.w3\.org\/1999\/xhtml/g, "");
var externeUrls = ohneXmlns.match(/https?:\/\/[^\s"'<>]+|\/\/cdn\.[^\s"'<>]+/g);
pruefung("2. Keine externen URLs in HTML, CSS oder JavaScript", !externeUrls, externeUrls ? externeUrls.join(", ") : "");

/* 3. Keine Base64-Datenbloecke im Quelltext. */
var base64 = quellText.match(/data:[a-z\/-]+;base64|[A-Za-z0-9+\/]{120,}={0,2}/g);
pruefung("3. Keine Base64-Daten im Quelltext", !base64);

/* 4. Kein setInterval und kein Date.now in game.js und audio.js (Scope begrenzt auf diese Dateien). */
var gameSrc = lies("js/game.js");
var audioSrc = lies("js/audio.js");
pruefung("4a. game.js ohne setInterval", gameSrc.indexOf("setInterval") === -1);
pruefung("4b. game.js ohne Date.now", gameSrc.indexOf("Date.now") === -1);
pruefung("4c. audio.js ohne setInterval", audioSrc.indexOf("setInterval") === -1);
pruefung("4d. audio.js ohne Date.now", audioSrc.indexOf("Date.now") === -1);

/* Hilfsfunktion: Datei im Sandkasten auswerten und Modul-Export beziehungsweise Root-Objekt lesen. */
function ladeModul(rel, rootName) {
  var sandbox = {};
  sandbox.self = sandbox;
  sandbox.window = sandbox;
  sandbox.module = { exports: {} };
  sandbox.exports = sandbox.module.exports;
  vm.createContext(sandbox);
  vm.runInContext(lies(rel), sandbox, { filename: rel });
  return sandbox.module.exports && Object.keys(sandbox.module.exports).length ? sandbox.module.exports : sandbox[rootName];
}

/* 5. Jede Beatmap in levels.js besteht die Spielbarkeitspruefung (unabhaengig vom Generator). */
var levelsModul = ladeModul("js/levels.js", "BEATBOX_LEVELS");
var LEVELS = levelsModul.levels || levelsModul;
function selbeBildschirmhaelfte(z1, z2) { return (z1 % 2) === (z2 % 2); }
var levelFehler = [];
LEVELS.forEach(function (lv) {
  if (!lv.id || !lv.modus || typeof lv.level !== "number") { levelFehler.push(lv.id + ": Grundfelder fehlen"); }
  if (lv.bpm < 40 || lv.bpm > 220) { levelFehler.push(lv.id + ": bpm " + lv.bpm); }
  if (lv.trefferfenster_ms < 30 || lv.trefferfenster_ms > 300) { levelFehler.push(lv.id + ": fenster"); }
  if (Array.isArray(lv.noten)) {
    var beatMs = 60000 / lv.bpm;
    for (var i = 0; i < lv.noten.length; i++) {
      var n = lv.noten[i];
      if (n.zone < 1 || n.zone > 6) { levelFehler.push(lv.id + ": Note " + i + " Zone " + n.zone); }
      if (i > 0) {
        var gap = (n.beat - lv.noten[i - 1].beat) * beatMs;
        if (gap < 120 && selbeBildschirmhaelfte(lv.noten[i - 1].zone, n.zone)) {
          levelFehler.push(lv.id + ": Note " + i + " Luecke " + Math.round(gap) + " ms");
        }
      }
    }
  }
  if (Array.isArray(lv.sequenz)) {
    lv.sequenz.forEach(function (z, i) {
      if (z < 1 || z > 6) { levelFehler.push(lv.id + ": Sequenz[" + i + "] = " + z); }
    });
  }
});
pruefung("5. Alle " + LEVELS.length + " Level/Beatmaps sind spielbar", levelFehler.length === 0, levelFehler.slice(0, 5).join("; "));

/* 6. Jeder Textschluessel existiert in beiden Sprachen. */
var I18N = ladeModul("js/i18n.js", "BEATBOX_I18N");
var deKeys = Object.keys(I18N.de).sort();
var enKeys = Object.keys(I18N.en).sort();
var nurDe = deKeys.filter(function (k) { return enKeys.indexOf(k) === -1; });
var nurEn = enKeys.filter(function (k) { return deKeys.indexOf(k) === -1; });
pruefung("6. i18n-Schluessel in Deutsch und Englisch vollstaendig", nurDe.length === 0 && nurEn.length === 0,
  nurDe.concat(nurEn).slice(0, 5).join(", "));

/* 7. Keine Freischaltungs-Felder, keine Schloss-Symbole.
   Geltungsbereich: nur FeldDEFINITIONEN in levels.js (Wort gefolgt von Doppelpunkt),
   nicht Kommentare oder Fluesstext. */
var levelsSrc = lies("js/levels.js");
var feldVerstoesse = levelsSrc.match(/["']?[a-zA-Z_]*(?:unlock|locked|lock|sperre|gesperrt|freischalt|requirement|voraussetzung|prerequisite)[a-zA-Z_]*["']?\s*:/gi) || [];
var schlossSymbole = quellText.match(/\u{1F512}|\u{1F513}/u);
pruefung("7a. Keine Freischaltungs-/Sperr-Felder in levels.js",
  feldVerstoesse.length === 0, feldVerstoesse.join(", "));
pruefung("7b. Kein Schloss-Symbol im Quelltext", !schlossSymbole);

/* 8. Jeder Modus aus der Auftragsdatei ist in der Hilfe erwartet (ueber i18n geprueft,
      damit beide Sprachen abgedeckt sind). */
var hilfeDe = I18N.de.help_text || "";
var hilfeEn = I18N.en.help_text || "";
var MODI = ["Reaktion", "Timing", "Kombination", "Ausdauer", "Rhythmus"];
var modiFehlenDe = MODI.filter(function (m) { return hilfeDe.indexOf(m) === -1; });
var MODI_EN = ["Reaction", "Timing", "Combination", "Endurance", "Rhythm"];
var modiFehlenEn = MODI_EN.filter(function (m) { return hilfeEn.indexOf(m) === -1; });
pruefung("8. Alle fuenf Modi in der Hilfe erwaehnt (DE und EN)", modiFehlenDe.length === 0 && modiFehlenEn.length === 0,
  modiFehlenDe.concat(modiFehlenEn).join(", "));

console.log("---");
console.log(bestanden + " bestanden, " + fehlgeschlagen + " fehlgeschlagen");
process.exit(fehlgeschlagen === 0 ? 0 : 1);
