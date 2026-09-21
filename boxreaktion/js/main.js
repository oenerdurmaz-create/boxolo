"use strict";
/* BeatBox - Oberflaeche, Navigation, Eingabe, Zeichnung.
   Eingaben auf den Zonen laufen ueber pointerdown mit event.timeStamp.
   Der Bildschirmtakt (requestAnimationFrame) treibt Soundplaner und Logik. */

(function () {
  const $ = id => document.getElementById(id);
  const MODI_LISTE = ["reaktion", "timing", "kombination", "ausdauer", "rhythmus"];
  const SCREENS = ["menu", "modes", "levels", "game", "pause", "result", "highscores", "history", "calibrate", "help"];

  let sprache = Store.sprache() === "en" ? "en" : "de";
  let aktuellerScreen = "menu";
  let gewaehlterModus = "reaktion";
  let aktuelleMap = null;
  let letztesErgebnis = null;
  let hsModus = "reaktion", hsLevel = 1;
  let letzterZustand = "", losFrames = 0, previewFrames = 0;
  const zoneEls = [];
  const Kalib = { aktiv: false, taps: [], letzterBeat: -999 };

  /* ---------- Texte ---------- */
  function t(pfad, ersetzung) {
    let knoten = TEXTS[sprache];
    const teile = pfad.split(".");
    for (const teil of teile) {
      if (knoten == null) return pfad;
      knoten = knoten[teil];
    }
    let s = (typeof knoten === "string") ? knoten : pfad;
    if (ersetzung) for (const k in ersetzung) s = s.split("{" + k + "}").join(String(ersetzung[k]));
    return s;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function gross(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function texteAnwenden() {
    document.documentElement.lang = sprache;
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.getAttribute("data-i18n")); });
    $("btnLangDE").classList.toggle("aktiv", sprache === "de");
    $("btnLangEN").classList.toggle("aktiv", sprache === "en");
    kalibrierungAnzeigen();
    modusListeRendern();
    hilfeRendern();
  }

  /* ---------- Navigation ---------- */
  function zeige(name) {
    SCREENS.forEach(s => $("screen-" + s).classList.toggle("versteckt", s !== name));
    $("btnBack").classList.toggle("versteckt", name === "menu");
    aktuellerScreen = name;
  }

  /* ---------- Audio ---------- */
  function audioBereit() {
    if (!AudioEngine.erzeugt()) AudioEngine.bauen();
    AudioEngine.fortsetzen();
    AudioEngine.sync();
  }

  /* ---------- Menue / Auswahllisten ---------- */
  function kalibrierungAnzeigen() {
    const k = Store.kalibrierungMs();
    $("calibInfo").textContent = k == null ? t("menu.calibNone") : t("menu.calibValue", { ms: k });
  }

  function modusListeRendern() {
    const box = $("modeList"); box.innerHTML = "";
    for (const m of MODI_LISTE) {
      const b = document.createElement("button");
      b.className = "moduskarte modus-" + m;
      b.innerHTML = "<b>" + esc(t("modes." + m)) + "</b><span>" + esc(t("modes.desc" + gross(m))) + "</span>";
      b.addEventListener("click", () => { gewaehlterModus = m; levelsListeRendern(); zeige("levels"); });
      box.appendChild(b);
    }
  }

  function levelsListeRendern() {
    $("levelsTitle").textContent = t("modes." + gewaehlterModus) + " · " + t("levels.title");
    const box = $("levelList"); box.innerHTML = "";
    for (let l = 1; l <= 10; l++) {
      const karte = Levels.BEATMAPS.find(x => x.modus === gewaehlterModus && x.level === l);
      if (!karte) continue;
      const b = document.createElement("button");
      b.className = "levelknopf";
      b.innerHTML = "<b>" + esc(t("levels.level", { n: l })) + "</b><span>" +
        karte.bpm + " BPM · ±" + karte.trefferfenster_ms + " ms</span>";
      b.addEventListener("click", () => levelStarten(karte));
      box.appendChild(b);
    }
  }

  /* ---------- Spiel ---------- */
  function levelStarten(karte) {
    audioBereit();
    Game.start(karte, { onJudge: urteilZeigen, onEnde: rundeBeendet });
    aktuelleMap = karte;
    letzterZustand = ""; losFrames = 0; previewFrames = 0;
    zeige("game");
  }

  function urteilZeigen(zone, key, ms, richt) {
    const el = zoneEls[zone]; if (!el) return;
    const div = document.createElement("div");
    div.className = "urteil urteil-" + key;
    let text = t("judge." + key);
    if (ms != null) {
      const r = Math.round(ms);
      text += " " + (r < 0 ? "−" : "+") + Math.abs(r) + " ms";
      if (Math.abs(ms) > 40 && richt) text += " · " + t("judge." + richt);
    } else if (richt) text += " · " + t("judge." + richt);
    div.textContent = text;
    div.addEventListener("animationend", () => div.remove());
    el.appendChild(div);
    if (navigator.vibrate) { try { navigator.vibrate(key === "perfect" ? 12 : key === "miss" ? 40 : 25); } catch (e) { /* nicht verfuegbar */ } }
  }

  function rundeBeendet(erg) {
    letztesErgebnis = erg;
    $("resMode").textContent = t("modes." + erg.modus) + " · " + t("levels.level", { n: erg.level });
    $("resScore").textContent = String(erg.punkte);
    $("resQuote").textContent = erg.quote + "%";
    $("resHits").textContent = erg.treffer + "/" + erg.zieleGesamt;
    $("resStreak").textContent = String(erg.serie);
    $("resReaction").textContent = erg.reaktionMittel != null ? erg.reaktionMittel + " ms" : "–";
    $("rowBest").hidden = erg.reaktionBest == null;
    $("rowWorst").hidden = erg.reaktionSchlechtest == null;
    $("resBest").textContent = erg.reaktionBest != null ? erg.reaktionBest + " ms" : "–";
    $("resWorst").textContent = erg.reaktionSchlechtest != null ? erg.reaktionSchlechtest + " ms" : "–";
    $("rowSpm").hidden = erg.spm == null;
    $("resSpm").textContent = erg.spm != null ? String(erg.spm) : "–";
    $("resName").value = Store.name();
    $("btnSave").disabled = false;
    $("btnSave").textContent = t("result.save");
    if (erg.reaktionMittel != null) Store.verlaufEintragen(erg.reaktionMittel);
    zeige("result");
  }

  /* ---------- Bildschirmtakt ---------- */
  function schleife() {
    AudioEngine.sync();
    AudioEngine.Clock.tick(AudioEngine.now());
    if (aktuellerScreen === "game") {
      Game.update(AudioEngine.now());
      hudUndZonen(Game.zustandFuerUi(AudioEngine.now()));
    } else if (aktuellerScreen === "pause") {
      hudUndZonen(Game.zustandFuerUi(AudioEngine.now()));
    }
    requestAnimationFrame(schleife);
  }

  function hudUndZonen(z) {
    $("hudScore").textContent = String(z.punkte);
    $("hudHits").textContent = z.treffer + "/" + z.zieleGesamt;
    let extra = z.bpmJetzt + " BPM";
    if (z.restSek != null) extra = z.restSek + " s · " + z.bpmJetzt + " BPM";
    else if (z.trialNr != null && aktuelleMap) extra = z.trialNr + "/" + aktuelleMap.ziel_anzahl;
    $("hudExtra").textContent = extra;

    for (let i = 1; i <= 6; i++) {
      const el = zoneEls[i];
      const offen = z.offene.filter(o => o.zone === i);
      const ring = el.querySelector(".ring");
      if (offen.length) {
        const o = offen[0];
        el.classList.add("aktiv");
        el.classList.toggle("leuchtet", o.ringMs === 0);
        if (o.ringMs > 0) {
          ring.hidden = false;
          const groesse = 34 + o.fort * (el.clientWidth * 0.85);
          ring.style.width = groesse + "px";
          ring.style.height = groesse + "px";
        } else ring.hidden = true;
      } else {
        el.classList.remove("aktiv", "leuchtet");
        ring.hidden = true;
      }
      el.classList.toggle("stoerung", z.stoer.indexOf(i) >= 0);
    }

    const ov = $("overlayMsg");
    if (z.zustand === "vorlaeufer") {
      ov.hidden = false;
      ov.textContent = t("game.ready") + " " + Math.max(1, z.countdown || 1);
    } else if (previewFrames > 0) {
      ov.hidden = false;
      ov.textContent = "→ " + t("common.zone", { z: z.preview || letztePreview });
      previewFrames--;
    } else if (losFrames > 0) {
      ov.hidden = false;
      ov.textContent = t("game.tapNow");
      losFrames--;
    } else ov.hidden = true;
    if (z.preview > 0) { letztePreview = z.preview; previewFrames = 20; }
    if (letzterZustand === "vorlaeufer" && z.zustand === "laeuft") losFrames = 45;
    letzterZustand = z.zustand;

    seqbarZeichnen(z);
  }
  let letztePreview = 0;

  function dotHtml(zone, aktiv) {
    return "<span class='punkt z" + zone + (aktiv ? " punkt-aktiv" : "") + "'></span>";
  }
  function seqbarZeichnen(z) {
    const bar = $("seqbar");
    if (!aktuelleMap || (aktuelleMap.modus !== "rhythmus" && aktuelleMap.modus !== "kombination")) { bar.innerHTML = ""; return; }
    if (aktuelleMap.modus === "kombination") {
      const lauft = z.kombiDurchlauf < (aktuelleMap.durchlaeufe || 3);
      const dots = aktuelleMap.sequenz.map((zn, i) => dotHtml(zn, lauft && i === z.kombiPos)).join("");
      bar.innerHTML = "<span class='seqinfo'>" + Math.min(aktuelleMap.durchlaeufe || 3, z.kombiDurchlauf + 1) + "/" + (aktuelleMap.durchlaeufe || 3) + "</span>" + dots;
    } else {
      const kommend = z.offene.slice().sort((a, b) => a.restMs - b.restMs).slice(0, 8);
      bar.innerHTML = kommend.map(o => dotHtml(o.zone, o.restMs < 400)).join("");
    }
  }

  /* ---------- Bestenliste ---------- */
  function hsRendern() {
    const tabs = $("hsModeTabs"); tabs.innerHTML = "";
    for (const m of MODI_LISTE) {
      const b = document.createElement("button");
      b.className = "tab" + (m === hsModus ? " tab-aktiv" : "");
      b.textContent = t("modes." + m);
      b.addEventListener("click", () => { hsModus = m; hsLevel = 1; hsRendern(); });
      tabs.appendChild(b);
    }
    const lv = $("hsLevelTabs"); lv.innerHTML = "";
    for (let l = 1; l <= 10; l++) {
      const b = document.createElement("button");
      b.className = "tab" + (l === hsLevel ? " tab-aktiv" : "");
      b.textContent = String(l);
      b.addEventListener("click", () => { hsLevel = l; hsRendern(); });
      lv.appendChild(b);
    }
    const liste = Store.punkte(hsModus, hsLevel);
    const box = $("hsTable");
    if (!liste.length) { box.innerHTML = "<p class='leerzeile'>" + esc(t("hs.empty")) + "</p>"; return; }
    let html = "<table><thead><tr><th>" + esc(t("hs.rank")) + "</th><th>" + esc(t("hs.name")) +
      "</th><th>" + esc(t("hs.points")) + "</th><th>" + esc(t("hs.acc")) + "</th><th>" + esc(t("hs.streak")) +
      "</th><th>" + esc(t("hs.reaction")) + "</th><th>" + esc(t("hs.date")) + "</th></tr></thead><tbody>";
    liste.forEach((eintrag, i) => {
      html += "<tr><td>" + (i + 1) + "</td><td>" + esc(eintrag.name) + "</td><td>" + eintrag.punkte +
        "</td><td>" + eintrag.quote + "%</td><td>" + eintrag.serie + "</td><td>" +
        (eintrag.reaktion ? eintrag.reaktion + " ms" : "–") + "</td><td>" + eintrag.datum + "</td></tr>";
    });
    box.innerHTML = html + "</tbody></table>";
  }

  /* ---------- Verlauf (Inline-SVG) ---------- */
  function verlaufRendern() {
    const tage = Store.verlauf30();
    const box = $("historyChart");
    $("histInfo").textContent = tage.length ? "" : t("hist.empty");
    if (!tage.length) { box.innerHTML = ""; return; }
    const w = 320, h = 160, padL = 36, padR = 10, padO = 12, padU = 24;
    const werte = tage.map(x => x.mittel);
    let min = Math.min.apply(null, werte), max = Math.max.apply(null, werte);
    if (max - min < 60) { const m = (max + min) / 2; min = m - 30; max = m + 30; }
    const xAt = i => padL + (tage.length === 1 ? 0 : i * (w - padL - padR) / (tage.length - 1));
    const yAt = v => h - padU - (v - min) / (max - min) * (h - padO - padU);
    let punkte = "";
    tage.forEach((tag, i) => {
      punkte += "<circle cx='" + xAt(i).toFixed(1) + "' cy='" + yAt(tag.mittel).toFixed(1) + "' r='2.5' class='diag-punkt'/>";
    });
    const poly = tage.map((tag, i) => xAt(i).toFixed(1) + "," + yAt(tag.mittel).toFixed(1)).join(" ");
    box.innerHTML =
      "<svg viewBox='0 0 " + w + " " + h + "' class='diagramm-svg' role='img'>" +
      "<line x1='" + padL + "' y1='" + (h - padU) + "' x2='" + (w - padR) + "' y2='" + (h - padU) + "' class='diag-achse'/>" +
      "<polyline points='" + poly + "' class='diag-linie'/>" + punkte +
      "<text x='" + padL + "' y='" + (padO + 4) + "' class='diag-text'>" + Math.round(max) + " ms</text>" +
      "<text x='" + padL + "' y='" + (h - padU - 4) + "' class='diag-text'>" + Math.round(min) + " ms</text>" +
      "<text x='" + padL + "' y='" + (h - 6) + "' class='diag-text'>" + esc(tage[0].datum) + "</text>" +
      "<text x='" + (w - padR) + "' y='" + (h - 6) + "' text-anchor='end' class='diag-text'>" + esc(tage[tage.length - 1].datum) + "</text>" +
      "</svg>";
  }

  /* ---------- Hilfe ---------- */
  function hilfeRendern() {
    const teile = [];
    teile.push("<p>" + esc(t("help.intro")) + "</p>");
    teile.push("<h3>" + esc(t("help.zonesTitle")) + "</h3><ul>");
    ["one", "two", "three", "four", "five", "six"].forEach((n, i) => {
      teile.push("<li>" + (i + 1) + " · " + esc(t("zones." + n)) + "</li>");
    });
    teile.push("</ul>");
    teile.push("<h3>" + esc(t("help.modesTitle")) + "</h3>");
    for (const m of MODI_LISTE) {
      teile.push("<p><b>" + esc(t("modes." + m)) + ":</b> " + esc(t("help." + m)) + "</p>");
    }
    teile.push("<h3>" + esc(t("help.scoringTitle")) + "</h3><p>" + esc(t("help.scoring")) + "</p>");
    teile.push("<h3>" + esc(t("help.calibTitle")) + "</h3><p>" + esc(t("help.calib")) + "</p>");
    teile.push("<p>" + esc(t("help.calibHint")) + "</p>");
    teile.push("<p class='leerzeile'>" + esc(t("help.privacy")) + "</p>");
    $("helpContent").innerHTML = teile.join("");
  }

  /* ---------- Kalibrierung ---------- */
  function kalibStart() {
    audioBereit();
    Kalib.aktiv = true; Kalib.taps = []; Kalib.letzterBeat = -999;
    AudioEngine.Clock.setzen(90, AudioEngine.now() + 0.6, 0, true, false, 0);
    $("calTapArea").classList.remove("versteckt");
    $("calResult").textContent = "";
    $("calStatus").textContent = t("cal.tapping", { n: 0 });
    $("btnCalAgain").classList.add("versteckt");
  }
  function kalibAuswerten() {
    Kalib.aktiv = false;
    AudioEngine.Clock.stoppen();
    const s = Kalib.taps.slice().sort((a, b) => a - b);
    const median = Math.round((s[3] + s[4]) / 2);
    Store.kalibrierungSetzen(median);
    $("calResult").textContent = t("cal.result", { ms: median }) + " " + (median >= 0 ? t("cal.positive") : t("cal.negative"));
    $("calTapArea").classList.add("versteckt");
    $("btnCalAgain").classList.remove("versteckt");
    kalibrierungAnzeigen();
  }

  /* ---------- Ereignisse ---------- */
  function verdrahte() {
    $("btnLangDE").addEventListener("click", () => { sprache = "de"; Store.spracheSetzen("de"); texteAnwenden(); });
    $("btnLangEN").addEventListener("click", () => { sprache = "en"; Store.spracheSetzen("en"); texteAnwenden(); });
    $("btnBack").addEventListener("click", () => {
      if (aktuellerScreen === "game") { Game.pause(); zeige("pause"); return; }
      Game.abbrechen(); zeige("menu");
    });
    $("btnStart").addEventListener("click", () => zeige("modes"));
    $("btnHighscores").addEventListener("click", () => { hsRendern(); zeige("highscores"); });
    $("btnHistory").addEventListener("click", () => { verlaufRendern(); zeige("history"); });
    $("btnCalibrate").addEventListener("click", () => {
      $("calTapArea").classList.add("versteckt");
      $("calResult").textContent = "";
      $("btnCalAgain").classList.add("versteckt");
      zeige("calibrate");
    });
    $("btnHelp").addEventListener("click", () => { hilfeRendern(); zeige("help"); });

    $("btnPause").addEventListener("click", () => { Game.pause(); zeige("pause"); });
    $("btnResume").addEventListener("click", () => { audioBereit(); Game.weiter(); zeige("game"); });
    $("btnQuit").addEventListener("click", () => { Game.abbrechen(); zeige("menu"); });

    $("zoneGrid").addEventListener("pointerdown", e => {
      const zoneEl = e.target.closest(".zone");
      if (!zoneEl) return;
      e.preventDefault();
      Game.zoneAngetippt(parseInt(zoneEl.getAttribute("data-zone"), 10), e);
    });

    $("btnSave").addEventListener("click", () => {
      if (!letztesErgebnis) return;
      const n = $("resName").value.trim();
      Store.nameSetzen(n);
      Store.punktEintragen(letztesErgebnis.modus, letztesErgebnis.level, {
        name: n || "Player", punkte: letztesErgebnis.punkte, quote: letztesErgebnis.quote,
        serie: letztesErgebnis.serie, reaktion: letztesErgebnis.reaktionMittel || 0
      });
      $("btnSave").disabled = true;
      $("btnSave").textContent = t("result.saved");
    });
    $("btnAgain").addEventListener("click", () => {
      if (!letztesErgebnis) return;
      const karte = Levels.BEATMAPS.find(x => x.modus === letztesErgebnis.modus && x.level === letztesErgebnis.level);
      if (karte) levelStarten(karte);
    });
    $("btnResMenu").addEventListener("click", () => zeige("menu"));

    $("btnCalStart").addEventListener("click", kalibStart);
    $("btnCalAgain").addEventListener("click", kalibStart);
    $("btnCalReset").addEventListener("click", () => {
      Store.kalibrierungSetzen(null);
      $("calResult").textContent = t("menu.calibNone");
      kalibrierungAnzeigen();
    });
    $("calTapArea").addEventListener("pointerdown", e => {
      if (!Kalib.aktiv) return;
      e.preventDefault();
      const nowA = AudioEngine.now();
      const k = Math.round(AudioEngine.Clock.beatJetzt(nowA));
      if (k < 1 || k === Kalib.letzterBeat) return;
      Kalib.letzterBeat = k;
      Kalib.taps.push((nowA - AudioEngine.Clock.beatZeit(k)) * 1000);
      $("calStatus").textContent = t("cal.tapping", { n: Kalib.taps.length });
      if (Kalib.taps.length >= 8) kalibAuswerten();
    });

    /* Vordergrund/Hintergrund: Audio-Kontext schliessen und vollstaendig neu bauen. */
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        if (aktuellerScreen === "game") { Game.pause(); zeige("pause"); }
        if (Kalib.aktiv) { Kalib.aktiv = false; AudioEngine.Clock.stoppen(); $("calTapArea").classList.add("versteckt"); }
      } else {
        AudioEngine.neuAufbauen().then(() => { AudioEngine.sync(); Game.audioNeu(); });
      }
    });
  }

  /* ---------- Start ---------- */
  for (let i = 1; i <= 6; i++) zoneEls[i] = document.querySelector(".zone[data-zone='" + i + "']");
  verdrahte();
  texteAnwenden();
  zeige("menu");
  requestAnimationFrame(schleife);
})();