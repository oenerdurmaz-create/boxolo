"use strict";
/* BeatBox - Level- und Beatmap-Definitionen.
   Alle 50 Level (5 Modi x 10 Stufen) stehen hier als Zahlenwerte und sind von
   Anfang an offen: Es gibt bewusst keine Felder fuer Fortschritt oder
   Bedingungen - das kontrolliert tools/pruefung.js.
   Level werden ausschliesslich in dieser Datei gepflegt. */

const MODI = ["reaktion", "timing", "kombination", "ausdauer", "rhythmus"];
const SEITE_DER_ZONE = { 1: "L", 2: "R", 3: "L", 4: "R", 5: "L", 6: "R" };

function ramp(l, a, b) { return Math.round(a + (b - a) * (l - 1) / 9); }
function zonenBis(n) { const z = []; for (let i = 1; i <= n && i <= 6; i++) z.push(i); return z; }
function stoerAnzahl(l) { return l <= 4 ? 0 : (l <= 7 ? 1 : 2); }

/* Kombination: Standardfolgen (Auftrag Abschnitt 3) verteilt auf die Level. */
const KOMBO_FOLGEN = [
  { folge: [1, 2], zonen: [1, 2] },
  { folge: [1, 2, 3], zonen: [1, 2, 3] },
  { folge: [1, 2, 5, 2], zonen: [1, 2, 5] },
  { folge: [3, 4, 6, 2], zonen: [2, 3, 4, 6] },
  { folge: [1, 1, 2, 3, 2], zonen: [1, 2, 3] },
  { folge: [1, 2, 3, 4, 5], zonen: [1, 2, 3, 4, 5] },
  { folge: [2, 1, 4, 3, 6], zonen: [1, 2, 3, 4, 6] },
  { folge: [1, 2, 5, 2, 6, 4], zonen: [1, 2, 4, 5, 6] },
  { folge: [3, 4, 6, 2, 5, 1], zonen: [1, 2, 3, 4, 5, 6] },
  { folge: [1, 4, 2, 5, 3, 6], zonen: [1, 2, 3, 4, 5, 6] }
];

/* Rhythmus: Muster innerhalb einer 8-Beat-Phrase, beat 0 ist der erste Schlag der Phrase. */
const RHYTHMUS_MUSTER = [
  { zonenAnzahl: 2, noten: [{ beat: 0, zone: 1 }, { beat: 2, zone: 2 }] },
  { zonenAnzahl: 3, noten: [{ beat: 0, zone: 1 }, { beat: 1, zone: 2 }, { beat: 2, zone: 3 }] },
  { zonenAnzahl: 3, noten: [{ beat: 0, zone: 2 }, { beat: 1, zone: 1 }, { beat: 2.5, zone: 3 }] },
  { zonenAnzahl: 4, noten: [{ beat: 0, zone: 1 }, { beat: 1, zone: 2 }, { beat: 2, zone: 4 }, { beat: 3, zone: 3 }] },
  { zonenAnzahl: 4, noten: [{ beat: 0, zone: 3 }, { beat: 0.5, zone: 4 }, { beat: 1, zone: 3 }, { beat: 3, zone: 1 }] },
  { zonenAnzahl: 5, noten: [{ beat: 0, zone: 1 }, { beat: 1, zone: 2 }, { beat: 2, zone: 3 }, { beat: 2.5, zone: 5 }, { beat: 3, zone: 1 }] },
  { zonenAnzahl: 5, noten: [{ beat: 0, zone: 4 }, { beat: 0.5, zone: 3 }, { beat: 1, zone: 4 }, { beat: 2, zone: 5 }, { beat: 3, zone: 2 }] },
  { zonenAnzahl: 6, noten: [{ beat: 0, zone: 1 }, { beat: 0.5, zone: 2 }, { beat: 1, zone: 5 }, { beat: 1.5, zone: 6 }, { beat: 2, zone: 3 }, { beat: 3, zone: 4 }] },
  { zonenAnzahl: 6, noten: [{ beat: 0, zone: 3 }, { beat: 0.5, zone: 4 }, { beat: 1, zone: 1 }, { beat: 1.5, zone: 2 }, { beat: 2, zone: 5 }, { beat: 2.5, zone: 6 }] },
  { zonenAnzahl: 6, noten: [{ beat: 0, zone: 5 }, { beat: 0.5, zone: 6 }, { beat: 1, zone: 3 }, { beat: 1.5, zone: 4 }, { beat: 2, zone: 1 }, { beat: 2.5, zone: 2 }] }
];

function baueLevel() {
  const liste = [];
  for (let l = 1; l <= 10; l++) {
    const nr = (l < 10 ? "0" : "") + l;
    const bpm = ramp(l, 80, 160);
    const fenster = ramp(l, 130, 70);
    const anzahlZonen = ramp(l, 2, 6);
    liste.push({ id: "reaktion_" + nr, level: l, modus: "reaktion", bpm: bpm,
      trefferfenster_ms: fenster, zonen: zonenBis(anzahlZonen), ziel_anzahl: 20,
      warte_min_ms: ramp(l, 2500, 900), warte_max_ms: ramp(l, 4200, 2200),
      stoerziele: stoerAnzahl(l), noten: [] });
    liste.push({ id: "timing_" + nr, level: l, modus: "timing", bpm: bpm,
      trefferfenster_ms: fenster, zonen: zonenBis(anzahlZonen),
      ziel_anzahl: ramp(l, 8, 14), ring_laufzeit_ms: ramp(l, 1500, 850),
      stoerziele: stoerAnzahl(l), noten: [] });
    const kombo = KOMBO_FOLGEN[l - 1];
    liste.push({ id: "kombination_" + nr, level: l, modus: "kombination", bpm: bpm,
      trefferfenster_ms: fenster, zonen: kombo.zonen, sequenz: kombo.folge,
      durchlaeufe: 3, countin_beats: 4, noten: [] });
    liste.push({ id: "ausdauer_" + nr, level: l, modus: "ausdauer", bpm: bpm,
      bpm_schritt: 10, dauer_s: 60, trefferfenster_ms: fenster,
      zonen: zonenBis(anzahlZonen), stoerziele: stoerAnzahl(l), noten: [] });
    const muster = RHYTHMUS_MUSTER[l - 1];
    liste.push({ id: "rhythmus_" + nr, level: l, modus: "rhythmus", bpm: bpm,
      trefferfenster_ms: fenster, zonen: zonenBis(muster.zonenAnzahl),
      phrasen_beats: 8, phrasen: 4, countin_beats: 4, noten: muster.noten,
      stoerziele: stoerAnzahl(l) });
  }
  return liste;
}

/* Laufzeitpruefung vor Rundenstart: unspielbare Beatmaps werden abgewiesen.
   Zwei Noten duerfen nicht weniger als 120 ms auseinanderliegen, ausser auf
   gegenueberliegenden Bildschirmhaelften (beidhaendig erreichbar). */
function validateBeatmap(karte) {
  const fehler = [];
  if (!karte || typeof karte !== "object") return { ok: false, fehler: ["kein Objekt"] };
  if (typeof karte.id !== "string" || !karte.id) fehler.push("id ungueltig");
  if (MODI.indexOf(karte.modus) < 0) fehler.push("modus ungueltig: " + karte.modus);
  if (typeof karte.bpm !== "number" || karte.bpm < 30 || karte.bpm > 300) fehler.push("bpm ungueltig");
  if (typeof karte.trefferfenster_ms !== "number" || karte.trefferfenster_ms < 50 || karte.trefferfenster_ms > 300) fehler.push("trefferfenster ungueltig");
  if (!Array.isArray(karte.zonen) || karte.zonen.length < 1) { fehler.push("zonen ungueltig"); return { ok: false, fehler: fehler }; }
  for (const z of karte.zonen) if (!Number.isInteger(z) || z < 1 || z > 6) fehler.push("zone ungueltig: " + z);
  if (new Set(karte.zonen).size !== karte.zonen.length) fehler.push("zonen doppelt");
  if (Array.isArray(karte.noten)) {
    const geordnet = karte.noten.slice().sort((a, b) => a.beat - b.beat);
    for (const n of geordnet) {
      if (!Number.isInteger(n.zone) || n.zone < 1 || n.zone > 6) fehler.push("notenzone ungueltig: " + n.zone);
      else if (karte.zonen.indexOf(n.zone) < 0) fehler.push("notenzone nicht aktiv: " + n.zone);
      if (typeof n.beat !== "number" || n.beat < 0) fehler.push("beat ungueltig");
    }
    for (let i = 1; i < geordnet.length; i++) {
      const dtMs = (geordnet[i].beat - geordnet[i - 1].beat) * 60000 / karte.bpm;
      if (dtMs < 120 && SEITE_DER_ZONE[geordnet[i].zone] === SEITE_DER_ZONE[geordnet[i - 1].zone]) {
        fehler.push("noten zu dicht auf einer Bildschirmhaelfte: beat " + geordnet[i - 1].beat);
      }
    }
  }
  if (Array.isArray(karte.sequenz)) {
    if (karte.sequenz.length < 2) fehler.push("sequenz zu kurz");
    for (const z of karte.sequenz) if (karte.zonen.indexOf(z) < 0) fehler.push("sequenzzone nicht aktiv: " + z);
  }
  return { ok: fehler.length === 0, fehler: fehler };
}

const BEATMAPS = baueLevel();

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BEATMAPS, validateBeatmap, MODI };
}