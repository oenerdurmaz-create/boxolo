/* BeatBox — Level- und Beatmap-Definitionen.
   Alle Werte stehen als Daten in dieser Datei und sind ohne Codeaenderung erweiterbar.
   Jeder Modus hat 10 Level; alle sind von Anfang an frei waehlbar und sichtbar.
   Fortschrittslogik mit Sperr-Markierungen gibt es in diesem Projekt nicht. */
(function (root, factory) {
  var L = factory();
  root.BEATBOX_LEVELS = L.levels;
  root.BEATBOX_validateLevel = L.validateLevel;
  if (typeof module !== "undefined" && module.exports) { module.exports = L; }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Deterministischer Zufallszahlengenerator, damit die Level reproduzierbar bleiben. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function lerp(a, b, f) { return a + (b - a) * f; }

  /* Bildschirmhaelften: links = 1,3,5 — rechts = 2,4,6 (gegenseitig beidhaendig erreichbar). */
  function sameHalf(z1, z2) {
    return ((z1 % 2) === (z2 % 2));
  }

  /* Spielbarkeitspruefung einer Level-Definition (Abschnitt 7 der Auftragsdatei). */
  function validateLevel(lv) {
    var errors = [];
    if (!lv || typeof lv !== "object") { return ["level is not an object"]; }
    if (typeof lv.bpm !== "number" || lv.bpm < 40 || lv.bpm > 220) { errors.push("bpm out of range"); }
    if (typeof lv.trefferfenster_ms !== "number" || lv.trefferfenster_ms < 30 || lv.trefferfenster_ms > 300) {
      errors.push("trefferfenster_ms out of range");
    }
    if (typeof lv.aktiveZonen !== "number" || lv.aktiveZonen < 1 || lv.aktiveZonen > 6) {
      errors.push("aktiveZonen out of range");
    }
    if (Array.isArray(lv.noten)) {
      var beatMs = 60000 / lv.bpm;
      var lastBeat = null;
      for (var i = 0; i < lv.noten.length; i++) {
        var n = lv.noten[i];
        if (typeof n.zone !== "number" || n.zone < 1 || n.zone > 6) {
          errors.push("note " + i + ": zone out of range 1..6");
        }
        if (typeof n.beat !== "number" || n.beat < 0) {
          errors.push("note " + i + ": beat invalid");
        }
        if (lastBeat !== null) {
          var gapMs = (n.beat - lastBeat.note.beat) * beatMs;
          if (gapMs < 120 && sameHalf(lastBeat.note.zone, n.zone)) {
            errors.push("note " + i + ": gap " + Math.round(gapMs) + " ms < 120 ms on same screen half");
          }
        }
        lastBeat = { note: n };
      }
    }
    if (Array.isArray(lv.sequenz)) {
      for (var j = 0; j < lv.sequenz.length; j++) {
        if (typeof lv.sequenz[j] !== "number" || lv.sequenz[j] < 1 || lv.sequenz[j] > 6) {
          errors.push("sequenz[" + j + "] out of range 1..6");
        }
      }
    }
    return errors;
  }

  var MODI = ["reaktion", "timing", "kombination", "ausdauer", "rhythmus"];
  var STANDARD_SEQUENZEN = [[1, 2], [1, 2, 3], [1, 2, 5, 2], [3, 4, 6, 2], [1, 1, 2, 3, 2]];

  function buildLevel(modus, lvl) {
    var f = (lvl - 1) / 9; /* 0 .. 1 */
    var rng = mulberry32(0xBEA700 + MODI.indexOf(modus) * 100 + lvl);
    var bpm = Math.round(lerp(80, 160, f));
    var aktiveZonen = 2 + Math.floor(f * 4 + 0.0001); /* 2 .. 6 */
    var fenster = Math.round(lerp(130, 70, f));
    var stoerziele = Math.floor(f * 2 + 0.0001); /* 0 .. 2 */
    var seqLen = 2 + Math.round(f * 4); /* 2 .. 6 */
    var sequenz = null;
    var noten = null;

    if (modus === "kombination") {
      if (lvl <= STANDARD_SEQUENZEN.length) {
        sequenz = STANDARD_SEQUENZEN[lvl - 1].slice();
        while (sequenz.length < seqLen) { sequenz.push(1 + Math.floor(rng() * aktiveZonen)); }
      } else {
        sequenz = [];
        for (var i = 0; i < seqLen; i++) { sequenz.push(1 + Math.floor(rng() * aktiveZonen)); }
      }
    }

    if (modus === "rhythmus") {
      noten = [];
      var anzahl = 8 + lvl; /* 9 .. 18 Noten */
      var beat = 4.0; /* einleitung von 4 beats */
      var zone = 1 + Math.floor(rng() * aktiveZonen);
      for (var k = 0; k < anzahl; k++) {
        var z = zone;
        while (z === zone) { z = 1 + Math.floor(rng() * aktiveZonen); }
        zone = z;
        noten.push({ beat: Math.round(beat * 2) / 2, zone: zone });
        var schritt = rng() < 0.35 ? 0.5 : (rng() < 0.7 ? 1 : 1.5);
        beat += schritt;
      }
    }

    return {
      id: modus + "_" + (lvl < 10 ? "0" : "") + lvl,
      modus: modus,
      level: lvl,
      bpm: bpm,
      aktiveZonen: aktiveZonen,
      sequenzLaenge: seqLen,
      trefferfenster_ms: fenster,
      stoerziele: stoerziele,
      sequenz: sequenz,
      noten: noten,
      levelfaktor: Math.round((1 + (lvl - 1) * 0.15) * 100) / 100
    };
  }

  var levels = [];
  for (var m = 0; m < MODI.length; m++) {
    for (var l = 1; l <= 10; l++) {
      levels.push(buildLevel(MODI[m], l));
    }
  }

  return { levels: levels, validateLevel: validateLevel };
});
