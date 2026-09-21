/* BeatBox — Spiellogik, Bewertung, Modi.
   Taktgeber ist ausschliesslich die per tick(now) uebergebene Audio-Zeit.
   Eingabe-Zeitpunkte kommen als umgerechneter event.timeStamp-Wert an. */
(function (root, factory) {
  var G = factory();
  root.BEATBOX_GAME = G;
  if (typeof module !== "undefined" && module.exports) { module.exports = G; }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PUNKTE = { perfect: 100, good: 60, ok: 25, miss: 0 };

  function beurteilen(abweichungMs, fensterMs) {
    var a = Math.abs(abweichungMs);
    if (a <= fensterMs * 0.31) { return "perfect"; }
    if (a <= fensterMs * 0.62) { return "good"; }
    if (a <= fensterMs) { return "ok"; }
    return "miss";
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var state = null;

  function neuerLauf(modus, levelDef, kalibrierungMs, startTime) {
    var rng = mulberry32((levelDef.level * 7919) + modus.length * 104729);
    var s = {
      modus: modus,
      level: levelDef,
      kalib: kalibrierungMs || 0,
      t0: startTime,
      rng: rng,
      fenster: levelDef.trefferfenster_ms,
      beat: 60 / levelDef.bpm,
      punkteSumme: 0,
      treffer: 0,
      ziele: 0,
      serie: 0,
      besteSerie: 0,
      maxMultiplikator: 1,
      reaktionen: [],
      beendet: false,
      ergebnis: null,
      feedback: null,          /* {schluessel, zone, bis} */
      zonenAn: {},             /* zone -> "hell" | "stoer" | "ring" */
      ring: null,              /* {zone, progress, ziel} */
      sequenzSichtbar: null,
      meldung: "game_ready",
      meldungBis: startTime + 2.2,
      schritte: [],
      schrittIndex: 0,
      komboRunde: 0,
      schlaegeGesamt: 0
    };

    function zufallsZone() { return 1 + Math.floor(s.rng() * s.level.aktiveZonen); }
    function stoerZone(hell) {
      var z = zufallsZone();
      var guard = 0;
      while (z === hell && guard++ < 10) { z = zufallsZone(); }
      return z;
    }

    /* --- Modus-Reaktion: 20 Schläge, zufällige Zeitpunkte --- */
    if (modus === "reaktion") {
      var t = startTime + 2.5;
      for (var i = 0; i < 20; i++) {
        var zone = zufallsZone();
        var stoer = s.level.stoerziele > 0 && s.rng() < 0.4 ? stoerZone(zone) : 0;
        s.schritte.push({ zeit: t, zone: zone, stoer: stoer, erledigt: false });
        t += 0.7 + s.rng() * 1.5;
      }
      s.endeZeit = t + 1.0;
    }

    /* --- Modus-Timing: Ring zieht sich zusammen --- */
    if (modus === "timing") {
      var t2 = startTime + 2.5;
      var cycle = Math.max(0.6, s.beat * 1.5);
      for (var j = 0; j < 20; j++) {
        s.schritte.push({ zeit: t2, zone: zufallsZone(), erledigt: false, cycle: cycle });
        t2 += cycle + 0.45;
      }
      s.endeZeit = t2 + 1.0;
    }

    /* --- Modus-Kombination: Folge zeigen, dann nachspielen --- */
    if (modus === "kombination") {
      s.runden = 5;
      s.phase = "zeigen";
      s.phaseStart = startTime + 1.5;
      s.seqPos = 0;
      s.folge = s.level.sequenz.slice();
    }

    /* --- Modus-Ausdauer: 60 Sekunden, Tempo steigt alle 10 s --- */
    if (modus === "ausdauer") {
      s.endeZeit = startTime + 60;
      s.naechsterSchlag = startTime + 2.0;
      s.aktiv = null; /* {zeit, zone, stoer} */
    }

    /* --- Modus-Rhythmus: Beatmap --- */
    if (modus === "rhythmus") {
      s.noten = s.level.noten.map(function (n) {
        return { zeit: startTime + n.beat * s.beat, zone: n.zone, erledigt: false, stoer: false };
      });
      /* Störziele: zusaetzliche dunkle Zonen neben einzelnen Noten */
      if (s.level.stoerziele > 0) {
        for (var k = 0; k < s.noten.length; k += 3) {
          if (s.rng() < 0.5) {
            s.noten.push({ zeit: s.noten[k].zeit, zone: stoerZone(s.noten[k].zone), erledigt: false, stoer: true });
          }
        }
        s.noten.sort(function (a, b) { return a.zeit - b.zeit; });
      }
      s.endeZeit = s.noten.length ? s.noten[s.noten.length - 1].zeit + 1.2 : startTime + 5;
      s.gezaehltBis = 0;
    }

    return s;
  }

  function multiplikator(s) { return Math.min(4, 1 + Math.floor(s.serie / 10) * 0.5); }

  function trefferErfassen(s, urteil, zone) {
    s.ziele += 1;
    var basis = PUNKTE[urteil];
    if (urteil !== "miss") {
      s.treffer += 1;
      s.serie += 1;
      s.punkteSumme += basis;
      s.besteSerie = Math.max(s.besteSerie, s.serie);
      s.maxMultiplikator = Math.max(s.maxMultiplikator, multiplikator(s));
    } else {
      s.serie = 0;
    }
    s.feedback = { schluessel: "verdict_" + urteil, zone: zone, bis: 0 };
    return { urteil: urteil, punkte: basis };
  }

  function ergebnisBauen(s) {
    var avg = s.reaktionen.length ? s.reaktionen.reduce(function (a, b) { return a + b; }, 0) / s.reaktionen.length : 0;
    var dauerSek = Math.max(1, (s.endeZeit || s.t0 + 1) - s.t0);
    return {
      punkte: Math.round(s.punkteSumme * s.maxMultiplikator * s.level.levelfaktor),
      treffer: s.treffer,
      ziele: s.ziele,
      quote: s.ziele > 0 ? Math.round(100 * s.treffer / s.ziele) : 0,
      besteSerie: s.besteSerie,
      avgReaction: Math.round(avg),
      minReaction: s.reaktionen.length ? Math.round(Math.min.apply(null, s.reaktionen)) : 0,
      maxReaction: s.reaktionen.length ? Math.round(Math.max.apply(null, s.reaktionen)) : 0,
      ppm: Math.round(s.schlaegeGesamt / (dauerSek / 60)),
      schlaege: s.schlaegeGesamt
    };
  }

  return {
    start: function (modus, levelDef, kalibrierungMs, startTime, validate) {
      if (validate) {
        var fehler = validate(levelDef);
        if (fehler.length) { return { fehler: fehler }; }
      }
      state = neuerLauf(modus, levelDef, kalibrierungMs, startTime);
      return { ok: true };
    },
    getState: function () { return state; },

    tick: function (now, audio) {
      if (!state || state.beendet) { return; }
      var s = state;
      s.laufzeit = now - s.t0;
      if (s.feedback && now > s.feedback.bis) { s.feedback = null; }
      s.zonenAn = {};
      s.ring = null;

      if (now < s.meldungBis && s.meldung) {
        if (now >= s.t0 + 1.2 && s.meldung === "game_ready") {
          s.meldung = "game_go";
          if (audio) { audio.accentAt(now); }
          s.meldungBis = now + 0.7;
        }
        return;
      }
      s.meldung = null;

      var m = s.modus;

      if (m === "reaktion" || m === "timing") {
        for (var i = 0; i < s.schritte.length; i++) {
          var sch = s.schritte[i];
          if (sch.erledigt) { continue; }
          if (m === "reaktion" && now >= sch.zeit) {
            s.zonenAn[sch.zone] = "hell";
            if (sch.stoer) { s.zonenAn[sch.stoer] = "stoer"; }
            if (now > sch.zeit + s.fenster / 1000) {
              sch.erledigt = true;
              trefferErfassen(s, "miss", sch.zone);
            }
          }
          if (m === "timing") {
            var vorbereitung = sch.zeit - sch.cycle;
            if (now >= vorbereitung && now <= sch.zeit + s.fenster / 1000) {
              var p = (now - vorbereitung) / (sch.cycle);
              s.ring = { zone: sch.zone, progress: Math.min(1, p) };
              s.zonenAn[sch.zone] = "ring";
              if (now > sch.zeit + s.fenster / 1000 && !sch.erledigt) {
                sch.erledigt = true;
                trefferErfassen(s, "miss", sch.zone);
              }
            } else if (now > sch.zeit + s.fenster / 1000 && !sch.erledigt) {
              sch.erledigt = true;
              trefferErfassen(s, "miss", sch.zone);
            }
          }
        }
        if (now >= s.endeZeit) { this.beenden(); }
      }

      if (m === "kombination") {
        if (s.phase === "zeigen") {
          var idx = Math.floor((now - s.phaseStart) / (s.beat * 0.75));
          if (idx >= 0 && idx < s.folge.length && idx !== s.seqPos - 1) {
            s.zonenAn[s.folge[idx]] = "hell";
            if (audio && idx !== s.seqGehoert) { audio.tickAt(now); s.seqGehoert = idx; }
          }
          if (now > s.phaseStart + s.folge.length * s.beat * 0.75 + 0.4) {
            s.phase = "spielen";
            s.phaseStart = now + 0.6;
            s.seqPos = 0;
            s.meldung = "combo_your_turn";
            s.meldungBis = now + 0.6;
          }
        } else if (s.phase === "spielen") {
          if (now < s.phaseStart) { return; }
          if (s.seqPos < s.folge.length) {
            var erwartet = s.phaseStart + s.seqPos * s.beat;
            var rest = erwartet - now;
            if (rest < s.beat * 0.5) { s.zonenAn[s.folge[s.seqPos]] = "ring"; s.ring = { zone: s.folge[s.seqPos], progress: 1 - Math.max(0, rest) / (s.beat * 0.5) }; }
            if (now > erwartet + s.fenster / 1000) {
              trefferErfassen(s, "miss", s.folge[s.seqPos]);
              s.seqPos += 1;
              if (audio) { audio.miss(); }
            }
          } else {
            s.komboRunde += 1;
            if (s.komboRunde >= s.runden) { this.beenden(); return; }
            s.phase = "zeigen";
            s.phaseStart = now + 1.2;
            s.seqPos = 0;
            s.seqGehoert = -1;
            var neu = s.folge.slice();
            if (s.komboRunde >= 2 && neu.length < 6 && s.level.stoerziele > 0) {
              neu.push(1 + Math.floor(s.rng() * s.level.aktiveZonen));
            }
            s.folge = neu;
            s.meldung = "combo_memorize";
            s.meldungBis = now + 1.2;
          }
        }
      }

      if (m === "ausdauer") {
        var stufe = Math.min(5, Math.floor((now - s.t0) / 10));
        var intervall = s.beat * Math.max(0.35, 0.8 - stufe * 0.09);
        if (s.aktiv && now > s.aktiv.zeit + s.fenster / 1000) {
          trefferErfassen(s, "miss", s.aktiv.zone);
          s.aktiv = null;
        }
        if (!s.aktiv && now >= s.naechsterSchlag && now < s.endeZeit - 0.5) {
          var z = zufallsZone();
          s.aktiv = { zeit: now, zone: z, stoer: s.level.stoerziele > 0 && s.rng() < 0.3 ? stoerZone(z) : 0 };
          s.naechsterSchlag = now + intervall;
          if (audio) { audio.tickAt(now); }
        }
        if (s.aktiv && now >= s.aktiv.zeit) {
          s.zonenAn[s.aktiv.zone] = "hell";
          if (s.aktiv.stoer) { s.zonenAn[s.aktiv.stoer] = "stoer"; }
        }
        if (now >= s.endeZeit) { this.beenden(); }
      }

      if (m === "rhythmus") {
        /* Musik-Kulisse: Kick/Snare/Hat auf dem Beat, voraus geplant */
        if (audio) {
          var horizon = now + 0.4;
          while (s.gezaehltBis < horizon) {
            var b = Math.floor((s.gezaehltBis - s.t0) / s.beat);
            var bt = s.t0 + b * s.beat;
            if (bt >= now - 0.05 && bt < horizon) {
              if (b % 2 === 0) { audio.kickAt(bt); } else { audio.snareAt(bt); }
              audio.hihatAt(bt + s.beat / 2);
            }
            s.gezaehltBis = s.t0 + (b + 1) * s.beat;
          }
        }
        for (var n = 0; n < s.noten.length; n++) {
          var no = s.noten[n];
          if (!no.erledigt) {
            if (now >= no.zeit - 0.3) { s.zonenAn[no.zone] = no.stoer ? "stoer" : "hell"; }
            if (now > no.zeit + s.fenster / 1000) {
              no.erledigt = true;
              if (!no.stoer) { trefferErfassen(s, "miss", no.zone); }
            }
          }
        }
        if (now >= s.endeZeit) { this.beenden(); }
      }
    },

    /* zone: 1..6, t: Audio-Zeit des Tippens (aus event.timeStamp umgerechnet). */
    onTap: function (zone, t, audio) {
      if (!state || state.beendet) { return null; }
      var s = state;
      if (s.meldung && t < s.meldungBis) { return null; }
      s.schlaegeGesamt += 1;
      var m = s.modus;
      var abw, urteil, sch, i;

      if (m === "reaktion") {
        for (i = 0; i < s.schritte.length; i++) {
          sch = s.schritte[i];
          if (!sch.erledigt && t >= sch.zeit - 0.05) {
            sch.erledigt = true;
            if (zone === sch.stoer) {
              urteil = "miss";
              trefferErfassen(s, urteil, zone);
            } else if (zone === sch.zone) {
              abw = (t - sch.zeit) * 1000 - s.kalib;
              s.reaktionen.push(Math.max(0, Math.round(abw)));
              urteil = beurteilen(abw, s.fenster);
              trefferErfassen(s, urteil, zone);
            } else {
              urteil = "miss";
              trefferErfassen(s, urteil, zone);
            }
            if (audio) { urteil === "miss" ? audio.miss() : audio.hit(zone); }
            return { urteil: urteil };
          }
        }
        return null; /* kein Ziel aktiv */
      }

      if (m === "timing") {
        for (i = 0; i < s.schritte.length; i++) {
          sch = s.schritte[i];
          if (!sch.erledigt && t >= sch.zeit - sch.cycle) {
            sch.erledigt = true;
            if (zone === sch.zone) {
              abw = (t - sch.zeit) * 1000 - s.kalib;
              s.reaktionen.push(Math.max(0, Math.round(Math.abs(abw))));
              urteil = beurteilen(abw, s.fenster);
              trefferErfassen(s, urteil, zone);
            } else {
              urteil = "miss";
              trefferErfassen(s, urteil, zone);
            }
            if (audio) { urteil === "miss" ? audio.miss() : audio.hit(zone); }
            return { urteil: urteil };
          }
        }
        return null;
      }

      if (m === "kombination") {
        if (s.phase !== "spielen" || t < s.phaseStart) { return null; }
        var erwartet = s.phaseStart + s.seqPos * s.beat;
        var erwarteteZone = s.folge[s.seqPos];
        if (!erwarteteZone) { return null; }
        if (zone === erwarteteZone) {
          abw = (t - erwartet) * 1000 - s.kalib;
          s.reaktionen.push(Math.max(0, Math.round(Math.abs(abw))));
          urteil = beurteilen(abw, s.fenster);
          s.seqPos += 1;
          trefferErfassen(s, urteil, zone);
          if (audio) { audio.hit(zone); }
          return { urteil: urteil };
        }
        urteil = "miss";
        trefferErfassen(s, urteil, zone);
        s.seqPos += 1; /* falsche Zone beendet die Serie fuer diesen Folgeschlag */
        if (audio) { audio.miss(); }
        return { urteil: urteil };
      }

      if (m === "ausdauer") {
        if (!s.aktiv || t < s.aktiv.zeit - 0.05) { return null; }
        var ziel = s.aktiv;
        s.aktiv = null;
        if (zone === ziel.zone) {
          abw = (t - ziel.zeit) * 1000 - s.kalib;
          s.reaktionen.push(Math.max(0, Math.round(abw)));
          urteil = beurteilen(abw, s.fenster);
          trefferErfassen(s, urteil, zone);
        } else {
          urteil = "miss";
          trefferErfassen(s, urteil, zone);
        }
        if (audio) { urteil === "miss" ? audio.miss() : audio.hit(zone); }
        return { urteil: urteil };
      }

      if (m === "rhythmus") {
        for (i = 0; i < s.noten.length; i++) {
          var no = s.noten[i];
          if (!no.erledigt && Math.abs(t - no.zeit) * 1000 <= s.fenster + 40) {
            no.erledigt = true;
            if (zone === no.zone) {
              if (no.stoer) {
                urteil = "miss";
                trefferErfassen(s, urteil, zone);
              } else {
                abw = (t - no.zeit) * 1000 - s.kalib;
                s.reaktionen.push(Math.max(0, Math.round(Math.abs(abw))));
                urteil = beurteilen(abw, s.fenster);
                trefferErfassen(s, urteil, zone);
              }
            } else {
              urteil = "miss";
              trefferErfassen(s, urteil, zone);
            }
            if (audio) { urteil === "miss" ? audio.miss() : audio.hit(zone); }
            return { urteil: urteil };
          }
        }
        return null;
      }
      return null;
    },

    beenden: function () {
      if (!state || state.beendet) { return state ? state.ergebnis : null; }
      state.beendet = true;
      state.ergebnis = ergebnisBauen(state);
      return state.ergebnis;
    },

    view: function () {
      if (!state) { return null; }
      var s = state;
      return {
        meldung: s.meldung,
        zonenAn: s.zonenAn,
        ring: s.ring,
        punkte: Math.round(s.punkteSumme * multiplikator(s) * s.level.levelfaktor),
        treffer: s.treffer,
        ziele: s.ziele,
        serie: s.serie,
        multiplikator: multiplikator(s),
        zeit: s.modus === "ausdauer" ? Math.max(0, Math.ceil(s.endeZeit - s.t0 - (s.laufzeit || 0))) : null,
        phase: s.phase || null,
        folge: s.modus === "kombination" ? s.folge : null,
        seqPos: s.seqPos,
        beendet: s.beendet,
        ergebnis: s.ergebnis,
        feedback: s.feedback
      };
    }
  };
});
