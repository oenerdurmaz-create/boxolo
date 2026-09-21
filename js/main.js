/* BeatBox – Oberfläche, Eingabe und Bildschleife. */
(function (global) {
  'use strict';
  var BB = global.BB;
  var BUILD = 2;
  var doc = global.document;
  var t = BB.i18n.t;
  var zahl = BB.i18n.zahl;

  function $(id) { return doc.getElementById(id); }

  var einst = BB.speicher.einstellungen();
  BB.i18n.setzeSprache(einst.sprache);

  var zustand = {
    bildschirm: 'menue',
    modus: BB.levels.MODI.indexOf(einst.modus) >= 0 ? einst.modus : 'reaktion',
    level: einst.level >= 1 && einst.level <= 10 ? einst.level : 1,
    runde: null,
    wartendeRunde: null,
    kalib: null,
    wartendeKalib: null,
    unterbrochen: false,
    blModus: null,
    blLevel: null
  };

  /* ---------- Hilfsfunktionen ---------- */

  function el(tag, klasse, text) {
    var e = doc.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }

  function leeren(e) { while (e.firstChild) e.removeChild(e.firstChild); }

  function maskieren(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function neuAusloesen(e, klasse) {
    e.classList.remove(klasse);
    void e.offsetWidth;
    e.classList.add(klasse);
  }

  /* event.timeStamp in performance-Zeitbasis; ältere WebKit-Versionen lieferten Epochenzeit. */
  function perfZeit(ts) {
    var p = global.performance;
    if (ts > 1e12 && p && p.timeOrigin) return ts - p.timeOrigin;
    return ts;
  }

  function sterneText(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += i < n ? '\u2605' : '\u2606';
    return s;
  }

  function detailText(d) {
    if (!d) return '';
    if (d.grund) return t('detail.' + d.grund);
    if (typeof d.reaktion_ms === 'number') return t('detail.reaktion', { ms: zahl(Math.round(d.reaktion_ms)) });
    if (typeof d.abweichung_ms === 'number') {
      var a = Math.round(d.abweichung_ms);
      if (a === 0) return t('detail.genau');
      return t(a < 0 ? 'detail.frueh' : 'detail.spaet', { ms: zahl(Math.abs(a)) });
    }
    return '';
  }

  /* ---------- Texte ---------- */

  function texteAnwenden() {
    doc.documentElement.lang = BB.i18n.sprache();
    doc.documentElement.dir = BB.i18n.richtung();
    doc.title = t('app.titel');
    var knoten = doc.querySelectorAll('[data-i18n]');
    for (var i = 0; i < knoten.length; i++) knoten[i].textContent = t(knoten[i].getAttribute('data-i18n'));
    var ph = doc.querySelectorAll('[data-i18n-platzhalter]');
    for (var j = 0; j < ph.length; j++) ph[j].setAttribute('placeholder', t(ph[j].getAttribute('data-i18n-platzhalter')));
    zonenAufbauen();
  }

  /* ---------- Bildschirme ---------- */

  var ZEICHNER = {
    menue: menueZeichnen,
    bestenliste: bestenlisteZeichnen,
    verlauf: verlaufZeichnen,
    kalibrierung: kalibZeichnen,
    hilfe: hilfeZeichnen,
    einstellungen: einstZeichnen
  };

  function zeige(name) {
    var s = doc.querySelectorAll('.screen');
    for (var i = 0; i < s.length; i++) s[i].hidden = s[i].getAttribute('data-screen') !== name;
    zustand.bildschirm = name;
    if (ZEICHNER[name]) ZEICHNER[name]();
    var aktiv = doc.querySelector('.screen[data-screen="' + name + '"]');
    if (aktiv) aktiv.scrollTop = 0;
  }

  /* ---------- Menü ---------- */

  function menueZeichnen() {
    var liste = $('modus-liste');
    leeren(liste);
    BB.levels.MODI.forEach(function (m) {
      var b = el('button', 'modus-knopf');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', m === zustand.modus ? 'true' : 'false');
      b.appendChild(el('span', 'modus-name', t('modus.' + m + '.name')));
      b.appendChild(el('span', 'modus-kurz', t('modus.' + m + '.kurz')));
      b.addEventListener('click', function () {
        zustand.modus = m;
        einst = BB.speicher.einstellungenSetzen({ modus: m });
        menueZeichnen();
      });
      liste.appendChild(b);
    });

    var raster = $('level-raster');
    leeren(raster);
    BB.levels.STUFEN.forEach(function (stufe) {
      var n = stufe.level;
      var beste = BB.speicher.bestwert(zustand.modus, n);
      var b = el('button', 'level-knopf');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', n === zustand.level ? 'true' : 'false');
      b.setAttribute('aria-label', t('menue.level_aria', {
        level: t('menue.level_nr', { n: n }),
        wertung: beste ? t('menue.sterne', { n: beste.sterne }) : t('menue.nicht_gespielt')
      }));
      b.appendChild(el('span', 'level-nr zahl', zahl(n)));
      b.appendChild(el('span', 'sterne' + (beste ? '' : ' leer'), sterneText(beste ? beste.sterne : 0)));
      b.addEventListener('click', function () {
        zustand.level = n;
        einst = BB.speicher.einstellungenSetzen({ level: n });
        menueZeichnen();
      });
      raster.appendChild(b);
    });

    var s = BB.levels.STUFEN[zustand.level - 1];
    $('level-details').textContent = t('menue.level_details', {
      bpm: zahl(s.bpm), zonen: zahl(s.aktive_zonen), laenge: zahl(s.sequenzlaenge),
      fenster: zahl(s.trefferfenster_ms), stoer: zahl(s.stoerziele)
    });
    $('kalib-anzeige').textContent = einst.kalibriert
      ? t('menue.kalibrierung_wert', { ms: zahl(einst.kalibrierung_ms) })
      : t('menue.kalibrierung_offen', { ms: zahl(einst.kalibrierung_ms) });
    $('build-info').textContent = t('menue.build', { build: BUILD });
  }

  function meldung(key, werte) {
    var m = $('menue-meldung');
    if (!key) { m.hidden = true; m.textContent = ''; return; }
    m.textContent = t(key, werte);
    m.hidden = false;
  }

  /* ---------- Spielfeld ---------- */

  var zonenEl = {};
  var RING_UEBERSTAND = 24;
  var ringe = {};

  function zonenAufbauen() {
    var feld = $('zonen');
    leeren(feld);
    zonenEl = {};
    ringe = {};
    for (var z = 1; z <= 6; z++) {
      var d = el('div', 'zone z' + z);
      d.setAttribute('data-zone', String(z));
      d.setAttribute('role', 'button');
      d.setAttribute('aria-label', t('zone.aria', { nr: z, name: t('zone.' + z) }));
      d.appendChild(el('span', 'zone-nr zahl', zahl(z)));
      d.appendChild(el('span', 'zone-name', t('zone.' + z)));
      d.appendChild(el('span', 'zone-stoer', t('zone.stoer')));
      d.appendChild(el('span', 'zone-urteil'));
      d.appendChild(el('div', 'ringe'));
      feld.appendChild(d);
      zonenEl[z] = d;
    }
  }

  function alleRingeWeg() {
    Object.keys(ringe).forEach(function (id) { if (ringe[id].parentNode) ringe[id].parentNode.removeChild(ringe[id]); });
    ringe = {};
  }

  var UI = {
    zonenSetzen: function (aktive) {
      alleRingeWeg();
      for (var z = 1; z <= 6; z++) {
        var d = zonenEl[z];
        d.className = 'zone z' + z + (aktive.indexOf(z) >= 0 ? '' : ' inaktiv');
        d.querySelector('.zone-urteil').textContent = '';
      }
    },
    leuchten: function (zone, art) {
      var d = zonenEl[zone];
      d.classList.remove('ziel', 'stoer');
      if (art) d.classList.add(art);
    },
    blitz: function (zone) { neuAusloesen(zonenEl[zone], 'ruf'); },
    ringNeu: function (id, zone, art) {
      var r = el('div', 'ring ' + art);
      zonenEl[zone].querySelector('.ringe').appendChild(r);
      var box = zonenEl[zone].getBoundingClientRect();
      r._b = Math.max(64, box.width);
      r._h = Math.max(64, box.height);
      ringe[id] = r;
      if (art === 'stoer') zonenEl[zone].classList.add('stoer-ring');
    },
    ringStellen: function (id, skala, deckung) {
      var r = ringe[id];
      if (!r) return;
      /* Fester Überstand in Punkten: gleich breiter Ring auf jeder Bildschirmgröße, kein Überlauf. */
      var ueber = (skala - 1) / 0.7 * RING_UEBERSTAND;
      r.style.transform = 'scale(' + (1 + 2 * ueber / r._b).toFixed(4) + ',' + (1 + 2 * ueber / r._h).toFixed(4) + ')';
      r.style.opacity = deckung.toFixed(3);
    },
    ringWeg: function (id) {
      var r = ringe[id];
      if (!r) return;
      var zone = r.parentNode && r.parentNode.parentNode;
      if (r.parentNode) r.parentNode.removeChild(r);
      delete ringe[id];
      if (zone && !zone.querySelector('.ring.stoer')) zone.classList.remove('stoer-ring');
    },
    rueckmeldung: function (zone, key, detail) {
      var d = zonenEl[zone];
      neuAusloesen(d, key === 'daneben' ? 'fehler' : 'treffer');
      var u = d.querySelector('.zone-urteil');
      leeren(u);
      u.appendChild(el('strong', 'urteil-' + key, t('urteil.' + key)));
      var zusatz = detailText(detail);
      if (zusatz) u.appendChild(el('span', 'urteil-detail', zusatz));
      neuAusloesen(u, 'zeigen');
    },
    hud: function (h) {
      $('hud-punkte').textContent = zahl(h.summe);
      $('hud-serie').textContent = zahl(h.serie);
      $('hud-multi').textContent = t('hud.multi_wert', { m: zahl(h.multi, 1) });
      if (h.rest_s !== null) {
        $('hud-fortschritt-label').textContent = t('hud.zeit');
        $('hud-fortschritt').textContent = t('hud.zeit_wert', { s: zahl(h.rest_s) });
      } else {
        $('hud-fortschritt-label').textContent = t('hud.treffer');
        $('hud-fortschritt').textContent = t('hud.treffer_wert', { treffer: zahl(h.treffer), gesamt: zahl(h.gesamt) });
      }
    },
    status: function (key, werte) { $('spiel-status').textContent = t(key, werte); },
    folge: function (zonen, fortschritt, vorfuehrung) {
      var f = $('folge-anzeige');
      leeren(f);
      if (!zonen) return;
      f.setAttribute('aria-label', t('folge.aria', { folge: zonen.join('-') }));
      zonen.forEach(function (z, i) {
        var c = el('span', 'folge-schlag z' + z, zahl(z));
        if (fortschritt >= 0 && i < fortschritt) c.classList.add('erledigt');
        if (i === fortschritt || i === vorfuehrung) c.classList.add('aktuell');
        f.appendChild(c);
      });
    },
    vibrieren: function (ms) {
      if (!einst.vibration) return;
      /* In der iOS-App: Brücke zur nativen Haptik (Safari und WKWebView kennen navigator.vibrate nicht). */
      var bruecke = global.webkit && global.webkit.messageHandlers && global.webkit.messageHandlers.vibrieren;
      if (bruecke) {
        try { bruecke.postMessage(ms); } catch (e) { /* nicht verfügbar */ }
        return;
      }
      if (global.navigator && typeof global.navigator.vibrate === 'function') {
        try { global.navigator.vibrate(ms); } catch (e) { /* nicht verfügbar */ }
      }
    },
    allesAus: function () {
      alleRingeWeg();
      for (var z = 1; z <= 6; z++) zonenEl[z].classList.remove('ziel', 'stoer', 'stoer-ring');
    },
    ende: function (ergebnis) {
      zustand.runde = null;
      ergebnisZeigen(ergebnis);
    }
  };

  function rundeStarten() {
    meldung(null);
    if (zustand.runde || zustand.wartendeRunde) return;
    BB.audio.entsperren().then(function (ok) {
      if (!ok) { meldung('status.audio_fehlt'); return; }
      var level = BB.levels.levelHolen(zustand.modus, zustand.level);
      zeige('spiel');
      UI.status('status.vorzaehler');
      UI.folge(null);
      UI.hud({ summe: 0, serie: 0, multi: 1, treffer: 0, gesamt: 0, rest_s: null });
      zustand.wartendeRunde = new BB.spiel.Runde(level, BB.audio, UI);
    });
  }

  function rundeAbbrechen() {
    if (zustand.runde) zustand.runde.abbrechen();
    zustand.runde = null;
    zustand.wartendeRunde = null;
  }

  /* ---------- Ergebnis ---------- */

  function wertZeile(liste, label, wert) {
    liste.appendChild(el('dt', null, label));
    liste.appendChild(el('dd', 'zahl', wert));
  }

  function msText(ms) {
    return ms === null || ms === undefined ? t('ergebnis.kein_wert') : t('ergebnis.ms', { ms: zahl(Math.round(ms)) });
  }

  function ergebnisZeigen(e) {
    var name = (einst.name || '').trim() || t('einst.standardname');
    var datum = BB.speicher.jetztIso();
    var eintrag = {
      name: name, punkte: e.punkte, quote: Math.round(e.quote * 10) / 10, serie: e.besteSerie,
      mittel_ms: e.mittel_ms === null ? null : Math.round(e.mittel_ms), datum: datum,
      sterne: e.sterne, treffer: e.treffer, gesamt: e.gesamt
    };
    var platz = BB.speicher.eintragen(e.modus, e.level, eintrag);
    if (e.mittel_ms !== null) BB.speicher.verlaufEintragen({ datum: datum, modus: e.modus, level: e.level, mittel_ms: e.mittel_ms });

    zeige('ergebnis');
    $('erg-kopf').textContent = t('ergebnis.kopf', { modus: t('modus.' + e.modus + '.name'), level: t('menue.level_nr', { n: e.level }) });
    $('erg-punkte').textContent = zahl(e.punkte);
    $('erg-formel').textContent = t('ergebnis.formel', { summe: zahl(e.summe), multi: zahl(e.maxMulti, 1), faktor: zahl(e.levelfaktor, 1) });
    var st = $('erg-sterne');
    leeren(st);
    st.setAttribute('aria-label', t('ergebnis.sterne', { n: e.sterne }));
    for (var i = 0; i < 3; i++) st.appendChild(el('span', i < e.sterne ? 'stern voll' : 'stern', i < e.sterne ? '\u2605' : '\u2606'));
    st.appendChild(el('span', 'sterne-text', t('ergebnis.sterne', { n: e.sterne })));
    $('erg-treffer').textContent = t('ergebnis.treffer', { treffer: zahl(e.treffer), gesamt: zahl(e.gesamt), quote: zahl(e.quote, 1) });

    var w = $('erg-werte');
    leeren(w);
    wertZeile(w, t('ergebnis.serie'), zahl(e.besteSerie));
    if (e.modus === 'reaktion') {
      wertZeile(w, t('ergebnis.mittel_reaktion'), msText(e.mittel_ms));
      wertZeile(w, t('ergebnis.bester'), msText(e.bester_ms));
      wertZeile(w, t('ergebnis.schlechtester'), msText(e.schlechtester_ms));
    } else {
      wertZeile(w, t('ergebnis.mittel_abweichung'), msText(e.mittel_ms));
      wertZeile(w, t('ergebnis.tendenz'), e.tendenz_ms === null ? t('ergebnis.kein_wert') : detailText({ abweichung_ms: e.tendenz_ms }));
    }
    if (e.modus === 'ausdauer') wertZeile(w, t('ergebnis.spm'), zahl(e.spm));

    $('erg-urteile').textContent = t('ergebnis.urteile', {
      p: zahl(e.urteile.perfekt), g: zahl(e.urteile.gut), o: zahl(e.urteile.ok), d: zahl(e.urteile.daneben)
    });
    $('erg-fehler').textContent = t('ergebnis.fehler', { f: zahl(e.fehltipps), s: zahl(e.stoerTreffer) });
    $('erg-platz').textContent = platz
      ? t('ergebnis.platz', { platz: zahl(platz), max: zahl(BB.speicher.MAX_EINTRAEGE) })
      : t('ergebnis.kein_platz', { max: zahl(BB.speicher.MAX_EINTRAEGE) });
  }

  /* ---------- Bestenliste ---------- */

  function reiterKnopf(text, aktiv, beiKlick) {
    var b = el('button', 'reiter-knopf', text);
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', aktiv ? 'true' : 'false');
    b.addEventListener('click', beiKlick);
    return b;
  }

  function bestenlisteZeichnen() {
    var modus = zustand.blModus || zustand.modus;
    var level = zustand.blLevel || zustand.level;
    var mr = $('bl-modi');
    leeren(mr);
    BB.levels.MODI.forEach(function (m) {
      mr.appendChild(reiterKnopf(t('modus.' + m + '.name'), m === modus, function () { zustand.blModus = m; bestenlisteZeichnen(); }));
    });
    var lr = $('bl-level');
    leeren(lr);
    BB.levels.STUFEN.forEach(function (s) {
      var b = reiterKnopf(zahl(s.level), s.level === level, function () { zustand.blLevel = s.level; bestenlisteZeichnen(); });
      b.setAttribute('aria-label', t('menue.level_nr', { n: s.level }));
      lr.appendChild(b);
    });
    var liste = BB.speicher.bestenliste(modus, level);
    var tab = $('bl-tabelle');
    leeren(tab);
    $('bl-leer').hidden = liste.length > 0;
    tab.hidden = liste.length === 0;
    if (!liste.length) return;
    var kopf = el('tr');
    ['platz', 'name', 'punkte', 'quote', 'serie', 'ms', 'datum'].forEach(function (k) {
      kopf.appendChild(el('th', 'sp-' + k, t('bestenliste.' + k)));
    });
    var thead = el('thead');
    thead.appendChild(kopf);
    tab.appendChild(thead);
    var tbody = el('tbody');
    liste.forEach(function (e, i) {
      var tr = el('tr');
      tr.appendChild(el('td', 'sp-platz zahl', zahl(i + 1)));
      tr.appendChild(el('td', 'sp-name', e.name));
      tr.appendChild(el('td', 'sp-punkte zahl', zahl(e.punkte)));
      tr.appendChild(el('td', 'sp-quote zahl', zahl(e.quote, 1)));
      tr.appendChild(el('td', 'sp-serie zahl', zahl(e.serie)));
      tr.appendChild(el('td', 'sp-ms zahl', e.mittel_ms === null ? t('ergebnis.kein_wert') : zahl(e.mittel_ms)));
      tr.appendChild(el('td', 'sp-datum zahl', BB.i18n.datum(e.datum)));
      tbody.appendChild(tr);
    });
    tab.appendChild(tbody);
  }

  /* ---------- Verlauf (Inline-SVG) ---------- */

  function verlaufZeichnen() {
    var tage = BB.speicher.verlaufTage(30, 'reaktion');
    var mitDaten = tage.filter(function (d) { return d.mittel_ms !== null; });
    var box = $('verlauf-grafik');
    var info = $('verlauf-info');
    if (!mitDaten.length) {
      box.innerHTML = '<p class="leer">' + maskieren(t('verlauf.leer')) + '</p>';
      info.textContent = '';
      return;
    }
    var B = 340, H = 210, links = 46, rechts = 10, oben = 14, unten = 30;
    var werte = mitDaten.map(function (d) { return d.mittel_ms; });
    var min = Math.min.apply(null, werte), max = Math.max.apply(null, werte);
    var spanne = Math.max(40, max - min);
    var yMin = Math.max(0, Math.floor((min - spanne * 0.2) / 10) * 10);
    var yMax = Math.ceil((max + spanne * 0.2) / 10) * 10;
    function x(i) { return links + (B - links - rechts) * i / (tage.length - 1); }
    function y(v) { return oben + (H - oben - unten) * (1 - (v - yMin) / (yMax - yMin)); }
    var teile = [];
    teile.push('<svg class="kurve" viewBox="0 0 ' + B + ' ' + H + '" role="img" aria-label="' + maskieren(t('verlauf.erklaerung')) + '">');
    [yMin, (yMin + yMax) / 2, yMax].forEach(function (v) {
      var yy = y(v).toFixed(1);
      teile.push('<line class="gitter" x1="' + links + '" x2="' + (B - rechts) + '" y1="' + yy + '" y2="' + yy + '"/>');
      teile.push('<text class="achse" x="' + (links - 6) + '" y="' + yy + '" text-anchor="end" dominant-baseline="middle">' +
        maskieren(zahl(Math.round(v))) + '</text>');
    });
    teile.push('<text class="achse" x="' + links + '" y="' + (H - 8) + '" text-anchor="start">' +
      maskieren(t('verlauf.vor_tagen', { n: tage.length - 1 })) + '</text>');
    teile.push('<text class="achse" x="' + (B - rechts) + '" y="' + (H - 8) + '" text-anchor="end">' + maskieren(t('verlauf.heute')) + '</text>');
    var punkte = [];
    tage.forEach(function (d, i) { if (d.mittel_ms !== null) punkte.push([x(i), y(d.mittel_ms), d]); });
    if (punkte.length > 1) {
      teile.push('<polyline class="linie" points="' + punkte.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>');
    }
    punkte.forEach(function (p) {
      teile.push('<circle class="punkt" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4"><title>' +
        maskieren(t('verlauf.punkt', { datum: BB.i18n.datum(p[2].datum), ms: zahl(Math.round(p[2].mittel_ms)) })) + '</title></circle>');
    });
    teile.push('</svg>');
    box.innerHTML = teile.join('');
    info.textContent = t('verlauf.info', { tage: zahl(mitDaten.length), ms: zahl(Math.round(min)) });
  }

  /* ---------- Kalibrierung ---------- */

  function kalibWertText() {
    $('kalib-wert').textContent = t('kalib.aktuell', { ms: zahl(einst.kalibrierung_ms) });
  }

  function kalibZeichnen() {
    kalibWertText();
    if (!zustand.kalib || zustand.kalib.zustand !== 'laeuft') {
      $('kalib-status').textContent = t('kalib.bereit');
      $('kalib-zaehler').textContent = '';
      $('btn-kalib-start').disabled = false;
    }
  }

  var KALIB_UI = {
    kalibPuls: function (art, n) {
      neuAusloesen($('kalib-pad'), art === 'vor' ? 'puls-vor' : 'puls');
      $('kalib-zaehler').textContent = t(art === 'vor' ? 'kalib.vor' : 'kalib.mess', { n: zahl(n) });
    },
    kalibTipp: function (n, max) {
      $('kalib-status').textContent = t('kalib.tipps', { n: zahl(n), max: zahl(max) });
    },
    kalibFertig: function (ms, n) {
      einst = BB.speicher.einstellungenSetzen({ kalibrierung_ms: ms, kalibriert: true });
      $('kalib-status').textContent = t('kalib.fertig', { ms: zahl(ms), n: zahl(n) });
      $('kalib-zaehler').textContent = '';
      $('btn-kalib-start').disabled = false;
      kalibWertText();
      zustand.kalib = null;
    },
    kalibFehler: function (n, min) {
      $('kalib-status').textContent = t('kalib.fehler', { n: zahl(n), min: zahl(min) });
      $('kalib-zaehler').textContent = '';
      $('btn-kalib-start').disabled = false;
      zustand.kalib = null;
    }
  };

  function kalibStarten() {
    if (zustand.kalib || zustand.wartendeKalib) return;
    BB.audio.entsperren().then(function (ok) {
      if (!ok) { $('kalib-status').textContent = t('status.audio_fehlt'); return; }
      $('btn-kalib-start').disabled = true;
      $('kalib-status').textContent = t('kalib.tipps', { n: zahl(0), max: zahl(BB.spiel.KALIBRIERUNG.messschlaege) });
      zustand.wartendeKalib = new BB.spiel.Kalibrierung(BB.audio, KALIB_UI);
    });
  }

  function kalibAbbrechen() {
    if (zustand.kalib) zustand.kalib.abbrechen();
    zustand.kalib = null;
    zustand.wartendeKalib = null;
  }

  /* ---------- Hilfe ---------- */

  function hilfeZeichnen() {
    var ziel = $('hilfe-inhalt');
    leeren(ziel);
    BB.i18n.hilfeBloecke(BB.spiel, BB.levels).forEach(function (b) {
      if (b.art === 'liste') {
        var ul = el('ul');
        b.eintraege.forEach(function (x) { ul.appendChild(el('li', null, x)); });
        ziel.appendChild(ul);
      } else {
        ziel.appendChild(el(b.art === 'p' ? 'p' : b.art, null, b.text));
      }
    });
  }

  /* ---------- Einstellungen ---------- */

  function einstZeichnen() {
    $('einst-name').value = einst.name || '';
    var sel = $('einst-sprache');
    leeren(sel);
    BB.i18n.aktiveSprachen().forEach(function (code) {
      var o = el('option', null, BB.i18n.SPRACHEN[code].name);
      o.value = code;
      if (code === BB.i18n.sprache()) o.selected = true;
      sel.appendChild(o);
    });
    var v = $('einst-vibration');
    v.setAttribute('aria-checked', einst.vibration ? 'true' : 'false');
    v.textContent = t(einst.vibration ? 'einst.an' : 'einst.aus');
  }

  /* ---------- Bildschleife ---------- */

  function schleife(ts) {
    global.requestAnimationFrame(schleife);
    BB.audio.abgleichen(global.performance.now());
    if (!BB.audio.bereit()) return;
    var jetzt = BB.audio.audioZeitVon(ts);

    if (zustand.wartendeRunde && BB.audio.uhrBereit()) {
      var r = zustand.wartendeRunde;
      zustand.wartendeRunde = null;
      var res = r.start();
      if (!res.ok) {
        zeige('menue');
        meldung('status.level_ungueltig', { fehler: (res.fehler || []).join('; ') });
      } else {
        zustand.runde = r;
      }
    }
    if (zustand.wartendeKalib && BB.audio.uhrBereit()) {
      zustand.kalib = zustand.wartendeKalib;
      zustand.wartendeKalib = null;
      zustand.kalib.start();
    }
    if (zustand.runde && zustand.runde.zustand === 'laeuft') {
      BB.audio.planen(BB.audio.jetzt() + 0.2);
      zustand.runde.update(jetzt);
    }
    if (zustand.kalib && zustand.kalib.zustand === 'laeuft') {
      BB.audio.planen(BB.audio.jetzt() + 0.2);
      zustand.kalib.update(jetzt);
    }
  }

  /* ---------- Ereignisse ---------- */

  function verdrahten() {
    $('btn-start').addEventListener('click', rundeStarten);
    $('kalib-anzeige').addEventListener('click', function () { zeige('kalibrierung'); });
    var nav = doc.querySelectorAll('[data-ziel]');
    for (var i = 0; i < nav.length; i++) {
      nav[i].addEventListener('click', function (e) {
        var ziel = e.currentTarget.getAttribute('data-ziel');
        if (ziel === 'bestenliste') { zustand.blModus = zustand.modus; zustand.blLevel = zustand.level; }
        zeige(ziel);
      });
    }
    var zurueck = doc.querySelectorAll('.zurueck');
    for (var j = 0; j < zurueck.length; j++) {
      zurueck[j].addEventListener('click', function () { kalibAbbrechen(); zeige('menue'); });
    }
    $('btn-abbrechen').addEventListener('click', function () { rundeAbbrechen(); zeige('menue'); });
    $('btn-nochmal').addEventListener('click', rundeStarten);
    $('btn-erg-menue').addEventListener('click', function () { zeige('menue'); });

    /* Trefferzonen: pointerdown, Zeitstempel aus dem Ereignis, nicht aus der Uhrzeit im Handler. */
    $('zonen').addEventListener('pointerdown', function (e) {
      var z = e.target.closest ? e.target.closest('[data-zone]') : null;
      if (!z) return;
      e.preventDefault();
      if (!zustand.runde) return;
      var tAudio = BB.audio.audioZeitVon(perfZeit(e.timeStamp)) - einst.kalibrierung_ms / 1000;
      zustand.runde.eingabe(Number(z.getAttribute('data-zone')), tAudio);
    }, { passive: false });

    $('kalib-pad').addEventListener('pointerdown', function (e) {
      e.preventDefault();
      neuAusloesen($('kalib-pad'), 'tipp');
      if (zustand.kalib) zustand.kalib.eingabe(BB.audio.audioZeitVon(perfZeit(e.timeStamp)));
    }, { passive: false });

    $('btn-kalib-start').addEventListener('click', kalibStarten);
    $('btn-kalib-null').addEventListener('click', function () {
      kalibAbbrechen();
      einst = BB.speicher.einstellungenSetzen({ kalibrierung_ms: 0, kalibriert: false });
      kalibWertText();
      $('kalib-status').textContent = t('kalib.zurueckgesetzt');
      $('btn-kalib-start').disabled = false;
    });

    $('einst-name').addEventListener('input', function (e) {
      einst = BB.speicher.einstellungenSetzen({ name: e.target.value.slice(0, 16) });
    });
    $('einst-sprache').addEventListener('change', function (e) {
      BB.i18n.setzeSprache(e.target.value);
      einst = BB.speicher.einstellungenSetzen({ sprache: BB.i18n.sprache() });
      texteAnwenden();
      einstZeichnen();
    });
    $('einst-vibration').addEventListener('click', function () {
      einst = BB.speicher.einstellungenSetzen({ vibration: !einst.vibration });
      einstZeichnen();
    });

    /* Rückkehr aus dem Hintergrund: AudioContext schließen und vollständig neu aufbauen. */
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) {
        if (zustand.runde || zustand.wartendeRunde) zustand.unterbrochen = true;
        rundeAbbrechen();
        kalibAbbrechen();
      } else {
        BB.audio.neuAufbauen();
        if (zustand.unterbrochen) {
          zustand.unterbrochen = false;
          zeige('menue');
          meldung('status.unterbrochen');
        } else if (zustand.bildschirm === 'kalibrierung') {
          kalibZeichnen();
        }
      }
    });

    /* Kein Zoom, kein Kontextmenü, kein Überscrollen im Spielfeld. */
    ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu'].forEach(function (typ) {
      doc.addEventListener(typ, function (e) { e.preventDefault(); }, { passive: false });
    });
    $('s-spiel').addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    $('kalib-pad').addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  }

  texteAnwenden();
  verdrahten();
  zeige('menue');
  global.requestAnimationFrame(schleife);

  BB.app = { BUILD: BUILD, zeige: zeige };
})(window);
