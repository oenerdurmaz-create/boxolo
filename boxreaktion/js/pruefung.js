#!/usr/bin/env node
"use strict";
/* BeatBox - automatisches Pruefskript (Node, ohne Abhaengigkeiten).
   Lauf:     node tools/pruefung.js
   Rueckgabe 0 bei Erfolg, 1 bei Fehlern.
   Jede Pruefung hat einen bewusst eng geschnittenen Geltungsbereich. */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAKET_DATEIEN = [
  "index.html", "css/style.css", "js/main.js", "js/audio.js", "js/game.js",
  "js/levels.js", "js/storage.js", "js/i18n.js", "tools/pruefung.js",
  "HILFE.md", "README.md"
];
/* Geltungsbereich "App-Quelltext": tools/ und Markdown sind bewusst
   ausgenommen, weil hier die Pruefmuster selbst sowie Doku stehen. */
const APP_QUELLTEXT = [
  "index.html", "css/style.css", "js/main.js", "js/audio.js",
  "js/game.js", "js/levels.js", "js/storage.js", "js/i18n.js"
];
const MODI = ["reaktion", "timing", "kombination", "ausdauer", "rhythmus"];

let bestanden = 0, fehlgeschlagen = 0;
function pruefung(name, ok, hinweis) {
  if (ok) { bestanden++; console.log("  OK    " + name); }
  else { fehlgeschlagen++; console.log("  FEHL  " + name + (hinweis ? "\n        " + hinweis : "")); }
}
function lies(rel) { return fs.readFileSync(path.join(ROOT, rel), "utf8"); }
function existiert(rel) { return fs.existsSync(path.join(ROOT, rel)); }

console.log("BeatBox Prueflauf");
console.log("=================");

/* 1) Struktur vollstaendig, keine leeren Dateien */
for (const rel of PAKET_DATEIEN) {
  let ok = existiert(rel), hinweis = "Datei fehlt";
  if (ok) {
    const leer = lies(rel).trim().length === 0;
    ok = !leer; if (leer) hinweis = "Datei ist leer";
  }
  pruefung("Datei vorhanden und nicht leer: " + rel, ok, hinweis);
}

/* 2) Keine externen URLs im App-Quelltext */
{
  const muster = /https?:\/\//i;
  for (const rel of APP_QUELLTEXT) {
    const zeilen = lies(rel).split("\n")
      .map((z, i) => (muster.test(z) ? i + 1 : -1))
      .filter(i => i >= 0);
    pruefung("Keine externe URL: " + rel, zeilen.length === 0, "Zeilen: " + zeilen.join(", "));
  }
}

/* 3) Keine Base64-Datenbloecke im App-Quelltext */
{
  const muster = /;base64|base64\s*,/i;
  for (const rel of APP_QUELLTEXT) {
    pruefung("Kein Base64-Block: " + rel, !muster.test(lies(rel)));
  }
}

/* 4) Kein verbotener Zeitgeber in der Spiellogik.
      Geltungsbereich ausschliesslich js/game.js und js/audio.js (Auftrag Abschnitt 11). */
{
  const muster = /\bsetInterval\b|\bDate\.now\b/;
  for (const rel of ["js/game.js", "js/audio.js"]) {
    pruefung("Kein verbotener Zeitgeber: " + rel, !muster.test(lies(rel)));
  }
}

/* 5) Spielbarkeit aller Beatmaps - eigenstaendige Pruefung, ruft bewusst NICHT
      die Laufzeitfunktion aus levels.js auf (Unabhaengigkeit vom Generator). */
{
  const levels = require(path.join(ROOT, "js", "levels.js"));
  const karten = levels.BEATMAPS || [];
  pruefung("50 Beatmaps vorhanden (5 Modi x 10 Level)", Array.isArray(karten) && karten.length === 50, "gefunden: " + karten.length);
  const jeModus = {};
  const fehlerGesamt = [];
  for (const k of karten) {
    jeModus[k.modus] = (jeModus[k.modus] || 0) + 1;
    for (const f of pruefeSpielbarkeit(k)) fehlerGesamt.push(k.id + ": " + f);
  }
  for (const m of MODI) pruefung("10 Level im Modus " + m, jeModus[m] === 10, "gefunden: " + (jeModus[m] || 0));
  pruefung("Alle Beatmaps spielbar (Zonen 1..6 aktiv, Mindestabstand 120 ms je Bildschirmhaelfte)",
    fehlerGesamt.length === 0, fehlerGesamt.slice(0, 8).join(" | "));
}

function seite(z) { return (z % 2 === 1) ? "L" : "R"; }
function pruefeSpielbarkeit(k) {
  const fehler = [];
  if (!k || typeof k !== "object") return ["kein Objekt"];
  if (typeof k.id !== "string" || !k.id) fehler.push("id fehlt");
  if (MODI.indexOf(k.modus) < 0) fehler.push("unbekannter Modus");
  if (typeof k.bpm !== "number" || k.bpm < 30 || k.bpm > 300) fehler.push("bpm ungueltig");
  if (typeof k.trefferfenster_ms !== "number" || k.trefferfenster_ms < 50 || k.trefferfenster_ms > 300) fehler.push("trefferfenster ungueltig");
  if (!Array.isArray(k.zonen) || k.zonen.length < 1) { fehler.push("zonen fehlen"); return fehler; }
  for (const z of k.zonen) if (!Number.isInteger(z) || z < 1 || z > 6) fehler.push("zone ausserhalb 1..6: " + z);
  if (new Set(k.zonen).size !== k.zonen.length) fehler.push("doppelte Zonen");
  if (Array.isArray(k.noten)) {
    const n = k.noten.slice().sort((a, b) => a.beat - b.beat);
    for (const x of n) {
      if (!Number.isInteger(x.zone) || x.zone < 1 || x.zone > 6) fehler.push("notenzone ungueltig: " + x.zone);
      else if (k.zonen.indexOf(x.zone) < 0) fehler.push("notenzone inaktiv: " + x.zone);
      if (typeof x.beat !== "number" || x.beat < 0) fehler.push("beat ungueltig");
    }
    for (let i = 1; i < n.length; i++) {
      const dtMs = (n[i].beat - n[i - 1].beat) * 60000 / k.bpm;
      if (dtMs < 120 && seite(n[i].zone) === seite(n[i - 1].zone)) fehler.push("zu dicht: beat " + n[i - 1].beat + " -> " + n[i].beat);
    }
  }
  if (k.modus === "rhythmus" && (!Array.isArray(k.noten) || k.noten.length < 2)) fehler.push("rhythmus braucht noten");
  if (Array.isArray(k.sequenz)) {
    if (k.sequenz.length < 2) fehler.push("sequenz zu kurz");
    for (const z of k.sequenz) if (k.zonen.indexOf(z) < 0) fehler.push("sequenzzone inaktiv: " + z);
  }
  if (k.modus === "kombination" && !Array.isArray(k.sequenz)) fehler.push("kombination braucht sequenz");
  return fehler;
}

/* 6) i18n: jeder Schluessel in beiden Sprachen vorhanden */
{
  const i18n = require(path.join(ROOT, "js", "i18n.js"));
  const probleme = [];
  function vergleiche(a, b, pfad) {
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
    for (const k of ka) if (kb.indexOf(k) < 0) probleme.push("nur DE: " + pfad + "." + k);
    for (const k of kb) if (ka.indexOf(k) < 0) probleme.push("nur EN: " + pfad + "." + k);
    for (const k of ka) {
      if (kb.indexOf(k) >= 0 && typeof a[k] === "object" && a[k] !== null && typeof b[k] === "object" && b[k] !== null) {
        vergleiche(a[k], b[k], pfad + "." + k);
      }
    }
  }
  vergleiche(i18n.TEXTS.de, i18n.TEXTS.en, "texts");
  pruefung("i18n: Schluessel in beiden Sprachen identisch", probleme.length === 0, probleme.slice(0, 8).join(" | "));
}

/* 7a) Keine Sperr-Felder in levels.js
   7b) Kein Schloss-Symbol im App-Quelltext */
{
  const musterFelder = /freischalt|sperr|gesperrt|\block\b|\bunlock\b|\blocked\b|voraussetz|erforder|benoetigt|benötigt|requires|requirement/i;
  pruefung("levels.js ohne Sperr-Felder", !musterFelder.test(lies("js/levels.js")));
  const musterSymbol = /\uD83D\uDD12|padlock|schloss/i;
  for (const rel of APP_QUELLTEXT) {
    pruefung("Kein Schloss-Symbol: " + rel, !musterSymbol.test(lies(rel)));
  }
}

/* 8) Hilfe erwaehnt jeden Modus in beiden Sprachen */
{
  const i18n = require(path.join(ROOT, "js", "i18n.js"));
  const hilfe = lies("HILFE.md");
  const probleme = [];
  for (const m of MODI) {
    const de = i18n.TEXTS.de.modes[m], en = i18n.TEXTS.en.modes[m];
    if (hilfe.indexOf(de) < 0) probleme.push("DE fehlt: " + de);
    if (hilfe.indexOf(en) < 0) probleme.push("EN fehlt: " + en);
  }
  pruefung("HILFE.md erwaehnt alle fuenf Modi in beiden Sprachen", probleme.length === 0, probleme.join(" | "));
}

console.log("\nErgebnis: " + bestanden + " bestanden, " + fehlgeschlagen + " fehlgeschlagen");
process.exit(fehlgeschlagen > 0 ? 1 : 0);