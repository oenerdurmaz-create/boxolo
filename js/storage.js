/* BeatBox – Speicherung ausschließlich in localStorage.
 * Kein Server, kein Konto, keine Datenübertragung.
 */
(function (global) {
  'use strict';
  var BB = global.BB = global.BB || {};

  var PRAEFIX = 'beatbox.v1.';
  var MAX_EINTRAEGE = 10;
  var VERLAUF_MAX = 2000;
  var STANDARD_EINSTELLUNGEN = { sprache: 'de', name: '', kalibrierung_ms: 0, kalibriert: false, vibration: true, modus: 'reaktion', level: 1 };

  var fluechtig = {};

  function lesen(schluessel, ersatz) {
    try {
      var roh = global.localStorage.getItem(PRAEFIX + schluessel);
      return roh === null ? ersatz : JSON.parse(roh);
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(fluechtig, schluessel) ? fluechtig[schluessel] : ersatz;
    }
  }

  function schreiben(schluessel, wert) {
    fluechtig[schluessel] = wert;
    try { global.localStorage.setItem(PRAEFIX + schluessel, JSON.stringify(wert)); return true; } catch (e) { return false; }
  }

  function einstellungen() {
    var e = lesen('einstellungen', {});
    var ergebnis = {};
    Object.keys(STANDARD_EINSTELLUNGEN).forEach(function (k) {
      ergebnis[k] = Object.prototype.hasOwnProperty.call(e, k) ? e[k] : STANDARD_EINSTELLUNGEN[k];
    });
    return ergebnis;
  }

  function einstellungenSetzen(teil) {
    var e = einstellungen();
    Object.keys(teil).forEach(function (k) { e[k] = teil[k]; });
    schreiben('einstellungen', e);
    return e;
  }

  function listenSchluessel(modus, level) { return 'bestenliste.' + modus + '.' + level; }

  function bestenliste(modus, level) { return lesen(listenSchluessel(modus, level), []); }

  function vergleich(a, b) {
    if (b.punkte !== a.punkte) return b.punkte - a.punkte;
    if (b.quote !== a.quote) return b.quote - a.quote;
    return a.datum < b.datum ? -1 : 1;
  }

  /* Trägt ein und liefert den Platz (1 = bester) oder 0, wenn der Eintrag nicht unter die besten zehn kommt. */
  function eintragen(modus, level, eintrag) {
    var liste = bestenliste(modus, level).concat([eintrag]).sort(vergleich);
    var platz = liste.indexOf(eintrag) + 1;
    liste = liste.slice(0, MAX_EINTRAEGE);
    schreiben(listenSchluessel(modus, level), liste);
    return platz <= MAX_EINTRAEGE ? platz : 0;
  }

  function bestwert(modus, level) {
    var liste = bestenliste(modus, level);
    var beste = null;
    liste.forEach(function (e) { if (!beste || e.sterne > beste.sterne) beste = e; });
    return beste;
  }

  function verlaufEintragen(eintrag) {
    var v = lesen('verlauf', []);
    v.push(eintrag);
    if (v.length > VERLAUF_MAX) v = v.slice(v.length - VERLAUF_MAX);
    schreiben('verlauf', v);
  }

  function tagSchluessel(d) {
    var m = d.getMonth() + 1, t = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (t < 10 ? '0' : '') + t;
  }

  /* Tagesmittel der Reaktionszeit über die letzten n Tage, heute eingeschlossen. */
  function verlaufTage(anzahlTage, modus) {
    var v = lesen('verlauf', []);
    var heute = new Date();
    var tage = [];
    var index = {};
    for (var i = anzahlTage - 1; i >= 0; i--) {
      var d = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - i);
      var k = tagSchluessel(d);
      index[k] = tage.length;
      tage.push({ tag: k, datum: d, summe: 0, anzahl: 0, mittel_ms: null });
    }
    v.forEach(function (e) {
      if (modus && e.modus !== modus) return;
      if (typeof e.mittel_ms !== 'number') return;
      var k = tagSchluessel(new Date(e.datum));
      if (index[k] === undefined) return;
      var tag = tage[index[k]];
      tag.summe += e.mittel_ms;
      tag.anzahl++;
    });
    tage.forEach(function (t) { if (t.anzahl) t.mittel_ms = t.summe / t.anzahl; });
    return tage;
  }

  function jetztIso() { return new Date().toISOString(); }

  BB.speicher = {
    MAX_EINTRAEGE: MAX_EINTRAEGE,
    einstellungen: einstellungen,
    einstellungenSetzen: einstellungenSetzen,
    bestenliste: bestenliste,
    eintragen: eintragen,
    bestwert: bestwert,
    verlaufEintragen: verlaufEintragen,
    verlaufTage: verlaufTage,
    jetztIso: jetztIso
  };
})(typeof window !== 'undefined' ? window : this);
