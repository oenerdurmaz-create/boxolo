/* BeatBox — Web-Audio-Engine, Takt-Uhr, Klangerzeugung.
   Alle Klaenge werden zur Laufzeit erzeugt: Kick, Snare, Hi-Hat, Treffer, Fehlschlag, Metronom.
   Klangpuffer werden beim Start vorab erzeugt, nicht erst beim Abspielen.
   Der Taktgeber ist ausschliesslich AudioContext.currentTime. */
(function (root, factory) {
  var A = factory();
  root.BEATBOX_AUDIO = A;
  if (typeof module !== "undefined" && module.exports) { module.exports = A; }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var ctx = null;
  var master = null;
  var buffers = {};
  /* performance.now() zum Zeitpunkt der Context-Erzeugung.
     Damit lassen sich Eingabe-Zeitstempel (event.timeStamp, gleiche Zeitbasis)
     in die Audio-Zeit umrechnen. */
  var originPerf = 0;

  function nowPerf() {
    if (typeof performance !== "undefined" && performance.now) { return performance.now(); }
    return 0;
  }

  function makeContext() {
    var AC = root.AudioContext || root.webkitAudioContext;
    ctx = new AC();
    originPerf = nowPerf();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }

  /* Einen Klangpuffer mathematisch fuellen. */
  function render(dauer, fn) {
    var rate = ctx.sampleRate;
    var len = Math.max(1, Math.floor(dauer * rate));
    var buf = ctx.createBuffer(1, len, rate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { d[i] = fn(i / rate, i / len); }
    return buf;
  }

  function noiseBurst(dauer, decay, hp) {
    return render(dauer, function (t, p) {
      var n = Math.random() * 2 - 1;
      var v = n * Math.pow(1 - p, decay);
      if (hp) { v = v * (0.5 + 0.5 * Math.sin(2 * Math.PI * 6000 * t)); }
      return v;
    });
  }

  function buildBuffers() {
    if (buffers.kick) { return; } /* schon vorhanden */
    /* Kick: fallender Sinus 150 -> 50 Hz, plus Click */
    buffers.kick = render(0.14, function (t) {
      var f = 150 - 100 * Math.min(1, t / 0.1);
      return Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 28) * 0.9;
    });
    /* Snare: Rauschen + kleiner Ton */
    var sn = render(0.12, function (t) { return (Math.random() * 2 - 1) * Math.exp(-t * 30); });
    buffers.snare = sn;
    /* Hi-Hat: kurzes hochpassartiges Rauschen */
    buffers.hihat = render(0.04, function (t) {
      return (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.6;
    });
    /* Treffer: kurzer hoher Blip; Tonhoehe variiert leicht pro Zone */
    buffers.hit = render(0.06, function (t) { return Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 60); });
    buffers.hit2 = render(0.06, function (t) { return Math.sin(2 * Math.PI * 1174 * t) * Math.exp(-t * 60); });
    /* Fehlschlag: tiefer Summton */
    buffers.miss = render(0.2, function (t) { return Math.sin(2 * Math.PI * 110 * t) * Math.exp(-t * 14) * 0.8; });
    /* Metronom-Tic hoeher */
    buffers.tick = render(0.03, function (t) { return Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-t * 90); });
    /* Akzent-Tic */
    buffers.accent = render(0.05, function (t) { return Math.sin(2 * Math.PI * 1318 * t) * Math.exp(-t * 70); });
  }

  function playBuffer(name, when, gainValue, rate) {
    if (!ctx || !buffers[name]) { return; }
    var src = ctx.createBufferSource();
    src.buffer = buffers[name];
    if (rate) { src.playbackRate.value = rate; }
    var g = ctx.createGain();
    g.gain.value = gainValue === undefined ? 1 : gainValue;
    src.connect(g);
    g.connect(master);
    src.start(Math.max(when, ctx.currentTime));
  }

  return {
    /* Kontext erzeugen/anfassen (muss in einer Nutzergeste geschehen). */
    ensure: function () {
      if (!ctx) { makeContext(); }
      buildBuffers();
      if (ctx.state === "suspended") { ctx.resume(); }
      return ctx;
    },
    /* Vollstaendiger Neuaufbau — noetig nach Wiedereintritt in den Vordergrund,
       weil Anhalten/Fortsetzen in WKWebView den Ton sonst stumm laesst. */
    rebuild: function () {
      if (ctx) {
        try { ctx.close(); } catch (e) { /* bereits geschlossen */ }
        ctx = null; master = null;
      }
      makeContext();
      buildBuffers();
      if (ctx.state === "suspended") { ctx.resume(); }
    },
    getState: function () { return ctx ? ctx.state : "none"; },
    /* Audio-Zeit in Sekunden. */
    getTime: function () { return ctx ? ctx.currentTime : 0; },
    /* Umrechnung eines Eingabe-Zeitstempels (event.timeStamp, ms, gleiche
       Zeitbasis wie performance.now()) in die Audio-Zeit. */
    stampToAudioTime: function (stampMs) {
      if (!ctx) { return 0; }
      return (stampMs - originPerf) / 1000;
    },
    /* Klaenge sofort */
    hit: function (zone) { playBuffer(zone % 2 === 0 ? "hit2" : "hit", 0, 0.9, 1 + (zone - 1) * 0.04); },
    miss: function () { playBuffer("miss", 0, 0.9); },
    tick: function () { playBuffer("tick", 0, 0.7); },
    /* Klaenge zu einem exakten Audio-Zeitpunkt (Voraus-Scheduling). */
    playAt: function (name, audioTime, gainValue) { playBuffer(name, audioTime, gainValue); },
    kickAt: function (t) { playBuffer("kick", t, 0.7); },
    snareAt: function (t) { playBuffer("snare", t, 0.5); },
    hihatAt: function (t) { playBuffer("hihat", t, 0.35); },
    tickAt: function (t) { playBuffer("tick", t, 0.8); },
    accentAt: function (t) { playBuffer("accent", t, 0.8); }
  };
});
