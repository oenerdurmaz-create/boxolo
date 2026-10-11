#!/usr/bin/env node
/* BeatBox – automatisches Prüfskript.
 * Aufruf:  node tools/pruefung.js                 alle Prüfungen
 *          node tools/pruefung.js --release       zusätzlich: Platzhalter der iOS-Hülle sind Fehler (für Codemagic)
 *          node tools/pruefung.js --hilfe-schreiben HILFE.md aus den Textbausteinen neu erzeugen
 * Ohne Abhängigkeiten. Rückgabewert ungleich null, wenn eine Prüfung fehlschlägt.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WURZEL = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);

const STRUKTUR = [
  'index.html', 'css/style.css', 'js/main.js', 'js/audio.js', 'js/game.js', 'js/levels.js',
  'js/storage.js', 'js/i18n.js', 'tools/pruefung.js', 'HILFE.md', 'README.md'
];
const JS_APP = ['js/main.js', 'js/audio.js', 'js/game.js', 'js/levels.js', 'js/storage.js', 'js/i18n.js'];
const QUELLEN = ['index.html', 'css/style.css'].concat(JS_APP);

function lies(rel) { return fs.readFileSync(path.join(WURZEL, rel), 'utf8'); }

/* Kommentare entfernen, Zeichenketten erhalten (einfacher Zustandsautomat). */
function ohneKommentare(code) {
  let aus = '', i = 0, q = null;
  while (i < code.length) {
    const c = code[i], n = code[i + 1];
    if (q) {
      aus += c;
      if (c === '\\') { aus += n || ''; i += 2; continue; }
      if (c === q) q = null;
      i++; continue;
    }
    if (c === '/' && n === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    aus += c; i++;
  }
  return aus;
}

function zeichenketten(code) {
  const liste = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g;
  let m;
  const ohne = ohneKommentare(code);
  while ((m = re.exec(ohne))) liste.push(m[1] !== undefined ? m[1] : m[2]);
  return liste;
}

function ladeModule(dateien) {
  const sandbox = { console: console };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  dateien.forEach(function (f) { vm.runInContext(lies(f), sandbox, { filename: f }); });
  return sandbox.BB;
}

function hilfeMarkdown(BB) {
  const vorher = BB.i18n.sprache();
  const teile = [];
  BB.i18n.aktiveSprachen().forEach(function (code) {
    BB.i18n.setzeSprache(code);
    BB.i18n.hilfeBloecke(BB.spiel, BB.levels).forEach(function (b) {
      if (b.art === 'h1') teile.push('# ' + b.text);
      else if (b.art === 'h2') teile.push('## ' + b.text);
      else if (b.art === 'h3') teile.push('### ' + b.text);
      else if (b.art === 'liste') teile.push(b.eintraege.map(function (x) { return '- ' + x; }).join('\n'));
      else teile.push(b.text);
    });
  });
  BB.i18n.setzeSprache(vorher);
  return teile.join('\n\n') + '\n';
}

/* ---------- unabhängiger Spielbarkeitsprüfer (nutzt nichts aus levels.js) ---------- */
function unabhaengigePruefung(bm) {
  const f = [];
  const zoneOk = function (z) { return Number.isInteger(z) && z >= 1 && z <= 6; };
  if (!bm || !Array.isArray(bm.noten)) return ['noten fehlen'];
  if (!(typeof bm.bpm === 'number' && bm.bpm > 0)) return ['bpm ungueltig'];
  if (!Array.isArray(bm.zonen) || !bm.zonen.length) f.push('zonen fehlen');
  (bm.zonen || []).forEach(function (z) { if (!zoneOk(z)) f.push('aktive Zone ausserhalb 1..6: ' + z); });
  const msJeBeat = 60000 / bm.bpm;
  const echte = [], stoer = [];
  bm.noten.forEach(function (n, i) {
    if (!zoneOk(n.zone)) { f.push('Note ' + i + ': Zone ' + n.zone); return; }
    if (!(Number.isFinite(n.beat) && n.beat >= 0)) f.push('Note ' + i + ': beat');
    if (n.stoer) stoer.push(n);
    else {
      if ((bm.zonen || []).indexOf(n.zone) < 0) f.push('Note ' + i + ': inaktive Zone ' + n.zone);
      echte.push(n);
    }
  });
  const z = echte.map(function (n) { return { t: n.beat * msJeBeat, links: n.zone % 2 === 1 }; });
  for (let a = 0; a < z.length; a++) {
    for (let b = 0; b < z.length; b++) {
      if (a === b) continue;
      const d = Math.abs(z[a].t - z[b].t);
      if (d < 120 && z[a].links === z[b].links && a < b) f.push('zwei Noten ' + d.toFixed(1) + ' ms auseinander auf derselben Seite');
    }
  }
  const gleich = {};
  stoer.forEach(function (s) {
    echte.forEach(function (n) {
      if (n.zone === s.zone && Math.abs(n.beat - s.beat) * msJeBeat < 300) f.push('Stoerziel auf Zone einer nahen Note');
    });
    gleich[s.beat] = (gleich[s.beat] || 0) + 1;
  });
  Object.keys(gleich).forEach(function (k) { if (gleich[k] > (bm.stoerziele || 0)) f.push('zu viele gleichzeitige Stoerziele'); });
  return f;
}

function saatZufall(saat) {
  let a = saat >>> 0;
  return function () { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
}

/* ---------- Simulation einer Runde mit Test-Spieler ---------- */
function simuliere(BB, level, art, saat) {
  const uhr = { t: 10 };
  const audio = { jetzt: function () { return uhr.t; }, spiele: function () {}, musikStart: function () {}, planen: function () {}, allesStoppen: function () {} };
  const taps = [];
  const summen = [];
  let ergebnis = null;
  const ui = {
    zonenSetzen: function () {}, blitz: function () {}, ringNeu: function () {}, ringStellen: function () {}, ringWeg: function () {},
    rueckmeldung: function () {}, status: function () {}, folge: function () {}, vibrieren: function () {}, allesAus: function () {},
    hud: function (h) { summen.push(h.summe); },
    leuchten: function (zone, typ) {
      if (level.modus === 'reaktion' && typ === 'ziel' && art !== 'nichts') taps.push({ t: uhr.t + 0.25, zone: zone });
      if (level.modus === 'reaktion' && typ === 'stoer' && art === 'stoer') taps.push({ t: uhr.t + 0.2, zone: zone });
    },
    ende: function (e) { ergebnis = e; }
  };
  const r = new BB.spiel.Runde(level, audio, ui, saatZufall(saat));
  const res = r.start();
  if (!res.ok) return { fehler: 'Start fehlgeschlagen: ' + (res.fehler || []).join('; ') };
  if (level.modus !== 'reaktion' && art !== 'nichts') {
    let ziele = [];
    if (level.modus === 'kombination') {
      r.folgen.forEach(function (f) {
        f.schlaege.forEach(function (s, j) {
          let zone = s.zone;
          if (art === 'falsch' && j === 0) zone = level.zonen.find(function (z) { return z !== s.zone; });
          ziele.push({ t: s.soll, zone: zone });
        });
      });
    } else {
      r.noten.forEach(function (n) {
        if (!n.stoer) ziele.push({ t: n.soll, zone: n.zone });
        else if (art === 'stoer') ziele.push({ t: n.soll + 0.001, zone: n.zone });
      });
    }
    ziele.sort(function (a, b) { return a.t - b.t; }).forEach(function (x) { taps.push(x); });
  }
  const dt = 1 / 120;
  let schritte = 0;
  while (r.zustand === 'laeuft' && schritte < 120 * 600) {
    uhr.t += dt; schritte++;
    taps.sort(function (a, b) { return a.t - b.t; });
    while (taps.length && taps[0].t <= uhr.t) { const x = taps.shift(); r.eingabe(x.zone, x.t); }
    r.update(uhr.t);
  }
  return { ergebnis: ergebnis, summen: summen, runde: r, zustand: r.zustand };
}

/* ---------- Ablauf ---------- */

let bestanden = 0, fehlgeschlagen = 0;
function pruefe(nr, titel, fn) {
  let r;
  try { r = fn(); } catch (e) { r = ['Ausnahme: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)]; }
  const fehler = r === true ? [] : (Array.isArray(r) ? r : [String(r)]);
  if (!fehler.length) { bestanden++; console.log('  OK      ' + nr + '  ' + titel); }
  else {
    fehlgeschlagen++;
    console.log('  FEHLER  ' + nr + '  ' + titel);
    fehler.slice(0, 12).forEach(function (x) { console.log('            - ' + x); });
    if (fehler.length > 12) console.log('            ... und ' + (fehler.length - 12) + ' weitere');
  }
}

if (ARGS.indexOf('--hilfe-schreiben') >= 0) {
  const BB = ladeModule(['js/i18n.js', 'js/levels.js', 'js/game.js']);
  fs.writeFileSync(path.join(WURZEL, 'HILFE.md'), hilfeMarkdown(BB));
  console.log('HILFE.md neu geschrieben.');
  process.exit(0);
}

console.log('BeatBox – Prüfskript\n');

pruefe('P01', 'Alle Dateien der Struktur vorhanden, keine leeren Dateien', function () {
  const f = [];
  STRUKTUR.forEach(function (rel) {
    const p = path.join(WURZEL, rel);
    if (!fs.existsSync(p)) f.push('fehlt: ' + rel);
    else if (!fs.readFileSync(p, 'utf8').trim()) f.push('leer: ' + rel);
  });
  return f;
});

pruefe('P02', 'Syntaxprüfung aller JavaScript-Dateien', function () {
  const f = [];
  JS_APP.concat(['tools/pruefung.js']).forEach(function (rel) {
    let code = lies(rel);
    if (code.startsWith('#!')) code = '//' + code;
    try { new vm.Script(code, { filename: rel }); } catch (e) { f.push(rel + ': ' + e.message); }
  });
  return f;
});

pruefe('P03', 'Keine externen URLs in HTML, CSS oder JavaScript; lokale Verweise existieren', function () {
  const f = [];
  const muster = [/\b(?:https?|ftp|wss?):\/\//i, /(?:src|href)\s*=\s*["']\s*\/\//i, /url\(\s*["']?\s*(?:https?:)?\/\//i, /@import/i];
  QUELLEN.forEach(function (rel) {
    const code = lies(rel);
    muster.forEach(function (m) { if (m.test(code)) f.push(rel + ': ' + m); });
  });
  const html = lies('index.html');
  const re = /(?:src|href)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) if (!fs.existsSync(path.join(WURZEL, m[1]))) f.push('Verweis ohne Datei: ' + m[1]);
  return f;
});

pruefe('P04', 'Keine Base64-Datenblöcke im Quelltext', function () {
  const f = [];
  QUELLEN.forEach(function (rel) {
    const code = lies(rel);
    if (/data:[^,"')\s]*;base64/i.test(code)) f.push(rel + ': data-URI mit base64');
    if (/[A-Za-z0-9+/]{120,}={0,2}/.test(code)) f.push(rel + ': langer Base64-artiger Block');
  });
  return f;
});

pruefe('P05', 'Keine Bild-, Audio- oder Schriftdateien im Web-Paket', function () {
  const f = [];
  const verboten = /\.(png|jpe?g|gif|webp|svg|ico|bmp|mp3|wav|ogg|m4a|aac|flac|caf|mp4|webm|ttf|otf|woff2?)$/i;
  /* Geltungsbereich: das Web-Paket. Die iOS-Hülle braucht ein App-Symbol als PNG (siehe P22). */
  const auszunehmen = { ios: true, '.git': true, node_modules: true, build: true };
  (function lauf(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!(dir === WURZEL && auszunehmen[e.name])) lauf(p); }
      else if (verboten.test(e.name)) f.push(path.relative(WURZEL, p));
    });
  })(WURZEL);
  return f;
});

pruefe('P06', 'Kein setInterval und kein Date.now() in game.js und audio.js', function () {
  const f = [];
  ['js/game.js', 'js/audio.js'].forEach(function (rel) {
    const code = ohneKommentare(lies(rel));
    if (/\bsetInterval\s*\(/.test(code)) f.push(rel + ': setInterval');
    if (/\bDate\s*\.\s*now\s*\(/.test(code)) f.push(rel + ': Date.now()');
  });
  const spiel = ohneKommentare(lies('js/game.js'));
  if (/performance\s*\.\s*now|new\s+Date\b/.test(spiel)) f.push('game.js: eigene Uhr statt Audiozeit');
  if (!/\.currentTime\b/.test(lies('js/audio.js'))) f.push('audio.js: AudioContext.currentTime wird nicht genutzt');
  return f;
});

const BB = ladeModule(['js/i18n.js', 'js/levels.js', 'js/storage.js', 'js/game.js']);

pruefe('P07', 'Jede Beatmap besteht die Spielbarkeitsprüfung (unabhängiger Prüfer und Prüfer in levels.js)', function () {
  const f = [];
  let gezaehlt = 0;
  BB.levels.MODI.forEach(function (m) {
    BB.levels.LEVEL[m].forEach(function (lvl) {
      if (lvl.generator === 'zufall') {
        const zufall = saatZufall(lvl.level * 7919);
        for (let i = 0; i < 300; i++) {
          const lauf = BB.levels.erzeugeReaktionsLauf(lvl, zufall);
          const u = unabhaengigePruefung(lauf);
          const e = BB.levels.pruefeBeatmap(lauf);
          gezaehlt++;
          if (u.length || !e.ok) { f.push(lvl.id + ' Lauf ' + i + ': ' + u.concat(e.fehler).join('; ')); break; }
        }
        return;
      }
      gezaehlt++;
      const u = unabhaengigePruefung(lvl);
      const e = BB.levels.pruefeBeatmap(lvl);
      if (u.length) f.push(lvl.id + ' (unabhängig): ' + u.join('; '));
      if (!e.ok) f.push(lvl.id + ' (levels.js): ' + e.fehler.join('; '));
    });
  });
  /* Gegenproben: beide Prüfer müssen unspielbare Beatmaps abweisen. */
  const basis = { id: 'test', modus: 'timing', bpm: 150, trefferfenster_ms: 100, stoerziele: 0, zonen: [1, 2, 3, 4, 5, 6] };
  const faelle = [
    ['Zone 7', [{ beat: 4, zone: 7 }], false],
    ['Zone 0', [{ beat: 4, zone: 0 }], false],
    ['100 ms gleiche Seite', [{ beat: 4, zone: 1 }, { beat: 4.25, zone: 3 }], false],
    ['100 ms gegenüber', [{ beat: 4, zone: 1 }, { beat: 4.25, zone: 2 }], true],
    ['Störziel auf Notenzone', [{ beat: 4, zone: 1 }, { beat: 4, zone: 1, stoer: true }], false]
  ];
  faelle.forEach(function (fall) {
    const bm = Object.assign({}, basis, { noten: fall[1] });
    if (fall[0] === 'Störziel auf Notenzone') bm.stoerziele = 1;
    const u = unabhaengigePruefung(bm).length === 0;
    const e = BB.levels.pruefeBeatmap(bm).ok;
    if (u !== fall[2]) f.push('Gegenprobe "' + fall[0] + '": unabhängiger Prüfer liefert ' + u);
    if (e !== fall[2]) f.push('Gegenprobe "' + fall[0] + '": levels.js liefert ' + e);
  });
  const genau120 = Object.assign({}, basis, { bpm: 125, noten: [{ beat: 4, zone: 1 }, { beat: 4.25, zone: 3 }] });
  if (unabhaengigePruefung(genau120).length || !BB.levels.pruefeBeatmap(genau120).ok) f.push('Gegenprobe: genau 120 ms muss erlaubt sein');
  if (gezaehlt < 50) f.push('zu wenige Beatmaps geprüft: ' + gezaehlt);
  return f;
});

pruefe('P08', 'Level-Struktur: 5 Modi × 10 Level, Stellschrauben laut Auftrag, steigende Schwierigkeit', function () {
  const f = [];
  const s = BB.levels.STUFEN;
  if (BB.levels.MODI.join() !== 'reaktion,timing,kombination,ausdauer,rhythmus') f.push('Modi weichen ab');
  if (s.length !== 10) f.push('nicht 10 Stufen');
  const a = s[0], z = s[9];
  if (a.bpm !== 80 || a.aktive_zonen !== 2 || a.sequenzlaenge !== 2 || a.trefferfenster_ms !== 130 || a.stoerziele !== 0) f.push('Level 1 weicht vom Auftrag ab');
  if (z.bpm !== 160 || z.aktive_zonen !== 6 || z.sequenzlaenge !== 6 || z.trefferfenster_ms !== 70 || z.stoerziele !== 2) f.push('Level 10 weicht vom Auftrag ab');
  for (let i = 1; i < s.length; i++) {
    if (!(s[i].bpm > s[i - 1].bpm)) f.push('Tempo steigt nicht bei Level ' + s[i].level);
    if (s[i].aktive_zonen < s[i - 1].aktive_zonen) f.push('Zonen sinken bei Level ' + s[i].level);
    if (s[i].sequenzlaenge < s[i - 1].sequenzlaenge) f.push('Sequenzlänge sinkt bei Level ' + s[i].level);
    if (!(s[i].trefferfenster_ms < s[i - 1].trefferfenster_ms)) f.push('Fenster wird nicht enger bei Level ' + s[i].level);
    if (s[i].stoerziele < s[i - 1].stoerziele || s[i].stoerziele > 2) f.push('Störziele unplausibel bei Level ' + s[i].level);
  }
  const ids = {};
  BB.levels.MODI.forEach(function (m) {
    const l = BB.levels.LEVEL[m];
    if (l.length !== 10) f.push(m + ': ' + l.length + ' Level');
    l.forEach(function (x) { if (ids[x.id]) f.push('doppelte id ' + x.id); ids[x.id] = true; });
  });
  const kombi1 = BB.levels.LEVEL.kombination[9];
  const folgen = {};
  kombi1.noten.forEach(function (n) { if (!n.stoer) (folgen[n.folge] = folgen[n.folge] || []).push(n.zone); });
  const texte = Object.keys(folgen).map(function (k) { return folgen[k].join('-'); });
  ['1-2', '1-2-3', '1-2-5-2', '3-4-6-2', '1-1-2-3-2'].forEach(function (std) {
    if (texte.indexOf(std) < 0) f.push('Standardfolge ' + std + ' fehlt in Kombination Level 10');
  });
  return f;
});

pruefe('P09', 'Jeder Textschlüssel in allen aktiven Sprachen, gleiche Platzhalter, alle genutzten Schlüssel vorhanden', function () {
  const f = [];
  const sp = BB.i18n.SPRACHEN;
  const codes = Object.keys(sp);
  if (!sp.de) f.push('Deutsch fehlt');
  if (BB.i18n.GEPLANT.length !== 12) f.push('geplanter Sprachumfang ist nicht 12');
  codes.forEach(function (c) { if (BB.i18n.GEPLANT.indexOf(c) < 0) f.push('Sprache ' + c + ' nicht im geplanten Umfang'); });
  const ph = function (s) { return (s.match(/\{\w+\}/g) || []).sort().join(','); };
  const alle = {};
  codes.forEach(function (c) { Object.keys(sp[c].texte).forEach(function (k) { alle[k] = true; }); });
  codes.forEach(function (c) {
    ['name', 'richtung', 'locale'].forEach(function (x) { if (!sp[c][x]) f.push(c + ': ' + x + ' fehlt'); });
    if (['ltr', 'rtl'].indexOf(sp[c].richtung) < 0) f.push(c + ': richtung ungueltig');
    Object.keys(alle).forEach(function (k) {
      const v = sp[c].texte[k];
      if (typeof v !== 'string') f.push(c + ': Schlüssel fehlt ' + k);
      else if (!v.trim()) f.push(c + ': leer ' + k);
      else if (ph(v) !== ph(sp.de.texte[k] || '')) f.push(c + ': Platzhalter weichen ab bei ' + k);
    });
    if (!sp.de.texte['sprache.' + c]) f.push('Sprachname sprache.' + c + ' fehlt');
  });
  /* Genutzte Schlüssel */
  const de = sp.de.texte;
  const genutzt = {};
  const praefix = /^(app|modus|menue|nav|zone|position|hud|spiel|folge|status|urteil|detail|ergebnis|bestenliste|verlauf|kalib|einst|hilfe|sprache)\.[a-z0-9_.]*[a-z0-9_]$/;
  ['js/main.js', 'js/game.js', 'js/i18n.js'].forEach(function (rel) {
    zeichenketten(lies(rel)).forEach(function (s) { if (praefix.test(s)) genutzt[s] = true; });
  });
  const html = lies('index.html');
  let m;
  const re = /data-i18n(?:-platzhalter)?="([^"]+)"/g;
  while ((m = re.exec(html))) genutzt[m[1]] = true;
  BB.levels.MODI.forEach(function (mo) { genutzt['modus.' + mo + '.name'] = genutzt['modus.' + mo + '.kurz'] = genutzt['hilfe.modus.' + mo] = true; });
  for (let z = 1; z <= 6; z++) { genutzt['zone.' + z] = genutzt['position.' + z] = true; }
  BB.spiel.URTEILE.concat([BB.spiel.DANEBEN]).forEach(function (u) { genutzt['urteil.' + u.key] = true; });
  ['verpasst', 'falsche_zone', 'stoerziel', 'fehlstart', 'fehltipp'].forEach(function (g) { genutzt['detail.' + g] = true; });
  ['zuhoeren', 'nachspielen'].forEach(function (g) { genutzt['status.' + g] = true; });
  ['platz', 'name', 'punkte', 'quote', 'serie', 'ms', 'datum'].forEach(function (g) { genutzt['bestenliste.' + g] = true; });
  Object.keys(genutzt).forEach(function (k) {
    if (de[k] === undefined && !/\.$/.test(k)) f.push('genutzter Schlüssel fehlt: ' + k);
  });
  const ungenutzt = Object.keys(de).filter(function (k) { return !genutzt[k] && !/^sprache\./.test(k); });
  if (ungenutzt.length) console.log('            Hinweis: ungenutzte Schlüssel: ' + ungenutzt.join(', '));
  console.log('            Hinweis: aktive Sprachen ' + codes.join(', ') + ' von ' + BB.i18n.GEPLANT.length + ' geplanten, ' + Object.keys(de).length + ' Schlüssel');
  return f;
});

pruefe('P10', 'Keine Textfragmente im Code: index.html ohne sichtbaren Text, Oberflächen-JS ohne Sätze', function () {
  const f = [];
  const html = lies('index.html').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  const rest = html.replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  if (/[A-Za-zÄÖÜäöüß]/.test(rest)) f.push('index.html enthält sichtbaren Text: ' + rest.slice(0, 80));
  ['js/main.js', 'js/game.js', 'js/audio.js', 'js/storage.js'].forEach(function (rel) {
    zeichenketten(lies(rel)).forEach(function (s) {
      if (/[äöüÄÖÜß]/.test(s) || /^[A-ZÄÖÜ][a-zäöüß]+ [a-zäöüß]{2,}/.test(s)) f.push(rel + ': "' + s + '"');
    });
  });
  return f;
});

pruefe('P11', 'Keine Freischaltung, Sperre oder Voraussetzung in Level-Definitionen, kein Schloss-Symbol', function () {
  const f = [];
  const verbotenFeld = /frei|sperr|lock|voraus|bedingung|require|unlock|gate|schloss|prerequisite/i;
  function feldPruefen(obj, pfad) {
    if (Array.isArray(obj)) { obj.forEach(function (x, i) { feldPruefen(x, pfad + '[' + i + ']'); }); return; }
    if (obj && typeof obj === 'object') Object.keys(obj).forEach(function (k) {
      if (verbotenFeld.test(k)) f.push('Feld ' + pfad + '.' + k);
      feldPruefen(obj[k], pfad + '.' + k);
    });
  }
  feldPruefen(BB.levels.LEVEL, 'LEVEL');
  feldPruefen(BB.levels.STUFEN, 'STUFEN');
  feldPruefen(BB.levels.MODUS_WERTE, 'MODUS_WERTE');
  if (/freischalt|gesperrt|sperre|voraussetz|unlock|locked|padlock|schloss/i.test(lies('js/levels.js'))) f.push('levels.js enthält Begriff für Freischaltung oder Sperre');
  QUELLEN.concat(['HILFE.md']).forEach(function (rel) {
    const c = lies(rel);
    if (/[\u{1F510}-\u{1F513}]/u.test(c) || /1F51[0-3]|uD83D\\?uDD1[0-3]/i.test(c)) f.push(rel + ': Schloss-Symbol');
  });
  return f;
});

pruefe('P12', 'Hilfe: HILFE.md identisch zum Hilfe-Bildschirm, jeder Modus, Zonen und Kalibrierung erklärt', function () {
  const f = [];
  const md = lies('HILFE.md');
  if (md !== hilfeMarkdown(BB)) f.push('HILFE.md weicht vom Hilfe-Bildschirm ab (neu erzeugen: node tools/pruefung.js --hilfe-schreiben)');
  const t = BB.i18n.t;
  BB.levels.MODI.forEach(function (m) {
    if (md.indexOf('### ' + t('modus.' + m + '.name')) < 0) f.push('Modus fehlt als Abschnitt: ' + m);
    if (md.indexOf(t('hilfe.modus.' + m)) < 0) f.push('Moduserklärung fehlt: ' + m);
  });
  for (let z = 1; z <= 6; z++) if (md.indexOf(t('zone.' + z)) < 0) f.push('Zone ' + z + ' fehlt');
  if (md.indexOf(t('kalib.bluetooth')) < 0) f.push('Bluetooth-Hinweis fehlt in der Hilfe');
  ['perfekt', 'gut', 'ok', 'daneben'].forEach(function (k) { if (md.indexOf(t('urteil.' + k)) < 0) f.push('Urteil fehlt: ' + k); });
  return f;
});

pruefe('P13', 'Bewertungslogik: Fenster, Multiplikator, Endpunktzahl, Quote, Sterne, Median', function () {
  const f = [];
  const s = BB.spiel;
  function gleich(name, ist, soll) { if (ist !== soll) f.push(name + ': ist ' + ist + ', soll ' + soll); }
  [[0, 'perfekt'], [40, 'perfekt'], [-40, 'perfekt'], [41, 'gut'], [80, 'gut'], [-81, 'ok'], [130, 'ok'], [131, 'daneben']]
    .forEach(function (x) { gleich('Abweichung ' + x[0] + ' bei Fenster 130', s.bewerteAbweichung(x[0], 130).key, x[1]); });
  gleich('Abweichung 70 bei Fenster 70', s.bewerteAbweichung(70, 70).key, 'gut');
  gleich('Abweichung 71 bei Fenster 70', s.bewerteAbweichung(71, 70).key, 'daneben');
  gleich('Punkte Perfekt', s.bewerteAbweichung(0, 130).punkte, 100);
  gleich('Punkte Gut', s.bewerteAbweichung(60, 130).punkte, 60);
  gleich('Punkte Ok', s.bewerteAbweichung(100, 130).punkte, 25);
  gleich('Punkte Daneben', s.bewerteAbweichung(200, 130).punkte, 0);
  [[0, 1], [9, 1], [10, 1.5], [19, 1.5], [20, 2], [30, 3], [40, 4], [99, 4]].forEach(function (x) { gleich('Multiplikator Serie ' + x[0], s.multiplikator(x[0]), x[1]); });
  gleich('Endpunktzahl', s.endpunktzahl(1000, 1.5, 1.3), 1950);
  gleich('Trefferquote', s.trefferquote(18, 20), 90);
  gleich('Trefferquote ohne Ziele', s.trefferquote(0, 0), 0);
  gleich('Sterne 59', s.sterne(59), 0); gleich('Sterne 80', s.sterne(80), 2); gleich('Sterne 100', s.sterne(100), 3);
  gleich('Median gerade', s.median([4, 1, 3, 2]), 2.5);
  gleich('Median ungerade', s.median([30, -10, 20]), 20);
  gleich('Reaktion 90 ms', s.bewerteReaktion(90, 1200).key, 'daneben');
  gleich('Reaktion 300 ms', s.bewerteReaktion(300, 1200).key, 'perfekt');
  gleich('Reaktion 450 ms', s.bewerteReaktion(450, 1200).key, 'gut');
  gleich('Reaktion 800 ms', s.bewerteReaktion(800, 1200).key, 'ok');
  gleich('Reaktion 800 ms bei Limit 700', s.bewerteReaktion(800, 700).key, 'daneben');
  return f;
});

pruefe('P14', 'Simulation aller 50 Runden: fehlerfreier Spieler 100 %, untätiger Spieler 0 %, Punkte sinken nie', function () {
  const f = [];
  BB.levels.MODI.forEach(function (m) {
    BB.levels.LEVEL[m].forEach(function (lvl, i) {
      const gut = simuliere(BB, lvl, 'perfekt', 1000 + i);
      if (gut.fehler) { f.push(lvl.id + ': ' + gut.fehler); return; }
      if (!gut.ergebnis) { f.push(lvl.id + ': Runde endet nicht (' + gut.zustand + ')'); return; }
      const e = gut.ergebnis;
      if (e.treffer !== e.gesamt || e.quote !== 100) f.push(lvl.id + ' perfekt: ' + e.treffer + '/' + e.gesamt);
      if (e.fehltipps || e.stoerTreffer) f.push(lvl.id + ' perfekt: Fehltipps ' + e.fehltipps + ', Störziele ' + e.stoerTreffer);
      if (e.punkte !== BB.spiel.endpunktzahl(e.summe, e.maxMulti, lvl.levelfaktor)) f.push(lvl.id + ': Endpunktzahl falsch berechnet');
      if (e.besteSerie !== e.gesamt) f.push(lvl.id + ': längste Serie ' + e.besteSerie + ' statt ' + e.gesamt);
      for (let k = 1; k < gut.summen.length; k++) if (gut.summen[k] < gut.summen[k - 1]) { f.push(lvl.id + ': Punkte sinken'); break; }
      if (m === 'reaktion' && (Math.round(e.bester_ms) !== 250 || Math.round(e.mittel_ms) !== 250)) f.push(lvl.id + ': Reaktionszeit falsch gemessen (' + e.mittel_ms + ')');
      if (m !== 'reaktion' && Math.abs(e.mittel_ms) > 0.5) f.push(lvl.id + ': Abweichung bei exakten Schlägen ' + e.mittel_ms);
      if (m === 'ausdauer' && !(e.spm > 0)) f.push(lvl.id + ': Schläge pro Minute fehlen');
      const nichts = simuliere(BB, lvl, 'nichts', 2000 + i);
      if (!nichts.ergebnis) f.push(lvl.id + ': Runde ohne Eingabe endet nicht');
      else if (nichts.ergebnis.treffer !== 0 || nichts.ergebnis.punkte !== 0) f.push(lvl.id + ': ohne Eingabe Treffer ' + nichts.ergebnis.treffer);
      if (lvl.stoerziele > 0 && m !== 'kombination') {
        const st = simuliere(BB, lvl, 'stoer', 3000 + i);
        const anzahl = m === 'reaktion' ? null : lvl.noten.filter(function (n) { return n.stoer; }).length;
        if (!st.ergebnis) f.push(lvl.id + ': Störziel-Lauf endet nicht');
        else if (anzahl !== null && st.ergebnis.stoerTreffer !== anzahl) f.push(lvl.id + ': Störziele ' + st.ergebnis.stoerTreffer + ' statt ' + anzahl);
        else if (anzahl === null && st.ergebnis.stoerTreffer === 0 && lvl.stoerziele > 0) { /* zufällig ohne Störziel möglich */ }
      }
      if (m === 'kombination') {
        const falsch = simuliere(BB, lvl, 'falsch', 4000 + i);
        const fe = falsch.ergebnis;
        /* Eine falsche Zone kann zugleich ein Störziel sein; dann zählt sie als Störziel. Beides beendet die Folge. */
        if (!fe || fe.treffer !== 0 || fe.urteile.daneben + fe.stoerTreffer !== falsch.runde.folgen.length ||
            falsch.runde.folgen.some(function (x) { return x.status !== 'abgebrochen'; })) {
          f.push(lvl.id + ': falsche erste Zone beendet die Folge nicht korrekt');
        }
      }
    });
  });
  return f;
});

pruefe('P15', 'Eingabe und Latenz: pointerdown mit event.timeStamp, Puffer vorab, Neuaufbau nach Hintergrund, Kalibrierung', function () {
  const f = [];
  const main = ohneKommentare(lies('js/main.js'));
  const audio = ohneKommentare(lies('js/audio.js'));
  const spiel = ohneKommentare(lies('js/game.js'));
  if (!/\$\('zonen'\)\.addEventListener\('pointerdown'/.test(main)) f.push('Zonen hören nicht auf pointerdown');
  if (/\$\('zonen'\)\.addEventListener\('click'/.test(main)) f.push('Zonen hören auf click');
  if (!/e\.timeStamp/.test(main)) f.push('event.timeStamp wird nicht verwendet');
  if (/performance\.now\(\)\s*\)\s*-\s*einst/.test(main)) f.push('Zeitstempel aus Handler-Uhrzeit');
  if (!/visibilitychange/.test(main) || !/neuAufbauen\(\)/.test(main)) f.push('kein Neuaufbau bei visibilitychange');
  const neu = audio.slice(audio.indexOf('function neuAufbauen'), audio.indexOf('function entsperren'));
  if (!/\.close\(\)/.test(neu) || !/aufbauen\(\)/.test(neu)) f.push('neuAufbauen schließt den Kontext nicht oder baut nicht neu auf');
  const aufbau = audio.slice(audio.indexOf('function aufbauen'), audio.indexOf('function neuAufbauen'));
  if (!/erzeugeKlaenge\(ctx\)/.test(aufbau)) f.push('Klangpuffer werden nicht beim Aufbau erzeugt');
  const spielen = audio.slice(audio.indexOf('function spiele'), audio.indexOf('function musikStart'));
  if (/createBuffer\s*\(|erzeugeKlaenge|decodeAudioData/.test(spielen)) f.push('Puffer werden erst beim Abspielen erzeugt');
  if (/outputLatency/.test(audio + main + spiel)) f.push('outputLatency wird verwendet');
  if (!/median\(/.test(spiel) || !/kalibrierung_ms/.test(main)) f.push('Kalibrierung per Median fehlt');
  if (!/kalibrierung_ms\s*\/\s*1000/.test(main)) f.push('Korrekturwert wird nicht von Messungen abgezogen');
  if (lies('index.html').indexOf('data-i18n="kalib.bluetooth"') < 0) f.push('Bluetooth-Hinweis fehlt im Kalibrierungsbildschirm');
  if (!/kalib-anzeige/.test(main)) f.push('Korrekturwert nicht im Menü sichtbar');
  if (!/navigator\.vibrate/.test(main)) f.push('Vibration fehlt');
  if (!/messageHandlers\.vibrieren/.test(main)) f.push('Haptik-Brücke zur iOS-App fehlt');
  return f;
});

pruefe('P16', 'Bedienung: touch-action, sichere Bereiche, keine Auswahl, kein Überscrollen, Zonen ≥ 64 Punkte', function () {
  const f = [];
  const css = lies('css/style.css');
  const html = lies('index.html');
  if (!/touch-action:\s*manipulation/.test(css)) f.push('touch-action: manipulation fehlt');
  ['top', 'bottom', 'left', 'right'].forEach(function (s) { if (css.indexOf('safe-area-inset-' + s) < 0) f.push('safe-area-inset-' + s + ' fehlt'); });
  if (!/user-select:\s*none/.test(css)) f.push('user-select: none fehlt');
  if (!/overscroll-behavior:\s*none/.test(css)) f.push('overscroll-behavior fehlt');
  const zone = (css.match(/\n\.zone \{[^}]*\}/) || [''])[0];
  if (!/min-width:\s*64px/.test(zone) || !/min-height:\s*64px/.test(zone)) f.push('Zonen-Mindestgröße 64 × 64 fehlt');
  if (!/viewport-fit=cover/.test(html) || !/user-scalable=no/.test(html)) f.push('Viewport-Angaben unvollständig');
  return f;
});

pruefe('P17', 'Kein Netzwerk, kein Tracking; localStorage nur in storage.js', function () {
  const f = [];
  JS_APP.forEach(function (rel) {
    const c = ohneKommentare(lies(rel));
    if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|geolocation|\bimport\s*\(|serviceWorker/.test(c)) f.push(rel + ': Netzwerk-API');
    if (rel !== 'js/storage.js' && /localStorage|sessionStorage|indexedDB|document\.cookie/.test(c)) f.push(rel + ': Speicherzugriff außerhalb storage.js');
  });
  return f;
});

pruefe('P18', 'Punkte-Semantik: nur zählen, nie abziehen; keine Währung', function () {
  const f = [];
  const spiel = ohneKommentare(lies('js/game.js'));
  if (/\b(summe|punkte)\s*-=|\b(summe|punkte)\s*--|--\s*(summe|punkte)\b/.test(spiel)) f.push('game.js zieht Punkte ab');
  ['js/game.js', 'js/levels.js', 'js/storage.js', 'js/main.js'].forEach(function (rel) {
    if (/m[üu]nze|coin|w[äa]hrung|currency|wallet|kaufen|purchase|shop\b/i.test(ohneKommentare(lies(rel)))) f.push(rel + ': Währungs- oder Kaufbegriff');
  });
  return f;
});

pruefe('P19', 'Buildnummer in main.js und README.md stimmen überein', function () {
  const m = lies('js/main.js').match(/var BUILD = (\d+);/);
  if (!m) return 'BUILD fehlt in main.js';
  const erwartet = ARGS.find(function (a) { return /^--build=\d+$/.test(a); });
  const f = [];
  if (erwartet && erwartet.split('=')[1] !== m[1]) f.push('Build ' + m[1] + ' statt erwartet ' + erwartet.split('=')[1]);
  if (lies('README.md').indexOf('Build ' + m[1]) < 0) f.push('README nennt Build ' + m[1] + ' nicht');
  console.log('            Hinweis: Build ' + m[1]);
  return f;
});

pruefe('P20', 'README enthält Entscheidungen, Geprüftes, nicht Geprüftes und Testanleitung', function () {
  const r = lies('README.md');
  const f = [];
  ['## Entscheidungen', '## Geprüft', '## Nicht geprüft', '## Testanleitung'].forEach(function (h) { if (r.indexOf(h) < 0) f.push('Abschnitt fehlt: ' + h); });
  return f;
});

pruefe('P21', 'Darstellungsregeln aus der Screenshot-Kontrolle von Build 1', function () {
  const f = [];
  const main = ohneKommentare(lies('js/main.js'));
  /* Ringe liefen über den Bildschirmrand: Überstand muss in festen Punkten gerechnet werden. */
  if (!/RING_UEBERSTAND\s*=\s*\d+/.test(main) || !/scale\('\s*\+\s*\(1 \+ 2 \* ueber/.test(main)) f.push('Ring nutzt keinen festen Überstand');
  /* Fehler-Aufblitzen erschien als hohler Rahmen: keine inset-Schatten in den Trefferanimationen. */
  const css = lies('css/style.css');
  ['treffer', 'fehler'].forEach(function (k) {
    const block = (css.match(new RegExp('@keyframes ' + k + ' \\{[\\s\\S]*?\\n\\}')) || [''])[0];
    if (!block || /inset/.test(block)) f.push('@keyframes ' + k + ' nutzt inset-Schatten oder fehlt');
  });
  /* Unterbrechungshinweis lag unterhalb des sichtbaren Bereichs: muss vor der Moduswahl stehen. */
  const html = lies('index.html');
  if (!(html.indexOf('id="menue-meldung"') > 0 && html.indexOf('id="menue-meldung"') < html.indexOf('id="modus-liste"'))) f.push('Menü-Meldung steht nicht oben');
  /* "0 ms" brach um: Einheiten nach Platzhaltern mit geschütztem Leerzeichen. */
  Object.keys(BB.i18n.SPRACHEN).forEach(function (c) {
    const tx = BB.i18n.SPRACHEN[c].texte;
    Object.keys(tx).forEach(function (k) { if (/\} (ms|%|BPM|s)\b/.test(tx[k])) f.push(c + ': Einheit ohne geschütztes Leerzeichen in ' + k); });
  });
  return f;
});

pruefe('P22', 'iOS-Hülle: Dateien vollständig, stimmig mit Web-Paket, project.yml und codemagic.yaml', function () {
  const f = [];
  const IOS = ['ios/project.yml', 'ios/BeatBox/AppDelegate.swift', 'ios/BeatBox/SceneDelegate.swift', 'ios/BeatBox/Audiositzung.swift',
    'ios/BeatBox/WebDateiHandler.swift', 'ios/BeatBox/SpielViewController.swift', 'ios/BeatBox/PrivacyInfo.xcprivacy',
    'ios/BeatBox/Assets.xcassets/Contents.json', 'ios/BeatBox/Assets.xcassets/AppIcon.appiconset/Contents.json',
    'ios/BeatBox/Assets.xcassets/AppIcon.appiconset/AppIcon.png', 'ios/BeatBox/Assets.xcassets/Startfarbe.colorset/Contents.json',
    'codemagic.yaml', '.gitignore'];
  const fehlend = IOS.filter(function (rel) { return !fs.existsSync(path.join(WURZEL, rel)); });
  if (fehlend.length) return fehlend.map(function (x) { return 'fehlt: ' + x; });
  const yml = lies('ios/project.yml');
  const cm = lies('codemagic.yaml');
  const swift = ['AppDelegate', 'SceneDelegate', 'Audiositzung', 'WebDateiHandler', 'SpielViewController']
    .map(function (n) { return lies('ios/BeatBox/' + n + '.swift'); }).join('\n');
  const html = lies('index.html');
  const main = ohneKommentare(lies('js/main.js'));

  /* Bundle-ID und Platzhalter */
  /* Nur echte Einträge, keine Kommentarzeilen */
  const idProjekt = (yml.match(/^\s+PRODUCT_BUNDLE_IDENTIFIER:\s*([\w.-]+)\s*$/m) || [])[1];
  const idCodemagic = (cm.match(/^\s+bundle_identifier:\s*([\w.-]+)\s*$/m) || [])[1];
  if (!idProjekt || !/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(idProjekt)) f.push('Bundle-ID in project.yml fehlt oder ist ungültig');
  if (idProjekt !== idCodemagic) f.push('Bundle-ID weicht ab: project.yml ' + idProjekt + ', codemagic.yaml ' + idCodemagic);
  const platzhalter = [];
  if (/^de\.example\./.test(idProjekt || '')) platzhalter.push('Bundle-ID ' + idProjekt);
  if (/APP_STORE_APPLE_ID:\s*0+\s*$/m.test(cm)) platzhalter.push('APP_STORE_APPLE_ID');
  if (platzhalter.length) {
    if (ARGS.indexOf('--release') >= 0) platzhalter.forEach(function (x) { f.push('Platzhalter noch nicht ersetzt: ' + x); });
    else console.log('            Hinweis: vor dem ersten Codemagic-Build ersetzen: ' + platzhalter.join(', '));
  }

  /* Web-Paket wird ins Bundle kopiert und vom Schema-Handler ausgeliefert */
  ['../index.html', '../css', '../js'].forEach(function (q) {
    if (yml.indexOf('path: ' + q) < 0) f.push('project.yml kopiert ' + q + ' nicht');
    if (!fs.existsSync(path.join(WURZEL, 'ios', q))) f.push('Quelle fehlt: ' + q);
  });
  const erlaubt = ((swift.match(/erlaubtePfade = \[([^\]]*)\]/) || [])[1] || '').match(/"([^"]+)"/g) || [];
  const pfade = erlaubt.map(function (x) { return x.slice(1, -1); });
  let m;
  const re = /(?:src|href)\s*=\s*"([^"]+)"/g;
  const verweise = ['index.html'];
  while ((m = re.exec(html))) verweise.push(m[1]);
  verweise.forEach(function (v) {
    if (!pfade.some(function (p) { return v === p || (p.endsWith('/') && v.startsWith(p)); })) f.push('Schema-Handler liefert nicht aus: ' + v);
  });
  if (!/static let schema = "beatbox"/.test(swift) || !/beatbox:\/\/localhost\/index\.html/.test(swift)) f.push('Schema beatbox:// uneinheitlich');
  if (!/decidePolicyFor/.test(swift) || !/\.cancel/.test(swift)) f.push('Navigation wird nicht auf das eigene Schema begrenzt');

  /* Haptik-Brücke: gleicher Name auf beiden Seiten */
  const nachricht = (swift.match(/vibrationsNachricht = "(\w+)"/) || [])[1];
  if (!nachricht || main.indexOf('messageHandlers.' + nachricht) < 0) f.push('Name der Haptik-Nachricht stimmt nicht mit js/main.js überein');

  /* Kein Netzwerk im Swift-Code */
  const swiftCode = ohneKommentare(swift);
  if (/https?:\/\//.test(swiftCode) || /URLSession|NWConnection/.test(swiftCode)) f.push('Swift-Code enthält Netzwerkzugriff');

  /* Grobe Syntaxkontrolle: Klammern ausgeglichen (echter Compiler nur auf dem Mac) */
  const ohneTexte = swiftCode.replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  [['{', '}'], ['(', ')'], ['[', ']']].forEach(function (k) {
    const auf = ohneTexte.split(k[0]).length, zu = ohneTexte.split(k[1]).length;
    if (auf !== zu) f.push('Swift: Klammern ' + k[0] + k[1] + ' unausgeglichen');
  });
  if (!/class SceneDelegate/.test(swift) || yml.indexOf('$(PRODUCT_MODULE_NAME).SceneDelegate') < 0) f.push('SceneDelegate nicht verdrahtet');
  /* XcodeGen nimmt alles unter ios/BeatBox auf, auch Unterordner. Alte Swift-Dateien
     (z. B. ios/BeatBox/Sources/AppDelegate.swift aus Build 1) führen sonst zu
     "Filename used twice" bzw. zwei @main. Nur die fünf bekannten Swift-Dateien sind erlaubt. */
  (function swiftDateien(dir) {
    fs.readdirSync(path.join(WURZEL, dir), { withFileTypes: true }).forEach(function (e) {
      const rel = dir + '/' + e.name;
      if (e.isDirectory()) { if (!/\.(xcassets|lproj)$/.test(e.name)) swiftDateien(rel); return; }
      if (/\.swift$/.test(e.name) && ['AppDelegate', 'SceneDelegate', 'Audiositzung', 'WebDateiHandler', 'SpielViewController']
        .map(function (n) { return 'ios/BeatBox/' + n + '.swift'; }).indexOf(rel) < 0) f.push('unerwartete Swift-Datei (doppelt oder veraltet): ' + rel);
    });
  })('ios/BeatBox');
  if ((swift.match(/@main\b/g) || []).length !== 1) f.push('@main muss genau einmal vorkommen');
  if (!/@main/.test(swift)) f.push('@main fehlt');

  /* Pflichtangaben für App Store und Build-Nummer */
  if (!/VERSIONING_SYSTEM:\s*apple-generic/.test(yml)) f.push('VERSIONING_SYSTEM apple-generic fehlt (agvtool braucht es)');
  if (!/ITSAppUsesNonExemptEncryption:\s*false/.test(yml)) f.push('Exportangabe ITSAppUsesNonExemptEncryption fehlt');
  if (!/UISupportedInterfaceOrientations:\s*\[UIInterfaceOrientationPortrait\]/.test(yml)) f.push('nicht nur Hochformat');
  if (!/NSPrivacyTracking<\/key>\s*<false\/>/.test(lies('ios/BeatBox/PrivacyInfo.xcprivacy'))) f.push('Datenschutz-Manifest: NSPrivacyTracking nicht false');

  /* App-Symbol: 1024 × 1024, PNG ohne Alphakanal */
  const png = fs.readFileSync(path.join(WURZEL, 'ios/BeatBox/Assets.xcassets/AppIcon.appiconset/AppIcon.png'));
  const breite = png.readUInt32BE(16), hoehe = png.readUInt32BE(20), farbtyp = png[25];
  if (png.toString('ascii', 1, 4) !== 'PNG') f.push('AppIcon.png ist kein PNG');
  if (breite !== 1024 || hoehe !== 1024) f.push('AppIcon.png ist ' + breite + ' × ' + hoehe + ' statt 1024 × 1024');
  if (farbtyp !== 2) f.push('AppIcon.png hat einen Alphakanal oder ist kein RGB (Farbtyp ' + farbtyp + ')');
  if (lies('ios/BeatBox/Assets.xcassets/AppIcon.appiconset/Contents.json').indexOf('"AppIcon.png"') < 0) f.push('AppIcon.png nicht im Asset-Katalog eingetragen');

  /* Codemagic-Ablauf */
  /* Der Name des App-Store-Connect-Schlüssels muss in jedem Ablauf derselbe sein
     und darf kein Platzhalter mehr sein. Ein falscher Name führt zu
     "No matching profiles found", nicht zu einer Meldung über den Schlüssel. */
  const schluessel = cm.split('\n')
    .filter(function (z) { return z.trim().indexOf('#') !== 0; })
    .map(function (z) { return (z.match(/^\s*app_store_connect:\s*(\S.*?)\s*$/) || [])[1]; })
    .filter(function (z) { return z; });
  if (!schluessel.length) f.push('codemagic.yaml nennt keinen App-Store-Connect-Schlüssel');
  if (new Set(schluessel).size > 1) f.push('App-Store-Connect-Schlüssel heißt nicht überall gleich: ' + schluessel.join(' | '));
  if (schluessel.indexOf('BeatBox API-Schluessel') >= 0) f.push('Platzhaltername für den App-Store-Connect-Schlüssel steht noch in codemagic.yaml');
  if (cm.indexOf('node tools/pruefung.js --release') < 0) f.push('codemagic.yaml führt das Prüfskript nicht aus');
  if (cm.indexOf('xcodegen generate') < 0) f.push('codemagic.yaml erzeugt das Xcode-Projekt nicht');
  if (!/--scheme BeatBox\b/.test(cm) || !/^schemes:\s*\n\s+BeatBox:/m.test(yml)) f.push('Schema BeatBox nicht in beiden Dateien');
  /* XcodeGen benennt die erzeugte .xcodeproj nach "name" in project.yml.
     Weicht dieser Name von dem ab, den codemagic.yaml baut, bricht der Build
     erst im letzten Schritt ab. Deshalb hier maschinell gegengeprüft. */
  const projName = (yml.match(/^name:\s*(\S+)\s*$/m) || [])[1];
  if (!projName) {
    f.push('project.yml hat kein auswertbares Feld name');
  } else {
    const erwartet = 'ios/' + projName + '.xcodeproj';
    if (cm.indexOf(erwartet) < 0) {
      f.push('codemagic.yaml baut nicht ' + erwartet + ' (project.yml heißt "' + projName + '")');
    }
    if (lies('.gitignore').indexOf(erwartet + '/') < 0) {
      f.push('.gitignore schließt ' + erwartet + ' nicht aus');
    }
  }
  return f;
});

console.log('\nBestanden: ' + bestanden + '   Fehlgeschlagen: ' + fehlgeschlagen);
process.exit(fehlgeschlagen ? 1 : 0);
