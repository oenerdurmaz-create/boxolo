"use strict";
/* BeatBox - Spiellogik, Bewertung, fuenf Modi.
   Zeitregel: Der einzige Zeitgeber ist die Audio-Uhr (AudioEngine.now und
   event.timeStamp, abgebildet ueber AudioEngine.zeigereignisZuAudio). Alle
   Rundenzeiten sind relative Werte zu zeitBasis, damit Pause und der
   Neuaufbau des Audio-Kontexts sauber funktionieren. Angetrieben wird die
   Logik ausschliesslich aus dem Bildschirmtakt-Ruf in main.js. */

const Game = (function () {
  const ZUSTAND = { AUS: "aus", VORLAEUFER: "vorlaeufer", LAEUFT: "laeuft", PAUSE: "pause", FERTIG: "fertig" };
  const MULTIPLIKATOR = [1, 1.5, 2, 3, 4];
  const URTEILSFENSTER = [
    { bis: 40, key: "perfect", punkte: 100 },
    { bis: 80, key: "good", punkte: 60 },
    { bis: 130, key: "ok", punkte: 25 }
  ];

  let map = null;
  let zustand = ZUSTAND.AUS;
  let zeitBasis = 0;      /* Audiozeit, auf die sich relMs bezieht */
  let pausenStandMs = 0;
  let ruck = null;        /* Rueckrufe: onJudge(zone,key,ms,richtung), onEnde(ergebnis) */
  let daten = null;
  let ziele = [];
  let stoer = [];
  let naechsteStoerAbMs = 0;
  /* Reaktion */
  let trialIndex = 0, trialPhase = "warten", trialZone = 0, trialZielRelMs = 0;
  /* Ausdauer */
  let ausdauerZiel = null, ausdauerErledigt = 0, ausdauerVerpasst = 0;
  /* Kombination */
  let kombiPos = 0, kombiDurchlauf = 0, kombiSatzBeats = 0, kombiVorfuehrPos = -1, kombiPreview = 0;

  function beatMs() { return 60000 / map.bpm; }
  function countinBeats() { return map.countin_beats || 4; }
  function countinMs() { return countinBeats() * beatMs(); }
  function levelFaktor() { return 1 + ((map.level || 1) - 1) / 10; }
  function aktiveMult() { return MULTIPLIKATOR[Math.min(MULTIPLIKATOR.length - 1, Math.floor(daten.serie / 10))]; }
  function livePunkte() { return Math.round(daten.punkteSumme * daten.multMax * levelFaktor()); }
  function zufallsZone() { return map.zonen[Math.floor(Math.random() * map.zonen.length)]; }
  function zufall(min, max) { return min + Math.random() * (max - min); }
  function kalibMs() { const k = Store.kalibrierungMs(); return k == null ? 0 : k; }
  function richtung(ms) { return ms < 0 ? "early" : "late"; }

  function start(m, rueckrufe) {
    const pruef = validateBeatmap(m);
    if (!pruef.ok) throw new Error("Ungueltige Beatmap: " + pruef.fehler.join("; "));
    map = m; ruck = rueckrufe;
    daten = { punkteSumme: 0, treffer: 0, serie: 0, besteSerie: 0, multMax: 1,
              messungen: [], urteile: { perfect: 0, good: 0, ok: 0, miss: 0 }, fruhStarts: 0 };
    ziele = []; stoer = []; naechsteStoerAbMs = countinMs() + 3000;
    trialIndex = 0; trialPhase = "warten"; trialZone = 0; trialZielRelMs = 0;
    ausdauerZiel = null; ausdauerErledigt = 0; ausdauerVerpasst = 0;
    kombiPos = 0; kombiDurchlauf = 0; kombiVorfuehrPos = -1; kombiPreview = 0;
    if (map.modus === "timing") zieleTimingBauen();
    if (map.modus === "rhythmus") zieleRhythmusBauen();
    if (map.modus === "kombination") zieleKombinationBauen();
    zeitBasis = AudioEngine.now();
    pausenStandMs = 0;
    const metronom = (map.modus === "kombination" || map.modus === "rhythmus");
    const kulisse = (map.modus === "reaktion" || map.modus === "timing");
    AudioEngine.Clock.setzen(map.bpm, zeitBasis, countinBeats(), metronom, kulisse, -countinBeats());
    zustand = ZUSTAND.VORLAEUFER;
  }

  /* Nach Neuaufbau des Audio-Kontexts: Zeitbasis neu verankern. */
  function audioNeu() {
    if (zustand === ZUSTAND.PAUSE && map) {
      zeitBasis = AudioEngine.now() - pausenStandMs / 1000;
      const metronom = (map.modus === "kombination" || map.modus === "rhythmus");
      const kulisse = (map.modus === "reaktion" || map.modus === "timing");
      const beatJetzt = pausenStandMs / beatMs() - countinBeats();
      AudioEngine.Clock.setzen(map.bpm, zeitBasis, countinBeats(), metronom, kulisse, Math.ceil(beatJetzt));
    }
  }

  function pause() {
    if (zustand !== ZUSTAND.LAEUFT && zustand !== ZUSTAND.VORLAEUFER) return;
    pausenStandMs = (AudioEngine.now() - zeitBasis) * 1000;
    zustand = ZUSTAND.PAUSE;
  }
  function weiter() {
    if (zustand !== ZUSTAND.PAUSE) return;
    const deltaSek = AudioEngine.now() - (zeitBasis + pausenStandMs / 1000);
    if (deltaSek > 0.01) { zeitBasis += deltaSek; AudioEngine.Clock.verschieben(deltaSek); }
    zustand = (pausenStandMs < countinMs()) ? ZUSTAND.VORLAEUFER : ZUSTAND.LAEUFT;
  }
  function abbrechen() { if (map) AudioEngine.Clock.stoppen(); zustand = ZUSTAND.AUS; }

  /* ---------- Zielaufbau je Modus ---------- */

  function zieleTimingBauen() {
    const bm = beatMs();
    const abstandBeats = Math.max(2, Math.ceil(map.ring_laufzeit_ms / bm));
    ziele = [];
    for (let i = 0; i < map.ziel_anzahl; i++) {
      ziele.push({ zone: zufallsZone(), relMs: countinMs() + 400 + i * abstandBeats * bm,
                   ringMs: map.ring_laufzeit_ms, status: "offen" });
    }
  }
  function zieleRhythmusBauen() {
    const bm = beatMs();
    const ringMs = Math.min(1400, bm * 2.5);
    ziele = [];
    const phrasen = map.phrasen || 4, laenge = map.phrasen_beats || 8;
    for (let p = 0; p < phrasen; p++) {
      for (const n of map.noten) {
        const k = p * laenge + n.beat;
        ziele.push({ zone: n.zone, relMs: (countinBeats() + k) * bm, ringMs: ringMs, status: "offen" });
      }
    }
    ziele.sort((a, b) => a.relMs - b.relMs);
  }
  function zieleKombinationBauen() {
    const bm = beatMs(); const len = map.sequenz.length;
    kombiSatzBeats = 2 * len + 1;
    ziele = [];
    for (let d = 0; d < (map.durchlaeufe || 3); d++) {
      for (let i = 0; i < len; i++) {
        const k = d * kombiSatzBeats + len + i;
        ziele.push({ zone: map.sequenz[i], relMs: (countinBeats() + k) * bm,
                     ringMs: Math.min(1200, bm * 2), status: "offen",
                     kombiDurchlauf: d, kombiPos: i });
      }
    }
  }

  /* ---------- Frame-Schritt ---------- */

  function update(nowA) {
    if (zustand !== ZUSTAND.LAEUFT && zustand !== ZUSTAND.VORLAEUFER) return;
    const relMs = (nowA - zeitBasis) * 1000;
    kombiPreview = 0;
    if (zustand === ZUSTAND.VORLAEUFER) {
      if (relMs >= countinMs()) zustand = ZUSTAND.LAEUFT;
      return;
    }
    if (map.modus === "reaktion") schrittReaktion(relMs);
    else if (map.modus === "timing" || map.modus === "rhythmus") schrittZiele(relMs);
    else if (map.modus === "kombination") schrittKombination(relMs);
    else if (map.modus === "ausdauer") schrittAusdauer(relMs);
    stoerSchritt(relMs);
  }

  function schrittReaktion(relMs) {
    if (trialIndex >= map.ziel_anzahl) { abschliessen(); return; }
    if (trialZielRelMs === 0) trialZielRelMs = relMs + zufall(map.warte_min_ms, map.warte_max_ms);
    if (trialPhase === "warten" && relMs >= trialZielRelMs) {
      trialPhase = "leuchtet"; trialZone = zufallsZone();
      AudioEngine.spielen("hihat", null, 0.8);
    }
  }

  function schrittZiele(relMs) {
    for (const z of ziele) {
      if (z.status === "offen" && relMs > z.relMs + map.trefferfenster_ms) {
        z.status = "verpasst"; zielVerpasst(z.zone);
      }
    }
    if (ziele.length > 0) {
      let offen = false;
      for (const z of ziele) if (z.status === "offen") { offen = true; break; }
      if (!offen) abschliessen();
    }
  }

  function schrittKombination(relMs) {
    const len = map.sequenz.length;
    const durchlaeufe = map.durchlaeufe || 3;
    const beatJetzt = relMs / beatMs() - countinBeats();
    if (kombiDurchlauf < durchlaeufe) {
      const satzStart = kombiDurchlauf * kombiSatzBeats;
      const f = Math.floor(beatJetzt);
      if (f >= satzStart && f < satzStart + len && f > kombiVorfuehrPos) {
        kombiVorfuehrPos = f;
        kombiPreview = map.sequenz[f - satzStart];
        AudioEngine.spielen("kick", null, 0.5);
      }
    }
    for (const z of ziele) {
      if (z.status !== "offen") continue;
      if (z.kombiDurchlauf < kombiDurchlauf) { z.status = "uebersprungen"; continue; }
      if (z.kombiDurchlauf === kombiDurchlauf && relMs > z.relMs + map.trefferfenster_ms) {
        z.status = "verpasst"; zielVerpasst(z.zone); kombiSatzAbbrechen();
      }
    }
    if (kombiDurchlauf >= durchlaeufe) {
      for (const z of ziele) if (z.status === "offen") z.status = "uebersprungen";
    }
    let offen = false;
    for (const z of ziele) if (z.status === "offen") { offen = true; break; }
    if (!offen) abschliessen();
  }
  function kombiSatzAbbrechen() {
    for (const z of ziele) if (z.status === "offen" && z.kombiDurchlauf === kombiDurchlauf) z.status = "uebersprungen";
    kombiDurchlauf++; kombiPos = 0; kombiVorfuehrPos = -1;
  }

  function ausdauerBpm(relMs) { return map.bpm + map.bpm_schritt * Math.floor((relMs / 1000) / 10); }
  function ausdauerIntervallMs(relMs) { return 60000 / ausdauerBpm(relMs); }
  function schrittAusdauer(relMs) {
    if (relMs >= map.dauer_s * 1000) { abschliessen(); return; }
    if (!ausdauerZiel) ausdauerZiel = { zone: zufallsZone(), relMs: relMs + 300, status: "offen" };
    if (relMs > ausdauerZiel.relMs + map.trefferfenster_ms) {
      ausdauerZiel.status = "verpasst"; zielVerpasst(ausdauerZiel.zone); ausdauerVerpasst++;
      ausdauerZiel = { zone: zufallsZone(), relMs: relMs + ausdauerIntervallMs(relMs), status: "offen" };
    }
  }

  /* Stoerziele: blitzen auf und duerfen nicht getroffen werden (max 2 gleichzeitig). */
  function stoerSchritt(relMs) {
    if (!map.stoerziele || map.modus === "kombination") { stoer = stoer.filter(s => s.bisRelMs > relMs); return; }
    stoer = stoer.filter(s => s.bisRelMs > relMs);
    if (relMs >= naechsteStoerAbMs && stoer.length < map.stoerziele) {
      const belegt = new Set(stoer.map(s => s.zone));
      if (trialPhase === "leuchtet") belegt.add(trialZone);
      if (ausdauerZiel && ausdauerZiel.status === "offen") belegt.add(ausdauerZiel.zone);
      for (const z of ziele) if (z.status === "offen" && z.relMs - relMs < 2000) belegt.add(z.zone);
      const frei = map.zonen.filter(z => !belegt.has(z));
      if (frei.length > 0) stoer.push({ zone: frei[Math.floor(Math.random() * frei.length)], bisRelMs: relMs + 1400 });
      naechsteStoerAbMs = relMs + zufall(2200, 5000);
    }
  }

  /* ---------- Bewertung ---------- */

  function zielBewerten(zone, abstandMs, messwertZaehlt) {
    const a = Math.abs(abstandMs);
    let u = null;
    for (const x of URTEILSFENSTER) if (a <= x.bis) { u = x; break; }
    if (!u) u = (a <= map.trefferfenster_ms) ? { key: "ok", punkte: 25 } : { key: "miss", punkte: 0 };
    daten.urteile[u.key]++;
    if (u.key === "miss") {
      daten.serie = 0;
      AudioEngine.spielen("daneben");
      if (ruck.onJudge) ruck.onJudge(zone, "miss", abstandMs, richtung(abstandMs));
    } else {
      daten.punkteSumme += u.punkte;
      daten.treffer++;
      daten.serie++;
      if (daten.serie > daten.besteSerie) daten.besteSerie = daten.serie;
      const m = aktiveMult(); if (m > daten.multMax) daten.multMax = m;
      AudioEngine.spielen("treffer", null, u.key === "perfect" ? 1 : 0.8);
      if (messwertZaehlt) daten.messungen.push(abstandMs);
      if (ruck.onJudge) ruck.onJudge(zone, u.key, abstandMs, richtung(abstandMs));
    }
  }
  function zielVerpasst(zone) {
    daten.urteile.miss++; daten.serie = 0;
    AudioEngine.spielen("daneben");
    if (ruck.onJudge) ruck.onJudge(zone, "miss", null, null);
  }
  function fehlUrteil(zone) {
    daten.urteile.miss++; daten.serie = 0;
    AudioEngine.spielen("daneben");
    if (ruck.onJudge) ruck.onJudge(zone, "miss", null, null);
  }

  /* ---------- Eingabe ---------- */

  function zoneAngetippt(zone, ereignis) {
    if (zustand !== ZUSTAND.LAEUFT) return;
    const tapA = AudioEngine.zeigereignisZuAudio(ereignis.timeStamp);
    const relMs = (tapA - zeitBasis) * 1000;
    const sIdx = stoer.findIndex(s => s.zone === zone);
    if (sIdx >= 0) { stoer.splice(sIdx, 1); fehlUrteil(zone); return; }
    if (map.modus === "reaktion") tipReaktion(zone, relMs);
    else if (map.modus === "timing" || map.modus === "rhythmus") tipZiel(zone, relMs);
    else if (map.modus === "kombination") tipKombination(zone, relMs);
    else if (map.modus === "ausdauer") tipAusdauer(zone, relMs);
  }

  function tipReaktion(zone, relMs) {
    if (trialPhase === "warten") {
      /* Fruehstart: Trial wird wiederholt, nach 5 Fruehstarten endet die Runde. */
      daten.fruhStarts++; fehlUrteil(zone);
      if (daten.fruhStarts >= 5) { abschliessen(); return; }
      trialZielRelMs = relMs + zufall(map.warte_min_ms, map.warte_max_ms);
      return;
    }
    const abstandRoh = relMs - trialZielRelMs;
    if (zone !== trialZone) fehlUrteil(zone);
    else zielBewerten(trialZone, abstandRoh - kalibMs(), true);
    trialIndex++;
    trialPhase = "warten";
    if (trialIndex >= map.ziel_anzahl) { abschliessen(); return; }
    trialZielRelMs = relMs + zufall(map.warte_min_ms, map.warte_max_ms);
  }

  function tipZiel(zone, relMs) {
    let bestes = null;
    for (const z of ziele) {
      if (z.status !== "offen" || z.zone !== zone) continue;
      if (!bestes || Math.abs(z.relMs - relMs) < Math.abs(bestes.relMs - relMs)) bestes = z;
    }
    if (!bestes) { fehlUrteil(zone); return; }
    bestes.status = "getroffen";
    zielBewerten(zone, (relMs - bestes.relMs) - kalibMs(), true);
  }

  function tipKombination(zone, relMs) {
    if (kombiDurchlauf >= (map.durchlaeufe || 3)) return;
    const erwartet = map.sequenz[kombiPos];
    if (!erwartet) return;
    const ziel = ziele.find(z => z.status === "offen" && z.kombiDurchlauf === kombiDurchlauf && z.kombiPos === kombiPos);
    if (!ziel) return;
    if (zone !== erwartet) {
      ziel.status = "uebersprungen";
      fehlUrteil(zone);
      kombiSatzAbbrechen();
      return;
    }
    ziel.status = "getroffen";
    zielBewerten(zone, (relMs - ziel.relMs) - kalibMs(), true);
    kombiPos++;
    if (kombiPos >= map.sequenz.length) { kombiDurchlauf++; kombiPos = 0; kombiVorfuehrPos = -1; }
  }

  function tipAusdauer(zone, relMs) {
    if (ausdauerZiel && ausdauerZiel.status === "offen" && zone === ausdauerZiel.zone) {
      ausdauerZiel.status = "getroffen";
      zielBewerten(zone, (relMs - ausdauerZiel.relMs) - kalibMs(), true);
      ausdauerErledigt++;
      ausdauerZiel = { zone: zufallsZone(), relMs: Math.max(relMs, ausdauerZiel.relMs) + ausdauerIntervallMs(relMs), status: "offen" };
    } else {
      fehlUrteil(zone);
    }
  }

  /* ---------- Abschluss ---------- */

  function zieleGesamtZaehler() {
    if (map.modus === "reaktion") return map.ziel_anzahl;
    if (map.modus === "ausdauer") return ausdauerErledigt + ausdauerVerpasst;
    return ziele.filter(z => z.status !== "uebersprungen").length;
  }
  function mittel(arr) {
    if (!arr.length) return null;
    let s = 0; for (const v of arr) s += Math.abs(v);
    return Math.round(s / arr.length);
  }
  function abschliessen() {
    if (zustand === ZUSTAND.FERTIG) return;
    zustand = ZUSTAND.FERTIG;
    AudioEngine.Clock.stoppen();
    const gesamt = zieleGesamtZaehler();
    const erg = {
      modus: map.modus, level: map.level,
      punkte: livePunkte(),
      treffer: daten.treffer, zieleGesamt: gesamt,
      quote: gesamt > 0 ? Math.round(100 * daten.treffer / gesamt) : 0,
      serie: daten.besteSerie,
      reaktionMittel: mittel(daten.messungen),
      urteile: { perfect: daten.urteile.perfect, good: daten.urteile.good, ok: daten.urteile.ok, miss: daten.urteile.miss }
    };
    if (map.modus === "reaktion") {
      const werte = daten.messungen.map(Math.abs).sort((a, b) => a - b);
      if (werte.length) { erg.reaktionBest = Math.round(werte[0]); erg.reaktionSchlechtest = Math.round(werte[werte.length - 1]); }
    }
    if (map.modus === "ausdauer") erg.spm = Math.round(daten.treffer); /* Runde dauert 60 s */
    if (ruck.onEnde) ruck.onEnde(erg);
  }

  /* ---------- Zustand fuer die Oberflaeche ---------- */

  function zustandFuerUi(nowA) {
    const relMs = (nowA - zeitBasis) * 1000;
    const offene = [];
    for (const z of ziele) {
      if (z.status !== "offen") continue;
      const restMs = z.relMs - relMs;
      let fort = 0;
      if (z.ringMs) fort = Math.max(0, Math.min(1.08, 1 - restMs / z.ringMs));
      offene.push({ zone: z.zone, fort: fort, ringMs: z.ringMs || 0, restMs: restMs });
    }
    if (map.modus === "reaktion" && trialPhase === "leuchtet") {
      offene.push({ zone: trialZone, fort: 0, ringMs: 0, restMs: 0 });
    }
    if (map.modus === "ausdauer" && ausdauerZiel && ausdauerZiel.status === "offen") {
      offene.push({ zone: ausdauerZiel.zone, fort: 0, ringMs: 0, restMs: ausdauerZiel.relMs - relMs });
    }
    return {
      zustand: zustand, relMs: relMs,
      punkte: livePunkte(),
      treffer: daten.treffer, zieleGesamt: zieleGesamtZaehler(),
      serie: daten.serie, mult: aktiveMult(),
      offene: offene, stoer: stoer.map(s => s.zone),
      bpmJetzt: map.modus === "ausdauer" ? ausdauerBpm(relMs) : map.bpm,
      restSek: map.modus === "ausdauer" ? Math.max(0, Math.ceil((map.dauer_s * 1000 - relMs) / 1000)) : null,
      trialNr: map.modus === "reaktion" ? Math.min(map.ziel_anzahl, trialIndex + 1) : null,
      preview: kombiPreview,
      kombiPos: kombiPos, kombiDurchlauf: kombiDurchlauf,
      countdown: zustand === ZUSTAND.VORLAEUFER ? Math.max(1, Math.ceil((countinMs() - relMs) / beatMs())) : null
    };
  }

  return {
    start, update, zoneAngetippt, pause, weiter, abbrechen, audioNeu, zustandFuerUi,
    laeuft: () => zustand === ZUSTAND.LAEUFT || zustand === ZUSTAND.VORLAEUFER,
    zustandGeben: () => zustand
  };
})();