"use strict";
/* BeatBox - Web-Audio-Engine: Klangerzeugung, Takt-Uhr, Kalibrier-Grundlage.
   Regeln: Zeitgeber der Spiellogik ist ausschliesslich AudioContext.currentTime.
   Alle Klaenge werden beim Start in Puffer geschrieben (synthetisiert, keine
   Dateien, kein Netz, keine Kodierung im Quelltext). Angetrieben wird der
   Soundplaner aus dem Bildschirmtakt (requestAnimationFrame) in main.js. */

const AudioEngine = (function () {
  let ctx = null;
  let master = null;
  const puffer = {};
  let syncVersatz = 0; /* Sekunden: audioZeit - seitenZeit (event.timeStamp-Domaene) */

  function erzeugt() { return ctx !== null; }

  function bauen() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    pufferFuellen();
    return true;
  }

  /* Nach Vordergrund-Eintritt: Kontext schliessen und vollstaendig neu bauen
     (nur Fortsetzen reicht in WKWebView nicht, der Ton bleibt sonst stumm). */
  async function neuAufbauen() {
    if (ctx) { try { await ctx.close(); } catch (e) { /* ignorieren */ } }
    ctx = null; master = null;
    for (const k in puffer) delete puffer[k];
    return bauen();
  }

  function fortsetzen() { if (ctx && ctx.state === "suspended") { ctx.resume(); } }

  function now() { return ctx ? ctx.currentTime : 0; }

  function sync() { if (ctx) syncVersatz = ctx.currentTime - performance.now() / 1000; }

  /* event.timeStamp (Seiten-Domaene) -> Audio-Domaene. */
  function zeigereignisZuAudio(zeitstempelMs) { return zeitstempelMs / 1000 + syncVersatz; }

  function synth(dauerSek, fuellen) {
    const n = Math.max(1, Math.floor(ctx.sampleRate * dauerSek));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    fuellen(buf.getChannelData(0), ctx.sampleRate);
    return buf;
  }

  function pufferFuellen() {
    puffer.kick = synth(0.4, (d, sr) => {
      let phase = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const f = 42 + 120 * Math.exp(-t * 20);
        phase += (2 * Math.PI * f) / sr;
        d[i] = Math.sin(phase) * Math.exp(-t * 8) * 0.95;
      }
    });
    puffer.snare = synth(0.25, (d, sr) => {
      let phase = 0, alt = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const r = Math.random() * 2 - 1;
        const rauschen = (r - alt) * 0.9; alt = r;
        phase += (2 * Math.PI * 190) / sr;
        d[i] = rauschen * 0.8 * Math.exp(-t * 22) + Math.sin(phase) * 0.35 * Math.exp(-t * 18);
      }
    });
    puffer.hihat = synth(0.08, (d, sr) => {
      let alt = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const r = Math.random() * 2 - 1;
        d[i] = (r - alt) * 0.9 * Math.exp(-t * 60) * 0.45; alt = r;
      }
    });
    puffer.treffer = synth(0.14, (d, sr) => {
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        d[i] = (Math.sin(2 * Math.PI * 880 * t) * 0.5 + Math.sin(2 * Math.PI * 1318 * t) * 0.3) * Math.exp(-t * 26);
      }
    });
    puffer.daneben = synth(0.3, (d, sr) => {
      let phase = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const f = Math.max(60, 180 - 110 * (t / 0.3));
        phase += (2 * Math.PI * f) / sr;
        d[i] = Math.sin(phase) * Math.exp(-t * 9) * 0.5;
      }
    });
    puffer.klick = synth(0.05, (d, sr) => {
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        d[i] = Math.sin(2 * Math.PI * 1100 * t) * Math.exp(-t * 90) * 0.8;
      }
    });
  }

  function spielen(name, wenn, lautstaerke) {
    if (!ctx || !puffer[name]) return;
    const src = ctx.createBufferSource();
    src.buffer = puffer[name];
    const g = ctx.createGain();
    g.gain.value = typeof lautstaerke === "number" ? lautstaerke : 1;
    src.connect(g); g.connect(master);
    const ziel = typeof wenn === "number" ? wenn : ctx.currentTime;
    src.start(Math.max(ziel, ctx.currentTime));
  }

  /* Takt-Uhr: Grundlage ist die Audio-Uhr; geplant wird mit Vorlauf von 0,3 s.
     beat k ist relativ zum Phrasebeginn, Count-in liegt davor (negative k). */
  const takt = { aktiv: false, bpm: 100, basis: 0, countin: 0, naechsterBeat: 0, metronom: false, kulisse: false };
  const Clock = {
    setzen(bpm, basisAudio, countinBeats, metronomAn, kulisseAn, startBeat) {
      takt.bpm = bpm; takt.basis = basisAudio; takt.countin = countinBeats || 0;
      takt.metronom = !!metronomAn; takt.kulisse = !!kulisseAn;
      takt.naechsterBeat = (typeof startBeat === "number") ? startBeat : -takt.countin;
      takt.aktiv = true;
    },
    verschieben(deltaSek) { takt.basis += deltaSek; },
    stoppen() { takt.aktiv = false; },
    dauer() { return 60 / takt.bpm; },
    beatZeit(k) { return takt.basis + (takt.countin + k) * this.dauer(); },
    beatJetzt(nowA) { return (nowA - takt.basis) / this.dauer() - takt.countin; },
    tick(nowA) {
      if (!ctx || !takt.aktiv) return;
      const horizont = nowA + 0.3;
      while (this.beatZeit(takt.naechsterBeat) < horizont && takt.naechsterBeat < 100000) {
        const zt = this.beatZeit(takt.naechsterBeat);
        if (zt >= nowA - 0.05) {
          if (takt.metronom) spielen("klick", zt, takt.naechsterBeat % 4 === 0 ? 0.9 : 0.45);
          if (takt.kulisse) {
            const m = ((takt.naechsterBeat % 4) + 4) % 4;
            if (m === 0) spielen("kick", zt, 0.4);
            if (takt.naechsterBeat % 2 === 1) spielen("hihat", zt, 0.18);
          }
        }
        takt.naechsterBeat++;
      }
    }
  };

  return { bauen, neuAufbauen, fortsetzen, erzeugt, now, sync, zeigereignisZuAudio, spielen, Clock };
})();