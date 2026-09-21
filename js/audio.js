/* BeatBox – Audio-Engine.
 *
 * Einziger Taktgeber ist AudioContext.currentTime.
 * Alle Klänge werden beim Aufbau einmalig als AudioBuffer berechnet (keine Dateien).
 * Eingabezeitstempel (event.timeStamp, Zeitbasis performance) werden über einen laufend
 * gemessenen Versatz auf die Audiozeit abgebildet.
 */
(function (global) {
  'use strict';
  var BB = global.BB = global.BB || {};

  var ctx = null;
  var ausgang = null;
  var puffer = {};
  var proben = [];
  var PROBEN_MAX = 90;
  var musik = { ereignisse: [], index: 0 };
  var quellen = [];

  /* ---------- Klangsynthese ---------- */

  function rauschen(saat) {
    var a = saat >>> 0;
    return function () {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      return a / 2147483648 - 1;
    };
  }

  function puffer1(c, dauer, fn) {
    var rate = c.sampleRate;
    var n = Math.max(1, Math.floor(dauer * rate));
    var b = c.createBuffer(1, n, rate);
    var d = b.getChannelData(0);
    var zustand = {};
    for (var i = 0; i < n; i++) d[i] = fn(i / rate, zustand);
    /* Sanftes Ausblenden am Ende gegen Knackser. */
    var aus = Math.min(n, Math.floor(0.004 * rate));
    for (var k = 0; k < aus; k++) d[n - 1 - k] *= k / aus;
    return b;
  }

  function erzeugeKlaenge(c) {
    var p = {};
    var rate = c.sampleRate;

    p.kick = puffer1(c, 0.42, function (t, s) {
      var f = 45 + 115 * Math.exp(-t * 28);
      s.phase = (s.phase || 0) + 2 * Math.PI * f / rate;
      var klick = t < 0.004 ? (1 - t / 0.004) * 0.5 : 0;
      return Math.sin(s.phase) * Math.exp(-t * 7.5) * 0.95 + klick;
    });

    var r1 = rauschen(7);
    p.snare = puffer1(c, 0.22, function (t, s) {
      var x = r1();
      var hoch = x - (s.vor || 0) * 0.75;
      s.vor = x;
      var ton = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30);
      return hoch * Math.exp(-t * 17) * 0.55 + ton * 0.45;
    });

    var r2 = rauschen(11);
    p.hihat = puffer1(c, 0.07, function (t, s) {
      var x = r2();
      var hoch = x - (s.vor || 0);
      s.vor = x;
      return hoch * Math.exp(-t * 70) * 0.5;
    });

    p.treffer = puffer1(c, 0.09, function (t, s) {
      var f = 880 + 520 * (t / 0.09);
      s.phase = (s.phase || 0) + 2 * Math.PI * f / rate;
      return (Math.sin(s.phase) + 0.3 * Math.sin(2 * s.phase)) * Math.exp(-t * 32) * 0.45;
    });

    p.fehlschlag = puffer1(c, 0.2, function (t, s) {
      var f = 150 - 60 * (t / 0.2);
      s.phase = (s.phase || 0) + f / rate;
      var saege = 2 * (s.phase - Math.floor(s.phase + 0.5));
      return Math.tanh(saege * 1.6) * Math.exp(-t * 13) * 0.35;
    });

    p.klick = puffer1(c, 0.035, function (t) {
      return Math.sin(2 * Math.PI * 1600 * t) * Math.exp(-t * 130) * 0.6;
    });

    p.akzent = puffer1(c, 0.045, function (t) {
      return Math.sin(2 * Math.PI * 2300 * t) * Math.exp(-t * 110) * 0.7;
    });

    /* Pratzen-Töne je Zone: dumpfer Schlag mit Tonhöhe, linke Seite tiefer als rechte. */
    var frequenzen = [196, 262, 220, 294, 247, 330];
    frequenzen.forEach(function (f, i) {
      var r = rauschen(31 + i);
      p['zone' + (i + 1)] = puffer1(c, 0.26, function (t, s) {
        var x = r();
        var dumpf = (s.tp = (s.tp || 0) * 0.85 + x * 0.15);
        var ton = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t);
        return (ton * Math.exp(-t * 14) * 0.5) + dumpf * Math.exp(-t * 40) * 1.4;
      });
    });

    /* Kurzer stiller Puffer zum Entsperren unter iOS. */
    p.stille = c.createBuffer(1, Math.max(1, Math.floor(rate * 0.02)), rate);
    return p;
  }

  /* ---------- Aufbau und Neuaufbau ---------- */

  function aufbauen() {
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    /* WebKit ab iOS 17: Ton auch bei eingeschaltetem Stummschalter. Ergänzt die native Audiositzung. */
    try {
      if (global.navigator && global.navigator.audioSession) global.navigator.audioSession.type = 'playback';
    } catch (e) { /* nicht verfügbar */ }
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
    ausgang = ctx.createGain();
    ausgang.gain.value = 0.9;
    ausgang.connect(ctx.destination);
    puffer = erzeugeKlaenge(ctx);
    proben = [];
    musik = { ereignisse: [], index: 0 };
    quellen = [];
    return true;
  }

  /* Schließt den bisherigen Kontext und baut alles neu auf (Pflicht in WKWebView nach Hintergrund). */
  function neuAufbauen() {
    var alt = ctx;
    ctx = null;
    if (alt) { try { alt.close(); } catch (e) { /* bereits geschlossen */ } }
    return aufbauen();
  }

  function entsperren() {
    if (!ctx && !aufbauen()) return Promise.resolve(false);
    var src = ctx.createBufferSource();
    src.buffer = puffer.stille;
    src.connect(ctx.destination);
    try { src.start(0); } catch (e) { /* egal */ }
    if (ctx.state === 'running') return Promise.resolve(true);
    proben = [];
    return ctx.resume().then(function () { proben = []; return ctx.state === 'running'; }, function () { return false; });
  }

  function bereit() { return !!ctx && ctx.state === 'running'; }

  function jetzt() { return ctx ? ctx.currentTime : 0; }

  /* ---------- Uhrabgleich performance -> Audiozeit ---------- */

  /* Wird einmal pro Bild aufgerufen. currentTime springt blockweise; das Minimum
   * des Abstands über ein gleitendes Fenster ist die beste Schätzung. */
  function abgleichen(perfMs) {
    if (!ctx || ctx.state !== 'running') return;
    proben.push(perfMs / 1000 - ctx.currentTime);
    if (proben.length > PROBEN_MAX) proben.shift();
  }

  function versatz() {
    if (!proben.length) return 0;
    var m = Infinity;
    for (var i = 0; i < proben.length; i++) if (proben[i] < m) m = proben[i];
    return m;
  }

  function uhrBereit() { return proben.length >= 10; }

  /* Wandelt einen Zeitstempel der performance-Uhr (Millisekunden) in Audiozeit (Sekunden). */
  function audioZeitVon(perfMs) {
    if (!proben.length) return jetzt();
    return perfMs / 1000 - versatz();
  }

  /* ---------- Abspielen ---------- */

  function spiele(name, wann, lautstaerke) {
    if (!ctx || !puffer[name]) return null;
    var src = ctx.createBufferSource();
    src.buffer = puffer[name];
    var g = ctx.createGain();
    g.gain.value = lautstaerke === undefined ? 1 : lautstaerke;
    src.connect(g);
    g.connect(ausgang);
    var start = Math.max(wann || 0, ctx.currentTime);
    src.start(start);
    quellen.push({ src: src, start: start });
    if (quellen.length > 256) quellen.splice(0, quellen.length - 256);
    return src;
  }

  /* ---------- Takt-Uhr ----------
   * Nimmt eine Liste { zeit, klaenge: [[name, lautstaerke], ...] } in Audiozeit
   * und plant sie mit Vorlauf ein. planen() wird pro Bild aufgerufen.
   */
  function musikStart(ereignisse) {
    musik = {
      ereignisse: ereignisse.slice().sort(function (a, b) { return a.zeit - b.zeit; }),
      index: 0
    };
  }

  function planen(bis) {
    if (!ctx) return;
    var ev = musik.ereignisse;
    while (musik.index < ev.length && ev[musik.index].zeit < bis) {
      var e = ev[musik.index++];
      if (e.zeit < ctx.currentTime - 0.05) continue;
      for (var i = 0; i < e.klaenge.length; i++) spiele(e.klaenge[i][0], e.zeit, e.klaenge[i][1]);
    }
  }

  function allesStoppen() {
    musik = { ereignisse: [], index: 0 };
    if (!ctx) return;
    var t = ctx.currentTime;
    quellen.forEach(function (q) {
      try { if (q.start > t) q.src.stop(); } catch (e) { /* schon beendet */ }
    });
    quellen = [];
  }

  function info() {
    return {
      zustand: ctx ? ctx.state : 'fehlt',
      rate: ctx ? ctx.sampleRate : 0,
      basisLatenz: ctx && ctx.baseLatency ? ctx.baseLatency : null
    };
  }

  BB.audio = {
    aufbauen: aufbauen,
    neuAufbauen: neuAufbauen,
    entsperren: entsperren,
    bereit: bereit,
    jetzt: jetzt,
    abgleichen: abgleichen,
    uhrBereit: uhrBereit,
    audioZeitVon: audioZeitVon,
    spiele: spiele,
    musikStart: musikStart,
    planen: planen,
    allesStoppen: allesStoppen,
    info: info
  };
})(typeof window !== 'undefined' ? window : this);
