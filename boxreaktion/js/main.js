/* BeatBox — Bildschirmverwaltung, Eingabe, Render-Loop, Kalibrierung, Verlauf. */
(function () {
  "use strict";

  var I18N = window.BEATBOX_I18N;
  var STORAGE = window.BEATBOX_STORAGE;
  var LEVELS = window.BEATBOX_LEVELS;
  var validateLevel = window.BEATBOX_validateLevel;
  var AUDIO = window.BEATBOX_AUDIO;
  var GAME = window.BEATBOX_GAME;

  var lang = STORAGE.getLanguage();
  var currentScreen = "menu";
  var ausgewaehlterModus = null;
  var laufendesLevel = null;
  var calibration = null; /* {soll: number[], ist: [], aktiv: bool} */

  function t(schluessel, params) {
    var satz = (I18N[lang] && I18N[lang][schluessel]) || schluessel;
    if (params) {
      Object.keys(params).forEach(function (k) {
        satz = satz.replace("{" + k + "}", params[k]);
      });
    }
    return satz;
  }

  function $(id) { return document.getElementById(id); }
  function alleZonen() { return Array.prototype.slice.call(document.querySelectorAll(".zone")); }

  /* ---------- Bildschirme ---------- */
  var SCREENS = ["menu", "levels", "game", "result", "help", "history", "calib"];
  function zeige(screen) {
    currentScreen = screen;
    SCREENS.forEach(function (s) {
      $("screen-" + s).classList.toggle("hidden", s !== screen);
    });
    $("btn-back").classList.toggle("hidden", screen === "menu");
    if (screen === "history") { zeichneVerlauf(); }
    if (screen === "menu") { aktualisiereCalibStatus(); }
  }

  function setzeTexte() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    $("btn-lang").textContent = lang === "de" ? "EN" : "DE";
    alleZonen().forEach(function (z) {
      z.querySelector(".zlabel").textContent = t("zone_" + z.getAttribute("data-zone"));
    });
    baueModusliste();
    if (ausgewaehlterModus) { baueLevelGrid(); }
  }

  /* ---------- Menü ---------- */
  var MODI = ["reaktion", "timing", "kombination", "ausdauer", "rhythmus"];
  function baueModusliste() {
    var box = $("mode-list");
    box.innerHTML = "";
    MODI.forEach(function (m) {
      var b = document.createElement("button");
      b.className = "modebtn";
      var h = document.createElement("h3");
      h.textContent = t("mode_" + m);
      var p = document.createElement("p");
      p.textContent = t("mode_desc_" + m);
      b.appendChild(h);
      b.appendChild(p);
      b.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        AUDIO.ensure();
        ausgewaehlterModus = m;
        baueLevelGrid();
        zeige("levels");
      });
      box.appendChild(b);
    });
  }

  function levelFuer(modus, n) {
    for (var i = 0; i < LEVELS.length; i++) {
      if (LEVELS[i].modus === modus && LEVELS[i].level === n) { return LEVELS[i]; }
    }
    return null;
  }

  function baueLevelGrid() {
    $("levels-mode-title").textContent = t("mode_" + ausgewaehlterModus);
    $("levels-desc").textContent = t("mode_desc_" + ausgewaehlterModus);
    var grid = $("level-grid");
    grid.innerHTML = "";
    for (var n = 1; n <= 10; n++) {
      (function (lvl) {
        var b = document.createElement("button");
        b.className = "levelbtn";
        b.textContent = t("level_x", { n: lvl });
        b.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          AUDIO.ensure();
          starteSpiel(ausgewaehlterModus, lvl);
        });
        grid.appendChild(b);
      })(n);
    }
    var best = $("best-score");
    var bestTxt = "";
    for (var n2 = 1; n2 <= 10; n2++) {
      var e = STORAGE.getBest(ausgewaehlterModus, n2);
      if (e) { bestTxt += t("level_x", { n: n2 }) + ": " + e.punkte + "   "; }
    }
    best.textContent = bestTxt ? (t("best_label") + ": " + bestTxt) : t("no_scores_yet");
  }

  /* ---------- Spielstart / Ergebnis ---------- */
  function starteSpiel(modus, lvl) {
    var levelDef = levelFuer(modus, lvl);
    var res = GAME.start(modus, levelDef, STORAGE.getCalibration(), AUDIO.getTime() + 0.1, validateLevel);
    if (res.fehler) {
      zeige("menu");
      return;
    }
    laufendesLevel = { modus: modus, lvl: lvl };
    $("distractor-note").classList.toggle("hidden", !(levelDef.stoerziele > 0));
    zeige("game");
  }

  function zeigeErgebnis() {
    var s = GAME.getState();
    if (!s) { return; }
    var e = GAME.beenden();
    var lv = s.level;
    var name = t("mode_" + s.modus) + " " + t("level_x", { n: lv.level });
    STORAGE.saveScore(s.modus, lv.level, {
      name: name, punkte: e.punkte, quote: e.quote, besteSerie: e.besteSerie,
      avgReaction: e.avgReaction, datum: new Date().toISOString()
    });
    STORAGE.addHistory({ datum: new Date().toISOString(), avgReaction: e.avgReaction, modus: s.modus, level: lv.level });
    var liste = $("result-list");
    liste.innerHTML = "";
    function zeile(label, wert) {
      var dt = document.createElement("dt"); dt.textContent = label;
      var dd = document.createElement("dd"); dd.textContent = wert;
      liste.appendChild(dt); liste.appendChild(dd);
    }
    zeile(t("result_score"), e.punkte);
    zeile(t("result_accuracy"), e.quote + " " + t("unit_percent") + " (" + t("hits_of", { a: e.treffer, b: e.ziele }) + ")");
    zeile(t("result_best_streak"), e.besteSerie);
    if (e.avgReaction > 0) {
      zeile(t("result_avg_reaction"), e.avgReaction + " " + t("unit_ms"));
      zeile(t("result_min_reaction"), e.minReaction + " " + t("unit_ms"));
      zeile(t("result_max_reaction"), e.maxReaction + " " + t("unit_ms"));
    }
    if (s.modus === "ausdauer") {
      zeile(t("result_punches"), e.schlaege);
      zeile(t("result_ppm"), e.ppm);
    }
    zeige("result");
  }

  /* ---------- Eingabe ---------- */
  alleZonen().forEach(function (z) {
    z.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      var zone = parseInt(z.getAttribute("data-zone"), 10);
      if (currentScreen === "game") {
        AUDIO.ensure();
        var tAudio = AUDIO.stampToAudioTime(ev.timeStamp);
        var r = GAME.onTap(zone, tAudio, AUDIO);
        if (r && navigator.vibrate) {
          navigator.vibrate(r.urteil === "miss" ? [40, 30, 40] : 25);
        }
      } else if (currentScreen === "calib" && calibration && calibration.aktiv) {
        kalibrierTipp(ev);
      } else if (currentScreen === "calib") {
        AUDIO.ensure();
      } else {
        AUDIO.ensure();
      }
    });
  });

  /* ---------- Render-Loop (einziges Zeitrad) ---------- */
  var letzteView = null;
  function loop() {
    requestAnimationFrame(loop);
    if (currentScreen !== "game") { return; }
    var now = AUDIO.getTime();
    GAME.tick(now, AUDIO);
    var v = GAME.view();
    if (!v) { return; }
    letzteView = v;

    $("hud-score").textContent = v.punkte;
    $("hud-hits").textContent = t("hits_of", { a: v.treffer, b: Math.max(v.ziele, v.treffer) });
    $("hud-streak").textContent = t("series_x", { n: v.serie }) + " · " + t("multiplier_x", { x: v.multiplikator });

    var s = GAME.getState();
    var rest = s && s.endeZeit ? Math.max(0, Math.ceil(s.endeZeit - now)) : null;
    var zeitEl = $("hud-time");
    if (s && s.modus === "ausdauer" && rest !== null) {
      zeitEl.classList.remove("hidden");
      zeitEl.textContent = t("time_left", { s: rest });
    } else {
      zeitEl.classList.add("hidden");
    }

    /* Zonen */
    alleZonen().forEach(function (z) {
      var n = parseInt(z.getAttribute("data-zone"), 10);
      var ring = z.querySelector(".ring");
      z.classList.remove("lit", "distractor", "ringing");
      ring.classList.remove("active");
      var status = v.zonenAn[n];
      if (status === "hell") { z.classList.add("lit"); }
      else if (status === "stoer") { z.classList.add("distractor"); }
      else if (status === "ring") { z.classList.add("ringing"); }
      if (v.ring && v.ring.zone === n) {
        ring.classList.add("active");
        var skala = 2.4 - 1.4 * Math.min(1, Math.max(0, v.ring.progress));
        ring.style.transform = "scale(" + skala.toFixed(3) + ")";
      }
    });

    /* Feedback */
    var fb = $("feedback");
    if (v.feedback) {
      fb.textContent = t(v.feedback.schluessel);
      fb.className = v.feedback.schluessel.replace("verdict_", "");
      if (!v.feedback.bis) { v.feedback.bis = now + 0.6; }
    } else {
      fb.textContent = "";
      fb.className = "";
    }

    /* Meldungen */
    var msg = $("big-message");
    if (v.meldung) {
      msg.classList.remove("hidden");
      msg.textContent = t(v.meldung);
    } else {
      msg.classList.add("hidden");
    }

    /* Kombinationsleiste */
    var strip = $("combo-strip");
    if (v.folge && s && s.modus === "kombination") {
      strip.classList.remove("hidden");
      var seq = $("combo-seq");
      seq.innerHTML = "";
      v.folge.forEach(function (zz, i) {
        var sp = document.createElement("span");
        sp.textContent = zz;
        if (i < v.seqPos) { sp.className = "done"; }
        seq.appendChild(sp);
      });
    } else {
      strip.classList.add("hidden");
    }

    if (v.beendet) { zeigeErgebnis(); }
  }

  /* ---------- Kalibrierung ---------- */
  var CALIB_BEATS = 8;
  var CALIB_INTERVALL_MS = 600;
  function starteKalibrierung() {
    AUDIO.ensure();
    calibration = { soll: [], ist: [], aktiv: true, naechste: 0, index: 0 };
    var start = AUDIO.getTime() + 1.0;
    for (var i = 0; i < CALIB_BEATS; i++) {
      var zeit = start + i * (CALIB_INTERVALL_MS / 1000);
      calibration.soll.push(zeit);
      AUDIO.tickAt(zeit);
    }
    calibration.ende = start + CALIB_BEATS * (CALIB_INTERVALL_MS / 1000) + 1.0;
    $("calib-feedback").classList.remove("hidden");
    $("calib-feedback").textContent = t("calib_tap_now");
  }

  function kalibrierTipp(ev) {
    if (!calibration || !calibration.aktiv) { return; }
    var tAudio = AUDIO.stampToAudioTime(ev.timeStamp);
    var idx = calibration.index;
    if (idx >= calibration.soll.length) { return; }
    /* naechster noch nicht getippter Beat */
    while (idx < calibration.soll.length && calibration.ist[idx] !== undefined) { idx++; }
    if (idx >= calibration.soll.length) { return; }
    var abw = (tAudio - calibration.soll[idx]) * 1000;
    if (Math.abs(abw) > CALIB_INTERVALL_MS / 2) { return; } /* offensichtlich daneben */
    calibration.ist[idx] = abw;
    calibration.index = idx + 1;
    if (calibration.ist.filter(function (x) { return x !== undefined; }).length >= CALIB_BEATS) {
      var werte = calibration.ist.slice().sort(function (a, b) { return a - b; });
      var median = werte[Math.floor(werte.length / 2)];
      STORAGE.setCalibration(Math.round(median));
      calibration.aktiv = false;
      $("calib-feedback").textContent = t("calib_done") + " " + t("calib_offset", { v: Math.round(median) });
      aktualisiereCalibStatus();
    }
  }

  function kalibrierLoop() {
    if (calibration && calibration.aktiv && AUDIO.getTime() > calibration.ende) {
      var anzahl = calibration.ist.filter(function (x) { return x !== undefined; }).length;
      if (anzahl < 4) {
        $("calib-feedback").textContent = t("calib_again");
      } else {
        var werte = calibration.ist.filter(function (x) { return x !== undefined; }).sort(function (a, b) { return a - b; });
        var median = werte[Math.floor(werte.length / 2)];
        STORAGE.setCalibration(Math.round(median));
        $("calib-feedback").textContent = t("calib_done") + " " + t("calib_offset", { v: Math.round(median) });
        aktualisiereCalibStatus();
      }
      calibration.aktiv = false;
    }
    requestAnimationFrame(kalibrierLoop);
  }

  function aktualisiereCalibStatus() {
    var v = STORAGE.getCalibration();
    $("calib-value").textContent = v !== 0 ? t("calib_offset", { v: v }) : t("calib_none");
    $("calib-status").textContent = $("calib-value").textContent;
  }

  /* ---------- Verlauf (Inline-SVG) ---------- */
  function zeichneVerlauf() {
    var box = $("history-chart");
    var serie = STORAGE.getHistorySeries();
    if (!serie.some(function (d) { return d.wert !== null; })) {
      box.innerHTML = '<p class="hint">' + t("history_empty") + "</p>";
      return;
    }
    var werte = serie.map(function (d) { return d.wert; });
    var min = Math.min.apply(null, werte.filter(function (w) { return w !== null; }));
    var max = Math.max.apply(null, werte.filter(function (w) { return w !== null; }));
    if (min === max) { min -= 10; max += 10; }
    var W = 340, H = 160, PAD = 26;
    function x(i) { return PAD + i * (W - 2 * PAD) / (serie.length - 1); }
    function y(w) { return H - PAD - (w - min) * (H - 2 * PAD) / (max - min); }
    var punkte = [];
    serie.forEach(function (d, i) { if (d.wert !== null) { punkte.push(x(i).toFixed(1) + "," + y(d.wert).toFixed(1)); } });
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" role="img">';
    svg += '<line x1="' + PAD + '" y1="' + (H - PAD) + '" x2="' + (W - PAD) + '" y2="' + (H - PAD) + '" stroke="#2a3a52"/>';
    svg += '<line x1="' + PAD + '" y1="' + PAD + '" x2="' + PAD + '" y2="' + (H - PAD) + '" stroke="#2a3a52"/>';
    svg += '<text x="4" y="' + (PAD + 4) + '" fill="#7c8aa0" font-size="9">' + max + '</text>';
    svg += '<text x="4" y="' + (H - PAD) + '" fill="#7c8aa0" font-size="9">' + min + '</text>';
    if (punkte.length > 1) {
      svg += '<polyline fill="none" stroke="#ffd166" stroke-width="2" points="' + punkte.join(" ") + '"/>';
    }
    serie.forEach(function (d, i) {
      if (d.wert !== null) { svg += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(d.wert).toFixed(1) + '" r="2.5" fill="#ffd166"/>'; }
    });
    svg += '<text x="' + PAD + '" y="' + (H - 6) + '" fill="#7c8aa0" font-size="9">' + serie[0].label + '</text>';
    svg += '<text x="' + (W - PAD - 34) + '" y="' + (H - 6) + '" fill="#7c8aa0" font-size="9">' + serie[serie.length - 1].label + '</text>';
    svg += "</svg>";
    box.innerHTML = svg;
  }

  /* ---------- Hilfe ---------- */
  function zeigeHilfe() {
    $("help-text").textContent = t("help_text");
    zeige("help");
  }

  /* ---------- Wiedereintritt in den Vordergrund ---------- */
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      AUDIO.rebuild(); /* vollstaendiger Neuaufbau, sonst bleibt der Ton in WKWebView stumm */
    }
  });
  window.addEventListener("pageshow", function () { AUDIO.rebuild(); });

  /* ---------- Verdrahtung ---------- */
  $("btn-back").addEventListener("pointerdown", function (ev) {
    ev.preventDefault();
    if (currentScreen === "game") { GAME.beenden(); }
    zeige("menu");
  });
  $("btn-lang").addEventListener("pointerdown", function (ev) {
    ev.preventDefault();
    lang = lang === "de" ? "en" : "de";
    STORAGE.setLanguage(lang);
    setzeTexte();
  });
  $("btn-open-help").addEventListener("pointerdown", function (ev) { ev.preventDefault(); zeigeHilfe(); });
  $("btn-open-history").addEventListener("pointerdown", function (ev) { ev.preventDefault(); zeige("history"); });
  $("btn-open-calib").addEventListener("pointerdown", function (ev) { ev.preventDefault(); zeige("calib"); });
  $("btn-calib-start").addEventListener("pointerdown", function (ev) { ev.preventDefault(); starteKalibrierung(); });
  $("btn-again").addEventListener("pointerdown", function (ev) {
    ev.preventDefault();
    if (laufendesLevel) { starteSpiel(laufendesLevel.modus, laufendesLevel.lvl); }
  });
  $("btn-tomenu").addEventListener("pointerdown", function (ev) { ev.preventDefault(); zeige("menu"); });

  /* Start */
  setzeTexte();
  aktualisiereCalibStatus();
  zeige("menu");
  requestAnimationFrame(loop);
  requestAnimationFrame(kalibrierLoop);
})();
