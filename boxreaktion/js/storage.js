/* BeatBox — Bestenlisten und Verlauf in localStorage. Kein Server, kein Konto, keine Uebertragung. */
(function (root, factory) {
  var S = factory();
  root.BEATBOX_STORAGE = S;
  if (typeof module !== "undefined" && module.exports) { module.exports = S; }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NS = "beatbox_v1";

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(NS + ":" + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(NS + ":" + key, JSON.stringify(value)); } catch (e) { /* speicher voll oder blockiert */ }
  }

  return {
    getCalibration: function () {
      var v = read("calib_ms", null);
      return (typeof v === "number" && isFinite(v)) ? v : 0;
    },
    setCalibration: function (ms) { write("calib_ms", ms); },

    getLanguage: function () { return read("lang", "de"); },
    setLanguage: function (lang) { write("lang", lang); },

    /* Bestenliste getrennt pro Modus und Level. */
    getScores: function (modus, level) {
      var list = read("scores:" + modus + ":" + level, []);
      return Array.isArray(list) ? list : [];
    },
    saveScore: function (modus, level, entry) {
      var list = this.getScores(modus, level);
      list.push(entry);
      list.sort(function (a, b) { return b.punkte - a.punkte; });
      write("scores:" + modus + ":" + level, list.slice(0, 20));
      return list[0] === entry || list.indexOf(entry) === 0;
    },
    getBest: function (modus, level) {
      var list = this.getScores(modus, level);
      return list.length ? list[0] : null;
    },

    /* Verlauf: ein Eintrag pro Spiel, fuer die 30-Tage-Kurve. */
    addHistory: function (entry) {
      var list = read("history", []);
      if (!Array.isArray(list)) { list = []; }
      list.push(entry);
      write("history", list.slice(-500));
    },
    /* Durchschnittliche Reaktionszeit pro Kalendertag, letzte 30 Tage. */
    getHistorySeries: function () {
      var list = read("history", []);
      if (!Array.isArray(list)) { list = []; }
      var now = new Date();
      var days = [];
      for (var i = 29; i >= 0; i--) {
        var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        days.push({ datum: d, summe: 0, anzahl: 0 });
      }
      function dayIndex(iso) {
        var t = new Date(iso);
        var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        var a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        var b = new Date(t.getFullYear(), t.getMonth(), t.getDate());
        return Math.round((b - a) / 86400000);
      }
      for (var j = 0; j < list.length; j++) {
        var e = list[j];
        if (!e || typeof e.avgReaction !== "number" || !e.datum) { continue; }
        var idx = dayIndex(e.datum);
        if (idx >= 0 && idx < 30) {
          days[idx].summe += e.avgReaction;
          days[idx].anzahl += 1;
        }
      }
      return days.map(function (d) {
        return {
          label: (d.datum.getDate() < 10 ? "0" : "") + d.datum.getDate() + "." + (d.datum.getMonth() + 1 < 10 ? "0" : "") + (d.datum.getMonth() + 1),
          wert: d.anzahl > 0 ? Math.round(d.summe / d.anzahl) : null
        };
      });
    }
  };
});
