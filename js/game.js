/* BeatBox – Spiellogik, Bewertung, Modi.
 *
 * Diese Datei greift nicht auf das DOM zu. Anzeige und Ton laufen über die
 * übergebenen Objekte "ui" und "audio". Alle Zeiten sind Audiozeit in Sekunden
 * (AudioContext.currentTime). Eingabezeiten kommen bereits kalibriert an.
 *
 * Punkte werden ausschließlich gezählt, niemals abgezogen oder ausgegeben.
 */
(function (global) {
  'use strict';
  var BB = global.BB = global.BB || {};

  /* ---------- Bewertung ---------- */

  var URTEILE = [
    { key: 'perfekt', fenster_ms: 40, punkte: 100 },
    { key: 'gut', fenster_ms: 80, punkte: 60 },
    { key: 'ok', fenster_ms: 130, punkte: 25 }
  ];
  var DANEBEN = { key: 'daneben', fenster_ms: null, punkte: 0 };
  var MULTIPLIKATOREN = [1, 1.5, 2, 3, 4];
  var TREFFER_JE_STUFE = 10;
  var STERNE_SCHWELLEN = [60, 80, 95];
  var REAKTION_GRENZEN = { fruehstart_ms: 100, perfekt_ms: 350, gut_ms: 500 };
  var FANG_S = 0.25;
  var RING_START_SKALA = 1.7;
  var RUF_VORLAUF_BEATS = 4;

  /* Urteil nach Abweichung vom Sollzeitpunkt. Das Levelfenster begrenzt nach außen. */
  function bewerteAbweichung(abweichungMs, levelFensterMs) {
    var a = Math.abs(abweichungMs);
    if (!(a <= levelFensterMs)) return DANEBEN;
    for (var i = 0; i < URTEILE.length; i++) if (a <= URTEILE[i].fenster_ms) return URTEILE[i];
    return DANEBEN;
  }

  /* Urteil im Modus Reaktion: Zeit vom Aufleuchten bis zur Berührung. */
  function bewerteReaktion(reaktionMs, zeitlimitMs) {
    if (!(reaktionMs >= REAKTION_GRENZEN.fruehstart_ms)) return DANEBEN;
    if (reaktionMs <= REAKTION_GRENZEN.perfekt_ms) return URTEILE[0];
    if (reaktionMs <= REAKTION_GRENZEN.gut_ms) return URTEILE[1];
    if (reaktionMs <= zeitlimitMs) return URTEILE[2];
    return DANEBEN;
  }

  function multiplikator(serie) {
    var stufe = Math.min(Math.floor(serie / TREFFER_JE_STUFE), MULTIPLIKATOREN.length - 1);
    return MULTIPLIKATOREN[Math.max(0, stufe)];
  }

  function endpunktzahl(summe, erreichterMultiplikator, levelfaktor) {
    return Math.round(summe * erreichterMultiplikator * levelfaktor);
  }

  function trefferquote(treffer, ziele) {
    return ziele > 0 ? (treffer / ziele) * 100 : 0;
  }

  function sterne(quote) {
    var n = 0;
    for (var i = 0; i < STERNE_SCHWELLEN.length; i++) if (quote >= STERNE_SCHWELLEN[i]) n++;
    return n;
  }

  function median(werte) {
    if (!werte.length) return null;
    var s = werte.slice().sort(function (a, b) { return a - b; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function mittel(werte) {
    if (!werte.length) return null;
    var summe = 0;
    for (var i = 0; i < werte.length; i++) summe += werte[i];
    return summe / werte.length;
  }

  /* ---------- Runde ---------- */

  function Runde(level, audio, ui, zufall) {
    this.level = level;
    this.audio = audio;
    this.ui = ui;
    this.zufall = zufall || Math.random;
    this.zustand = 'bereit';
    this.beatS = 60 / level.bpm;
    this.fenster = level.trefferfenster_ms;
    this.noten = [];
    this.stat = {
      gesamt: 0, bewertet: 0, treffer: 0, summe: 0, serie: 0, besteSerie: 0, maxMulti: 1,
      abweichungen: [], reaktionen: [], fehltipps: 0, stoerTreffer: 0,
      urteile: { perfekt: 0, gut: 0, ok: 0, daneben: 0 }
    };
  }

  Runde.prototype.zeitVonBeat = function (beat) { return this.t0 + beat * this.beatS; };

  Runde.prototype.start = function () {
    var sf = BB.levels.spielfertig(this.level, this.zufall);
    if (!sf.ok) return sf;
    this.bm = sf.beatmap;
    this.t0 = this.audio.jetzt() + 0.3;
    this.stat.gesamt = this.bm.noten.filter(function (n) { return !n.stoer; }).length;
    this.ui.zonenSetzen(this.bm.zonen);
    this.logik = MODUS_LOGIK[this.level.modus];
    this.logik.start.call(this);
    this.zustand = 'laeuft';
    this.hud();
    return { ok: true };
  };

  Runde.prototype.update = function (jetzt) {
    if (this.zustand !== 'laeuft') return;
    this.logik.update.call(this, jetzt);
    if (this.zustand === 'laeuft' && jetzt > this.ende) this.beenden();
  };

  Runde.prototype.eingabe = function (zone, t) {
    if (this.zustand !== 'laeuft') return;
    this.logik.eingabe.call(this, zone, t);
  };

  Runde.prototype.istAktiv = function (zone) { return this.bm.zonen.indexOf(zone) >= 0; };

  Runde.prototype.werte = function (urteil, zone, detail) {
    var s = this.stat;
    s.bewertet++;
    s.urteile[urteil.key]++;
    if (urteil !== DANEBEN) {
      s.treffer++;
      s.summe += urteil.punkte;
      s.serie++;
      if (s.serie > s.besteSerie) s.besteSerie = s.serie;
      var m = multiplikator(s.serie);
      if (m > s.maxMulti) s.maxMulti = m;
      if (detail && typeof detail.abweichung_ms === 'number') s.abweichungen.push(detail.abweichung_ms);
      if (detail && typeof detail.reaktion_ms === 'number') s.reaktionen.push(detail.reaktion_ms);
      this.audio.spiele('treffer', this.audio.jetzt(), 0.8);
      this.ui.vibrieren(12);
    } else {
      s.serie = 0;
      this.audio.spiele('fehlschlag', this.audio.jetzt(), 0.8);
      this.ui.vibrieren(40);
    }
    this.ui.rueckmeldung(zone, urteil.key, detail || {});
    this.hud();
  };

  /* Fehltipp oder Störziel: kein Ziel verbraucht, aber die Serie endet. */
  Runde.prototype.fehler = function (zone, grund) {
    var s = this.stat;
    if (grund === 'stoerziel') s.stoerTreffer++; else s.fehltipps++;
    s.serie = 0;
    this.audio.spiele('fehlschlag', this.audio.jetzt(), 0.8);
    this.ui.vibrieren(40);
    this.ui.rueckmeldung(zone, 'daneben', { grund: grund });
    this.hud();
  };

  Runde.prototype.hud = function (restS) {
    var s = this.stat;
    this.ui.hud({
      summe: s.summe,
      serie: s.serie,
      multi: multiplikator(s.serie),
      treffer: s.treffer,
      gesamt: s.gesamt,
      rest_s: restS === undefined ? null : restS
    });
  };

  Runde.prototype.abbrechen = function () {
    if (this.zustand !== 'laeuft') return;
    this.zustand = 'abgebrochen';
    this.audio.allesStoppen();
    this.ui.allesAus();
  };

  Runde.prototype.beenden = function () {
    this.zustand = 'fertig';
    this.audio.allesStoppen();
    this.ui.allesAus();
    this.ui.ende(this.ergebnis());
  };

  Runde.prototype.ergebnis = function () {
    var s = this.stat, l = this.level;
    var quote = trefferquote(s.treffer, s.gesamt);
    var betrag = s.abweichungen.map(Math.abs);
    var e = {
      modus: l.modus,
      level: l.level,
      levelfaktor: l.levelfaktor,
      summe: s.summe,
      maxMulti: s.maxMulti,
      punkte: endpunktzahl(s.summe, s.maxMulti, l.levelfaktor),
      treffer: s.treffer,
      gesamt: s.gesamt,
      quote: quote,
      sterne: sterne(quote),
      besteSerie: s.besteSerie,
      urteile: s.urteile,
      fehltipps: s.fehltipps,
      stoerTreffer: s.stoerTreffer,
      mittel_ms: null,
      bester_ms: null,
      schlechtester_ms: null,
      tendenz_ms: mittel(s.abweichungen),
      spm: null
    };
    if (l.modus === 'reaktion') {
      e.mittel_ms = mittel(s.reaktionen);
      if (s.reaktionen.length) {
        e.bester_ms = Math.min.apply(null, s.reaktionen);
        e.schlechtester_ms = Math.max.apply(null, s.reaktionen);
      }
    } else {
      e.mittel_ms = mittel(betrag);
    }
    if (l.modus === 'ausdauer') e.spm = s.treffer * 60 / this.bm.dauer_s;
    return e;
  };

  /* ---------- Musik-Bausteine ---------- */

  function vorzaehler(r) {
    var ev = [];
    for (var b = 0; b < BB.levels.VORZAEHLER_BEATS; b++) {
      ev.push({ zeit: r.zeitVonBeat(b), klaenge: [[b === 0 ? 'akzent' : 'klick', 0.7]] });
    }
    return ev;
  }

  function groove(r, vonBeat, bisBeat, laut) {
    var ev = [];
    for (var h = vonBeat * 2; h < bisBeat * 2; h++) {
      var beat = h / 2, k = [['hihat', 0.12 * laut]];
      if (h % 2 === 0) {
        var imTakt = Math.round(beat) % 4;
        if (imTakt === 0 || imTakt === 2) k.push(['kick', 0.5 * laut]);
        else k.push(['snare', 0.32 * laut]);
      }
      ev.push({ zeit: r.zeitVonBeat(beat), klaenge: k });
    }
    return ev;
  }

  /* ---------- Ringmodi: Timing, Ausdauer, Rhythmus ---------- */

  function ringStart() {
    var r = this;
    r.anlauf = Math.max(0.8, 2 * r.beatS);
    r.noten = r.bm.noten.map(function (n, i) {
      return { nr: i, zone: n.zone, soll: r.zeitVonBeat(n.beat), beat: n.beat, stoer: !!n.stoer,
        folge: n.folge, abschnitt: n.abschnitt, erledigt: false, ring: false };
    });
    var letzte = 0;
    r.noten.forEach(function (n) { if (n.soll > letzte) letzte = n.soll; });
    r.ende = letzte + r.fenster / 1000 + 0.6;
  }

  function ringUpdate(jetzt) {
    var r = this, fensterS = r.fenster / 1000;
    for (var i = 0; i < r.noten.length; i++) {
      var n = r.noten[i];
      if (n.erledigt) continue;
      var bis = n.soll - jetzt;
      if (bis > r.anlauf) break;
      if (!n.ring) { n.ring = true; r.ui.ringNeu(n.nr, n.zone, n.stoer ? 'stoer' : 'ziel'); }
      var skala = bis > 0 ? 1 + (RING_START_SKALA - 1) * bis / r.anlauf : Math.max(0.85, 1 + bis * 0.8);
      var deckung = bis > 0 ? 1 : Math.max(0, 1 + bis * 5);
      r.ui.ringStellen(n.nr, skala, deckung);
      if (jetzt > n.soll + fensterS) {
        n.erledigt = true;
        r.ui.ringWeg(n.nr);
        if (!n.stoer) r.werte(DANEBEN, n.zone, { grund: 'verpasst' });
      }
    }
  }

  function ringEingabe(zone, t) {
    var r = this, fang = Math.max(FANG_S, r.fenster / 1000), beste = null, besterAbstand = Infinity;
    for (var i = 0; i < r.noten.length; i++) {
      var n = r.noten[i];
      if (n.erledigt || n.zone !== zone) continue;
      var a = Math.abs(t - n.soll);
      if (a <= fang && a < besterAbstand) { beste = n; besterAbstand = a; }
    }
    if (beste && !beste.stoer) {
      var abw = (t - beste.soll) * 1000;
      beste.erledigt = true;
      r.ui.ringWeg(beste.nr);
      r.werte(bewerteAbweichung(abw, r.fenster), zone, { abweichung_ms: abw });
      return;
    }
    if (beste && beste.stoer && besterAbstand <= r.fenster / 1000) {
      beste.erledigt = true;
      r.ui.ringWeg(beste.nr);
      r.fehler(zone, 'stoerziel');
      return;
    }
    if (r.istAktiv(zone)) r.fehler(zone, 'fehltipp');
  }

  var TIMING = {
    start: function () {
      ringStart.call(this);
      var ev = vorzaehler(this);
      var bisBeat = Math.ceil((this.ende - this.t0) / this.beatS);
      for (var b = BB.levels.VORZAEHLER_BEATS; b < bisBeat; b++) {
        ev.push({ zeit: this.zeitVonBeat(b), klaenge: [[b % 4 === 0 ? 'akzent' : 'klick', 0.35], ['kick', 0.25]] });
        ev.push({ zeit: this.zeitVonBeat(b + 0.5), klaenge: [['hihat', 0.08]] });
      }
      this.audio.musikStart(ev);
      this.ui.status('status.vorzaehler');
      this.ui.folge(null);
      this.statusGesetzt = false;
    },
    update: function (jetzt) {
      if (!this.statusGesetzt && jetzt >= this.zeitVonBeat(BB.levels.VORZAEHLER_BEATS)) {
        this.statusGesetzt = true;
        this.ui.status('status.timing');
      }
      ringUpdate.call(this, jetzt);
    },
    eingabe: ringEingabe
  };

  var AUSDAUER = {
    start: function () {
      ringStart.call(this);
      var r = this, w = BB.levels.MODUS_WERTE.ausdauer;
      r.startZeit = r.zeitVonBeat(BB.levels.VORZAEHLER_BEATS);
      r.ende = r.startZeit + r.bm.dauer_s + r.fenster / 1000 + 0.3;
      r.abschnitt = -1;
      var ev = vorzaehler(r);
      var echte = r.noten.filter(function (n) { return !n.stoer; });
      echte.forEach(function (n, i) {
        ev.push({ zeit: n.soll, klaenge: [['kick', 0.45]] });
        var naechste = echte[i + 1];
        if (naechste) ev.push({ zeit: (n.soll + naechste.soll) / 2, klaenge: [['hihat', 0.1]] });
      });
      r.audio.musikStart(ev);
      r.ui.status('status.vorzaehler');
      r.ui.folge(null);
      r.tempoStufe = w.tempo_plus_bpm;
    },
    update: function (jetzt) {
      var r = this;
      if (jetzt >= r.startZeit) {
        var abschnitt = Math.min(5, Math.floor((jetzt - r.startZeit) / BB.levels.MODUS_WERTE.ausdauer.abschnitt_s));
        if (abschnitt !== r.abschnitt) {
          r.abschnitt = abschnitt;
          r.ui.status(abschnitt === 0 ? 'status.ausdauer' : 'status.tempo', { bpm: r.bm.bpm + abschnitt * r.tempoStufe });
        }
      }
      ringUpdate.call(r, jetzt);
      var rest = Math.max(0, r.startZeit + r.bm.dauer_s - Math.max(jetzt, r.startZeit));
      var ganz = Math.ceil(rest);
      if (ganz !== r.letzteRest) { r.letzteRest = ganz; r.hud(ganz); }
    },
    eingabe: ringEingabe
  };

  var RHYTHMUS = {
    start: function () {
      ringStart.call(this);
      var r = this;
      var echte = r.noten.filter(function (n) { return !n.stoer; });
      r.rufe = echte.map(function (n) {
        return { zone: n.zone, zeit: n.soll - RUF_VORLAUF_BEATS * r.beatS, folge: n.folge, gezeigt: false };
      });
      r.phrasen = [];
      echte.forEach(function (n) {
        if (!r.phrasen[n.folge]) r.phrasen[n.folge] = [];
        r.phrasen[n.folge].push(n);
      });
      var letzterBeat = Math.ceil((r.ende - r.t0) / r.beatS);
      var ev = vorzaehler(r).concat(groove(r, BB.levels.VORZAEHLER_BEATS, letzterBeat, 1));
      r.rufe.forEach(function (ruf) { ev.push({ zeit: ruf.zeit, klaenge: [['zone' + ruf.zone, 0.9]] }); });
      r.audio.musikStart(ev);
      r.ui.status('status.vorzaehler');
      r.ui.folge(null);
      r.phase = '';
    },
    update: function (jetzt) {
      var r = this;
      r.rufe.forEach(function (ruf) {
        if (!ruf.gezeigt && jetzt >= ruf.zeit) { ruf.gezeigt = true; r.ui.blitz(ruf.zone, 'ruf'); }
      });
      var beat = (jetzt - r.t0) / r.beatS - BB.levels.VORZAEHLER_BEATS;
      if (beat >= 0) {
        var p = Math.floor(beat / 8);
        var phase = (beat % 8) < 4 ? 'zuhoeren' : 'nachspielen';
        var phrase = r.phrasen[p];
        if (phrase) {
          var erledigt = phrase.filter(function (n) { return n.erledigt; }).length;
          var schluessel = p + phase + (phase === 'nachspielen' ? erledigt : '');
          if (schluessel !== r.phase) {
            r.phase = schluessel;
            r.ui.status('status.' + phase);
            r.ui.folge(phrase.map(function (n) { return n.zone; }), phase === 'nachspielen' ? erledigt : -1);
          }
        }
      }
      ringUpdate.call(r, jetzt);
    },
    eingabe: ringEingabe
  };

  /* ---------- Kombination ---------- */

  var KOMBINATION = {
    start: function () {
      var r = this;
      r.folgen = [];
      r.bm.noten.forEach(function (n) {
        var f = r.folgen[n.folge] || (r.folgen[n.folge] = { schlaege: [], stoer: [], status: 'zeigen', erwartet: 0 });
        if (n.stoer) f.stoer.push({ zone: n.zone, soll: r.zeitVonBeat(n.beat), an: false, aus: false });
        else f.schlaege.push({ zone: n.zone, soll: r.zeitVonBeat(n.beat) });
      });
      var ev = vorzaehler(r);
      var letzte = 0;
      r.folgen.forEach(function (f) {
        var len = f.schlaege.length;
        f.zonen = f.schlaege.map(function (s) { return s.zone; });
        f.los = f.schlaege[0].soll - r.beatS;
        f.demo = f.schlaege.map(function (s, j) { return { zone: s.zone, zeit: f.los - (len - j) * r.beatS, gezeigt: false }; });
        f.demo.forEach(function (d) { ev.push({ zeit: d.zeit, klaenge: [['zone' + d.zone, 0.9]] }); });
        ev.push({ zeit: f.los, klaenge: [['akzent', 0.8]] });
        f.schlaege.forEach(function (s) { ev.push({ zeit: s.soll, klaenge: [['klick', 0.4]] }); });
        letzte = f.schlaege[len - 1].soll;
      });
      r.audio.musikStart(ev);
      r.ende = letzte + r.fenster / 1000 + 0.8;
      r.aktuell = 0;
      r.ui.status('status.vorzaehler');
      r.ui.folge(null);
    },
    update: function (jetzt) {
      var r = this, f = r.folgen[r.aktuell];
      if (!f) return;
      var fensterS = r.fenster / 1000;
      f.demo.forEach(function (d, j) {
        if (!d.gezeigt && jetzt >= d.zeit) {
          d.gezeigt = true;
          r.ui.blitz(d.zone, 'ruf');
          if (j === 0) r.ui.status('status.zuschauen');
          r.ui.folge(f.zonen, -1, j);
        }
      });
      if (f.status === 'zeigen' && jetzt >= f.los) {
        f.status = 'eingabe';
        r.ui.status('status.los');
        r.ui.folge(f.zonen, 0);
      }
      f.stoer.forEach(function (s) {
        if (!s.an && jetzt >= s.soll - r.beatS * 0.5) { s.an = true; if (f.status === 'eingabe') r.ui.leuchten(s.zone, 'stoer'); }
        if (s.an && !s.aus && jetzt > s.soll + fensterS) { s.aus = true; r.ui.leuchten(s.zone, null); }
      });
      if (f.status === 'eingabe') {
        var erwartet = f.schlaege[f.erwartet];
        if (jetzt > erwartet.soll + fensterS) {
          r.werte(DANEBEN, erwartet.zone, { grund: 'verpasst' });
          KOMBINATION.abbruch.call(r, f, 1);
        }
      }
      if (f.status === 'fertig' || f.status === 'abgebrochen') {
        var naechste = r.folgen[r.aktuell + 1];
        if (naechste && jetzt >= naechste.demo[0].zeit - 0.05) {
          f.stoer.forEach(function (s) { if (s.an && !s.aus) { s.aus = true; r.ui.leuchten(s.zone, null); } });
          r.aktuell++;
        }
      }
    },
    abbruch: function (f, schonGewertet) {
      var rest = f.schlaege.length - f.erwartet - schonGewertet;
      this.stat.bewertet += Math.max(0, rest);
      f.status = 'abgebrochen';
      this.ui.status('status.abgebrochen');
      this.hud();
    },
    eingabe: function (zone, t) {
      var r = this, f = r.folgen[r.aktuell];
      if (!f || f.status !== 'eingabe') return;
      var fensterS = r.fenster / 1000;
      for (var i = 0; i < f.stoer.length; i++) {
        var s = f.stoer[i];
        if (s.zone === zone && s.an && !s.aus && Math.abs(t - s.soll) <= Math.max(fensterS, r.beatS * 0.5)) {
          s.aus = true;
          r.ui.leuchten(s.zone, null);
          r.fehler(zone, 'stoerziel');
          KOMBINATION.abbruch.call(r, f, 0);
          return;
        }
      }
      var erwartet = f.schlaege[f.erwartet];
      if (zone === erwartet.zone) {
        var abw = (t - erwartet.soll) * 1000;
        var u = bewerteAbweichung(abw, r.fenster);
        r.werte(u, zone, { abweichung_ms: abw });
        if (u === DANEBEN) { KOMBINATION.abbruch.call(r, f, 1); return; }
        f.erwartet++;
        if (f.erwartet >= f.schlaege.length) {
          f.status = 'fertig';
          r.ui.status('status.folge_geschafft');
        }
        r.ui.folge(f.zonen, f.erwartet);
        return;
      }
      if (r.istAktiv(zone)) {
        r.werte(DANEBEN, zone, { grund: 'falsche_zone' });
        KOMBINATION.abbruch.call(r, f, 1);
      }
    }
  };

  /* ---------- Reaktion ---------- */

  var REAKTION = {
    start: function () {
      var r = this, gruppen = [];
      r.bm.noten.forEach(function (n) {
        if (!n.stoer) gruppen.push({ zone: n.zone, beat: n.beat, pause_s: n.pause_s, stoer: [] });
      });
      r.bm.noten.forEach(function (n) {
        if (!n.stoer) return;
        for (var i = 0; i < gruppen.length; i++) if (gruppen[i].beat === n.beat) { gruppen[i].stoer.push(n.zone); return; }
      });
      r.ziele = gruppen;
      r.index = 0;
      r.limitMs = r.level.reaktion_zeitlimit_ms;
      r.phase = 'warten';
      r.naechste = r.t0 + gruppen[0].pause_s + 0.5;
      r.ende = Infinity;
      /* Musik nur als Kulisse, unabhängig von den Aufleuchtzeitpunkten. */
      r.audio.musikStart(groove(r, 0, Math.ceil(120 / r.beatS), 0.55));
      r.ui.status('status.reaktion');
      r.ui.folge(null);
    },
    update: function (jetzt) {
      var r = this, ziel = r.ziele[r.index];
      if (r.phase === 'warten' && jetzt >= r.naechste) {
        r.phase = 'leuchtet';
        r.gezeigt = jetzt;
        r.ui.leuchten(ziel.zone, 'ziel');
        ziel.stoer.forEach(function (z) { r.ui.leuchten(z, 'stoer'); });
      } else if (r.phase === 'leuchtet' && (jetzt - r.gezeigt) * 1000 > r.limitMs) {
        r.werte(DANEBEN, ziel.zone, { grund: 'verpasst' });
        REAKTION.weiter.call(r, jetzt);
      }
    },
    weiter: function (t) {
      var r = this, ziel = r.ziele[r.index];
      r.ui.leuchten(ziel.zone, null);
      ziel.stoer.forEach(function (z) { r.ui.leuchten(z, null); });
      r.index++;
      if (r.index >= r.ziele.length) { r.phase = 'fertig'; r.ende = t + 0.6; return; }
      r.phase = 'warten';
      r.naechste = t + r.ziele[r.index].pause_s;
    },
    eingabe: function (zone, t) {
      var r = this, ziel = r.ziele[r.index];
      if (r.phase === 'warten') {
        if (r.istAktiv(zone)) {
          r.fehler(zone, 'fehlstart');
          r.naechste = t + ziel.pause_s;
        }
        return;
      }
      if (r.phase !== 'leuchtet') return;
      var rt = (t - r.gezeigt) * 1000;
      if (zone === ziel.zone) {
        var u = bewerteReaktion(rt, r.limitMs);
        r.werte(u, zone, u === DANEBEN && rt < REAKTION_GRENZEN.fruehstart_ms ? { grund: 'fehlstart' } : { reaktion_ms: rt });
        REAKTION.weiter.call(r, t);
      } else if (ziel.stoer.indexOf(zone) >= 0) {
        r.stat.stoerTreffer++;
        r.werte(DANEBEN, zone, { grund: 'stoerziel' });
        REAKTION.weiter.call(r, t);
      } else if (r.istAktiv(zone)) {
        r.werte(DANEBEN, zone, { grund: 'falsche_zone' });
        REAKTION.weiter.call(r, t);
      }
    }
  };

  var MODUS_LOGIK = {
    reaktion: REAKTION,
    timing: TIMING,
    kombination: KOMBINATION,
    ausdauer: AUSDAUER,
    rhythmus: RHYTHMUS
  };

  /* ---------- Kalibrierung ---------- */

  var KALIBRIERUNG = { bpm: 100, vorzaehler: 4, messschlaege: 8, suchfenster_ms: 300, mindestens: 6 };

  function Kalibrierung(audio, ui) {
    this.audio = audio;
    this.ui = ui;
    this.zustand = 'bereit';
  }

  Kalibrierung.prototype.start = function () {
    var k = KALIBRIERUNG, beatS = 60 / k.bpm, t0 = this.audio.jetzt() + 0.4, ev = [];
    this.beats = [];
    for (var i = 0; i < k.vorzaehler + k.messschlaege; i++) {
      this.beats.push({ zeit: t0 + i * beatS, gezeigt: false });
      ev.push({ zeit: t0 + i * beatS, klaenge: [[i % 4 === 0 ? 'akzent' : 'klick', 0.9], ['kick', 0.35]] });
    }
    this.messungen = [];
    for (var m = 0; m < k.messschlaege; m++) this.messungen.push(null);
    this.ende = t0 + (k.vorzaehler + k.messschlaege) * beatS + 0.25;
    this.audio.musikStart(ev);
    this.zustand = 'laeuft';
  };

  Kalibrierung.prototype.update = function (jetzt) {
    if (this.zustand !== 'laeuft') return;
    var k = KALIBRIERUNG;
    for (var i = 0; i < this.beats.length; i++) {
      var b = this.beats[i];
      if (!b.gezeigt && jetzt >= b.zeit) {
        b.gezeigt = true;
        if (i < k.vorzaehler) this.ui.kalibPuls('vor', k.vorzaehler - i);
        else this.ui.kalibPuls('mess', i - k.vorzaehler + 1);
      }
    }
    if (jetzt > this.ende) this.auswerten();
  };

  Kalibrierung.prototype.eingabe = function (t) {
    if (this.zustand !== 'laeuft') return;
    var k = KALIBRIERUNG, bester = -1, abstand = Infinity;
    for (var i = k.vorzaehler; i < this.beats.length; i++) {
      var a = Math.abs(t - this.beats[i].zeit);
      if (a < abstand) { abstand = a; bester = i; }
    }
    if (bester < 0 || abstand * 1000 > k.suchfenster_ms) return;
    var idx = bester - k.vorzaehler;
    if (this.messungen[idx] !== null) return;
    this.messungen[idx] = (t - this.beats[bester].zeit) * 1000;
    this.ui.kalibTipp(this.messungen.filter(function (x) { return x !== null; }).length, k.messschlaege);
  };

  Kalibrierung.prototype.auswerten = function () {
    this.zustand = 'fertig';
    this.audio.allesStoppen();
    var werte = this.messungen.filter(function (x) { return x !== null; });
    if (werte.length >= KALIBRIERUNG.mindestens) this.ui.kalibFertig(Math.round(median(werte)), werte.length);
    else this.ui.kalibFehler(werte.length, KALIBRIERUNG.mindestens);
  };

  Kalibrierung.prototype.abbrechen = function () {
    if (this.zustand !== 'laeuft') return;
    this.zustand = 'abgebrochen';
    this.audio.allesStoppen();
  };

  BB.spiel = {
    URTEILE: URTEILE,
    DANEBEN: DANEBEN,
    MULTIPLIKATOREN: MULTIPLIKATOREN,
    TREFFER_JE_STUFE: TREFFER_JE_STUFE,
    STERNE_SCHWELLEN: STERNE_SCHWELLEN,
    REAKTION_GRENZEN: REAKTION_GRENZEN,
    KALIBRIERUNG: KALIBRIERUNG,
    bewerteAbweichung: bewerteAbweichung,
    bewerteReaktion: bewerteReaktion,
    multiplikator: multiplikator,
    endpunktzahl: endpunktzahl,
    trefferquote: trefferquote,
    sterne: sterne,
    median: median,
    mittel: mittel,
    Runde: Runde,
    Kalibrierung: Kalibrierung
  };
})(typeof window !== 'undefined' ? window : this);
