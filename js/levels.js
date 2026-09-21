/* BeatBox – Level- und Beatmap-Definitionen.
 *
 * Alle Level sind reine Daten. Die Schwierigkeit ergibt sich aus der Tabelle STUFEN.
 * Eigene Beatmaps können in EIGENE_BEATMAPS ergänzt werden; sie ersetzen dann das
 * generierte Level mit derselben id. Jede Beatmap läuft vor dem Start durch pruefeBeatmap().
 *
 * Zeitangaben: "beat" zählt Viertelschläge ab Rundenbeginn (Beat 0 bis 3 = Vorzähler).
 */
(function (global) {
  'use strict';
  var BB = global.BB = global.BB || {};

  var MODI = ['reaktion', 'timing', 'kombination', 'ausdauer', 'rhythmus'];

  /* Stellschrauben je Level. Zeile n = Level n. */
  var STUFEN = [
    { level: 1,  bpm: 80,  aktive_zonen: 2, sequenzlaenge: 2, trefferfenster_ms: 130, stoerziele: 0, levelfaktor: 1.0, reaktion_zeitlimit_ms: 1200 },
    { level: 2,  bpm: 89,  aktive_zonen: 2, sequenzlaenge: 2, trefferfenster_ms: 123, stoerziele: 0, levelfaktor: 1.1, reaktion_zeitlimit_ms: 1140 },
    { level: 3,  bpm: 98,  aktive_zonen: 3, sequenzlaenge: 3, trefferfenster_ms: 117, stoerziele: 0, levelfaktor: 1.2, reaktion_zeitlimit_ms: 1080 },
    { level: 4,  bpm: 107, aktive_zonen: 3, sequenzlaenge: 3, trefferfenster_ms: 110, stoerziele: 0, levelfaktor: 1.3, reaktion_zeitlimit_ms: 1020 },
    { level: 5,  bpm: 116, aktive_zonen: 4, sequenzlaenge: 4, trefferfenster_ms: 103, stoerziele: 1, levelfaktor: 1.4, reaktion_zeitlimit_ms: 960 },
    { level: 6,  bpm: 124, aktive_zonen: 4, sequenzlaenge: 4, trefferfenster_ms: 97,  stoerziele: 1, levelfaktor: 1.5, reaktion_zeitlimit_ms: 900 },
    { level: 7,  bpm: 133, aktive_zonen: 5, sequenzlaenge: 5, trefferfenster_ms: 90,  stoerziele: 1, levelfaktor: 1.6, reaktion_zeitlimit_ms: 840 },
    { level: 8,  bpm: 142, aktive_zonen: 5, sequenzlaenge: 5, trefferfenster_ms: 83,  stoerziele: 2, levelfaktor: 1.7, reaktion_zeitlimit_ms: 780 },
    { level: 9,  bpm: 151, aktive_zonen: 6, sequenzlaenge: 6, trefferfenster_ms: 77,  stoerziele: 2, levelfaktor: 1.8, reaktion_zeitlimit_ms: 740 },
    { level: 10, bpm: 160, aktive_zonen: 6, sequenzlaenge: 6, trefferfenster_ms: 70,  stoerziele: 2, levelfaktor: 1.9, reaktion_zeitlimit_ms: 700 }
  ];

  /* Weitere feste Zahlenwerte je Modus. */
  var MODUS_WERTE = {
    reaktion:    { schlaege: 20, pause_min_s: 1.0, pause_max_s: 2.6, stoer_anteil: 0.35 },
    timing:      { noten: 24, stoer_anteil: 0.3 },
    kombination: { folgen: 8, pause_beats: 2, stoer_anteil: 0.3 },
    ausdauer:    { dauer_s: 60, abschnitt_s: 10, tempo_plus_bpm: 8, stoer_anteil: 0.25 },
    rhythmus:    { phrasen: 6, stoer_anteil: 0.3 }
  };

  var VORZAEHLER_BEATS = 4;

  /* Standardfolgen aus dem Auftrag, in Boxnotation. */
  var STANDARDFOLGEN = [[1, 2], [1, 2, 3], [1, 2, 5, 2], [3, 4, 6, 2], [1, 1, 2, 3, 2]];

  /* Platz für handgeschriebene Beatmaps. Beispiel:
   * { id: 'rhythmus_03', modus: 'rhythmus', level: 3, bpm: 98, trefferfenster_ms: 117,
   *   stoerziele: 0, levelfaktor: 1.2, zonen: [1, 2, 3],
   *   noten: [ { beat: 8, zone: 1 }, { beat: 9, zone: 2 }, { beat: 10, zone: 3 } ] }
   */
  var EIGENE_BEATMAPS = [];

  /* ---------- Hilfsfunktionen ---------- */

  function seite(zone) { return (zone % 2 === 1) ? 'links' : 'rechts'; }

  function zufallAusSaat(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    var a = h >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function wahl(liste, zufall) { return liste[Math.floor(zufall() * liste.length)]; }

  function aktiveZonen(stufe) {
    var z = [];
    for (var i = 1; i <= stufe.aktive_zonen; i++) z.push(i);
    return z;
  }

  function levelKopf(modus, stufe) {
    var nr = (stufe.level < 10 ? '0' : '') + stufe.level;
    return {
      id: modus + '_' + nr,
      modus: modus,
      level: stufe.level,
      bpm: stufe.bpm,
      trefferfenster_ms: stufe.trefferfenster_ms,
      stoerziele: stufe.stoerziele,
      levelfaktor: stufe.levelfaktor,
      sequenzlaenge: stufe.sequenzlaenge,
      reaktion_zeitlimit_ms: stufe.reaktion_zeitlimit_ms,
      zonen: aktiveZonen(stufe),
      noten: []
    };
  }

  /* Störziele neben echte Noten legen: andere Zone, nie dieselbe Zone wie eine nahe echte Note. */
  function stoerzieleSetzen(level, anteil, zufall, filter) {
    if (!level.stoerziele) return;
    var beatS = 60 / level.bpm;
    var echte = level.noten.filter(function (n) { return !n.stoer; });
    var neu = [];
    echte.forEach(function (note) {
      if (filter && !filter(note)) return;
      if (zufall() >= anteil) return;
      var anzahl = 1 + Math.floor(zufall() * level.stoerziele);
      var belegt = {};
      echte.forEach(function (n) {
        if (Math.abs(n.beat - note.beat) * beatS < 0.6) belegt[n.zone] = true;
      });
      var frei = [1, 2, 3, 4, 5, 6].filter(function (z) { return !belegt[z]; });
      for (var k = 0; k < anzahl && frei.length; k++) {
        var i = Math.floor(zufall() * frei.length);
        var st = { beat: note.beat, zone: frei[i], stoer: true };
        if (note.folge !== undefined) st.folge = note.folge;
        neu.push(st);
        frei.splice(i, 1);
      }
    });
    level.noten = level.noten.concat(neu).sort(function (a, b) { return a.beat - b.beat; });
  }

  /* Folgen für Kombination und Rhythmus: passende Standardfolgen zuerst, dann erzeugte. */
  function folgenWaehlen(level, anzahl, maxLaenge, zufall) {
    var erlaubt = {};
    level.zonen.forEach(function (z) { erlaubt[z] = true; });
    var liste = STANDARDFOLGEN.filter(function (f) {
      return f.length <= maxLaenge && f.every(function (z) { return erlaubt[z]; });
    }).map(function (f) { return f.slice(); });
    while (liste.length < anzahl) {
      var laenge = Math.max(2, maxLaenge - (liste.length % 2));
      var f = [];
      for (var i = 0; i < laenge; i++) f.push(wahl(level.zonen, zufall));
      liste.push(f);
    }
    return liste.slice(0, anzahl);
  }

  /* ---------- Generatoren je Modus ---------- */

  function erzeugeTiming(stufe) {
    var level = levelKopf('timing', stufe);
    var zufall = zufallAusSaat(level.id);
    var beat = VORZAEHLER_BEATS, vorher = 0;
    for (var i = 0; i < MODUS_WERTE.timing.noten; i++) {
      var halb = stufe.level >= 6 && i > 0 && zufall() < 0.3;
      var zone;
      do { zone = wahl(level.zonen, zufall); } while (halb && zone === vorher);
      if (i > 0) beat += halb ? 0.5 : 1;
      level.noten.push({ beat: beat, zone: zone });
      vorher = zone;
    }
    stoerzieleSetzen(level, MODUS_WERTE.timing.stoer_anteil, zufall);
    return level;
  }

  function erzeugeKombination(stufe) {
    var level = levelKopf('kombination', stufe);
    var zufall = zufallAusSaat(level.id);
    var folgen = folgenWaehlen(level, MODUS_WERTE.kombination.folgen, stufe.sequenzlaenge, zufall);
    var basis = VORZAEHLER_BEATS;
    folgen.forEach(function (folge, k) {
      /* Vorführen: folge.length Beats, Los-Beat, dann die Schläge auf den folgenden Beats. */
      folge.forEach(function (zone, j) {
        level.noten.push({ beat: basis + folge.length + 1 + j, zone: zone, folge: k });
      });
      basis += folge.length * 2 + 1 + MODUS_WERTE.kombination.pause_beats;
    });
    stoerzieleSetzen(level, MODUS_WERTE.kombination.stoer_anteil, zufall);
    return level;
  }

  function erzeugeAusdauer(stufe) {
    var level = levelKopf('ausdauer', stufe);
    var zufall = zufallAusSaat(level.id);
    var w = MODUS_WERTE.ausdauer;
    level.dauer_s = w.dauer_s;
    level.tempo_plus_bpm = w.tempo_plus_bpm;
    var start = VORZAEHLER_BEATS * 60 / stufe.bpm;
    var t = start, vorher = 0;
    while (t < start + w.dauer_s - 1e-9) {
      var abschnitt = Math.floor((t - start) / w.abschnitt_s);
      var bpmJetzt = stufe.bpm + abschnitt * w.tempo_plus_bpm;
      var zone;
      do { zone = wahl(level.zonen, zufall); } while (zone === vorher && level.zonen.length > 1);
      level.noten.push({ beat: Math.round(t * stufe.bpm / 60 * 10000) / 10000, zone: zone, abschnitt: abschnitt });
      vorher = zone;
      t += 60 / bpmJetzt;
    }
    stoerzieleSetzen(level, w.stoer_anteil, zufall);
    return level;
  }

  function rhythmusPositionen(laenge, stufeNr) {
    if (stufeNr <= 4) return [[0, 2], [0, 1, 2], [0, 1, 2, 3]][laenge - 2];
    var achtel = { 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3], 5: [0, 1, 1.5, 2, 3], 6: [0, 0.5, 1, 2, 2.5, 3] };
    if (stufeNr >= 9) {
      var sechzehntel = { 2: [0, 0.25], 3: [0, 0.25, 1], 4: [0, 0.25, 1, 2], 5: [0, 0.25, 1, 2, 3], 6: [0, 0.25, 1, 2, 2.5, 3] };
      return { schnell: sechzehntel[laenge], normal: achtel[laenge] };
    }
    return achtel[laenge];
  }

  function erzeugeRhythmus(stufe) {
    var level = levelKopf('rhythmus', stufe);
    var zufall = zufallAusSaat(level.id);
    var maxLaenge = stufe.level <= 4 ? Math.min(4, stufe.sequenzlaenge) : stufe.sequenzlaenge;
    var folgen = folgenWaehlen(level, MODUS_WERTE.rhythmus.phrasen, maxLaenge, zufall);
    folgen.forEach(function (folge, p) {
      var pos = rhythmusPositionen(folge.length, stufe.level);
      if (pos.schnell) {
        /* Sechzehntel nur, wenn die ersten beiden Schläge auf gegenüberliegenden Hälften liegen. */
        pos = seite(folge[0]) !== seite(folge[1]) ? pos.schnell : pos.normal;
      }
      var antwortTakt = VORZAEHLER_BEATS + 8 * p + 4;
      folge.forEach(function (zone, j) {
        level.noten.push({ beat: antwortTakt + pos[j], zone: zone, folge: p });
      });
    });
    stoerzieleSetzen(level, MODUS_WERTE.rhythmus.stoer_anteil, zufall);
    return level;
  }

  function reaktionsVorlage(stufe) {
    var level = levelKopf('reaktion', stufe);
    level.generator = 'zufall';
    level.schlaege = MODUS_WERTE.reaktion.schlaege;
    return level;
  }

  /* Reaktion: Zeitpunkte werden bei jedem Start neu ausgewürfelt und danach geprüft. */
  function erzeugeReaktionsLauf(level, zufall) {
    var w = MODUS_WERTE.reaktion;
    var lauf = JSON.parse(JSON.stringify(level));
    lauf.noten = [];
    var t = 1.5;
    for (var i = 0; i < w.schlaege; i++) {
      var pause = w.pause_min_s + zufall() * (w.pause_max_s - w.pause_min_s);
      var zone = wahl(level.zonen, zufall);
      lauf.noten.push({ beat: Math.round(t * level.bpm / 60 * 10000) / 10000, zone: zone, pause_s: pause });
      t += pause + level.reaktion_zeitlimit_ms / 1000;
    }
    stoerzieleSetzen(lauf, w.stoer_anteil, zufall);
    return lauf;
  }

  /* ---------- Spielbarkeitsprüfung ----------
   * Eigenständig: nutzt keine Generatorfunktionen.
   */
  var MIN_ABSTAND_MS = 120;
  var STOER_SCHUTZ_MS = 300;

  function pruefeBeatmap(bm) {
    var fehler = [];
    function f(text) { fehler.push(text); }
    if (!bm || typeof bm !== 'object') return { ok: false, fehler: ['keine Beatmap'] };
    if (typeof bm.id !== 'string' || !bm.id) f('id fehlt');
    if (MODI.indexOf(bm.modus) < 0) f('unbekannter Modus');
    if (!(bm.bpm >= 30 && bm.bpm <= 300)) f('bpm ausserhalb 30 bis 300');
    if (!(bm.trefferfenster_ms > 0 && bm.trefferfenster_ms <= 200)) f('trefferfenster_ms ungueltig');
    if (!Array.isArray(bm.zonen) || !bm.zonen.length) f('zonen fehlen');
    (bm.zonen || []).forEach(function (z) {
      if (!(z === 1 || z === 2 || z === 3 || z === 4 || z === 5 || z === 6)) f('Zone ausserhalb 1 bis 6: ' + z);
    });
    if (!Array.isArray(bm.noten)) return { ok: false, fehler: fehler.concat(['noten fehlen']) };
    if (bm.generator !== 'zufall' && !bm.noten.some(function (n) { return !n.stoer; })) f('keine spielbaren Noten');

    var msJeBeat = 60000 / bm.bpm;
    var echte = [], stoer = [];
    var letzterBeat = -Infinity;
    bm.noten.forEach(function (n, i) {
      if (typeof n.beat !== 'number' || !isFinite(n.beat) || n.beat < 0) f('Note ' + i + ': beat ungueltig');
      if (n.beat < letzterBeat) f('Note ' + i + ': nicht aufsteigend sortiert');
      letzterBeat = n.beat;
      if (!(n.zone === 1 || n.zone === 2 || n.zone === 3 || n.zone === 4 || n.zone === 5 || n.zone === 6)) {
        f('Note ' + i + ': Zone ausserhalb 1 bis 6');
        return;
      }
      if (n.stoer) stoer.push(n);
      else {
        if ((bm.zonen || []).indexOf(n.zone) < 0) f('Note ' + i + ': Zone ' + n.zone + ' nicht aktiv');
        echte.push(n);
      }
    });

    for (var a = 0; a < echte.length; a++) {
      for (var b = a + 1; b < echte.length; b++) {
        var abstand = (echte[b].beat - echte[a].beat) * msJeBeat;
        if (abstand >= MIN_ABSTAND_MS) break;
        var linksA = echte[a].zone % 2 === 1, linksB = echte[b].zone % 2 === 1;
        if (linksA === linksB) {
          f('Noten bei beat ' + echte[a].beat + ' und ' + echte[b].beat + ': ' + Math.round(abstand) + ' ms auf derselben Seite');
        }
      }
    }

    var gleichzeitig = {};
    stoer.forEach(function (s) {
      echte.forEach(function (n) {
        if (n.zone === s.zone && Math.abs(n.beat - s.beat) * msJeBeat < STOER_SCHUTZ_MS) {
          f('Stoerziel bei beat ' + s.beat + ' liegt auf Zone ' + s.zone + ' einer nahen Note');
        }
      });
      gleichzeitig[s.beat] = (gleichzeitig[s.beat] || 0) + 1;
    });
    Object.keys(gleichzeitig).forEach(function (k) {
      if (gleichzeitig[k] > (bm.stoerziele || 0)) f('zu viele gleichzeitige Stoerziele bei beat ' + k);
    });

    return { ok: fehler.length === 0, fehler: fehler };
  }

  /* ---------- Aufbau aller Level ---------- */

  var GENERATOREN = {
    reaktion: reaktionsVorlage,
    timing: erzeugeTiming,
    kombination: erzeugeKombination,
    ausdauer: erzeugeAusdauer,
    rhythmus: erzeugeRhythmus
  };

  var LEVEL = {};
  MODI.forEach(function (modus) {
    LEVEL[modus] = STUFEN.map(function (stufe) { return GENERATOREN[modus](stufe); });
  });
  EIGENE_BEATMAPS.forEach(function (bm) {
    var liste = LEVEL[bm.modus];
    if (!liste) return;
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].id === bm.id) { liste[i] = bm; return; }
    }
    liste.push(bm);
  });

  function levelHolen(modus, nr) {
    var liste = LEVEL[modus] || [];
    for (var i = 0; i < liste.length; i++) if (liste[i].level === nr) return liste[i];
    return null;
  }

  /* Liefert eine geprüfte, spielfertige Beatmap. Zufallsmodi werden bis zu 25-mal neu gewürfelt. */
  function spielfertig(level, zufall) {
    if (level.generator !== 'zufall') {
      var p = pruefeBeatmap(level);
      return p.ok ? { ok: true, beatmap: level } : { ok: false, fehler: p.fehler };
    }
    var letzte = null;
    for (var i = 0; i < 25; i++) {
      var lauf = erzeugeReaktionsLauf(level, zufall || Math.random);
      var q = pruefeBeatmap(lauf);
      if (q.ok) return { ok: true, beatmap: lauf };
      letzte = q.fehler;
    }
    return { ok: false, fehler: letzte };
  }

  BB.levels = {
    MODI: MODI,
    STUFEN: STUFEN,
    MODUS_WERTE: MODUS_WERTE,
    STANDARDFOLGEN: STANDARDFOLGEN,
    VORZAEHLER_BEATS: VORZAEHLER_BEATS,
    MIN_ABSTAND_MS: MIN_ABSTAND_MS,
    LEVEL: LEVEL,
    levelHolen: levelHolen,
    pruefeBeatmap: pruefeBeatmap,
    spielfertig: spielfertig,
    erzeugeReaktionsLauf: erzeugeReaktionsLauf,
    seite: seite
  };
})(typeof window !== 'undefined' ? window : this);
