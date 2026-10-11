/* Nimmt sechs Szenen je Sprache aus der echten App auf. */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = '/tmp/claude-0/-home-claude-beatbox/ede55496-b311-53ed-98a9-6b243fe10608/scratchpad/roh';
const SPRACHEN = ['ar', 'zh', 'nl', 'en', 'fr', 'de', 'it', 'ja', 'pl', 'pt', 'es', 'tr'];
const BREITE = 1040;
const SKALA = BREITE / 375;

fs.mkdirSync(OUT, { recursive: true });

/* Im Browser: Daten säen, damit Menü, Bestenliste und Verlauf echt gefüllt sind. */
function saeen() {
  const P = 'beatbox.v1.';
  const tag = (d) => d.toISOString();
  const heute = new Date();
  const eintrag = (name, punkte, quote, serie, ms, sterne, treffer, gesamt, tageZurueck) => {
    const d = new Date(heute.getTime() - tageZurueck * 86400000);
    return { name, punkte, quote, serie, mittel_ms: ms, datum: tag(d), sterne, treffer, gesamt };
  };
  localStorage.setItem(P + 'bestenliste.reaktion.1', JSON.stringify([
    eintrag('Mia', 6840, 100, 20, 288, 3, 20, 20, 1),
    eintrag('Jonas', 6120, 95, 17, 311, 3, 19, 20, 3),
    eintrag('Mia', 5400, 90, 12, 335, 2, 18, 20, 6),
    eintrag('Emre', 4950, 85, 11, 352, 2, 17, 20, 9),
    eintrag('Jonas', 4200, 80, 9, 389, 1, 16, 20, 14)
  ]));
  localStorage.setItem(P + 'bestenliste.timing.1', JSON.stringify([
    eintrag('Mia', 5880, 95, 15, 34, 3, 19, 20, 2)
  ]));
  localStorage.setItem(P + 'bestenliste.kombination.1', JSON.stringify([
    eintrag('Mia', 4600, 88, 10, 41, 2, 21, 24, 4)
  ]));
  /* Verlauf: 30 Tage, sichtbar fallende Reaktionszeit mit Streuung */
  const v = [];
  const werte = [398, null, 392, 386, null, 381, 377, 380, null, 371, 366, 369, null, 361,
    357, null, 352, 355, 348, null, 344, 339, 341, null, 333, 329, null, 322, 316, 311];
  werte.forEach((ms, i) => {
    if (ms === null) return;
    const d = new Date(heute.getTime() - (29 - i) * 86400000);
    v.push({ datum: tag(d), modus: 'reaktion', level: 1, mittel_ms: ms });
  });
  localStorage.setItem(P + 'verlauf', JSON.stringify(v));
}

/* Spielbildschirm in einen festen Zustand bringen. */
function spielBild(opt) {
  const t = BB.i18n.t, zahl = BB.i18n.zahl;
  BB.app.zeige('spiel');
  const zonen = document.querySelectorAll('#zonen .zone');
  zonen.forEach((d, i) => {
    const z = i + 1;
    d.className = 'zone z' + z + (opt.aktiv.indexOf(z) >= 0 ? '' : ' inaktiv');
    d.querySelector('.zone-urteil').textContent = '';
    d.querySelector('.ringe').innerHTML = '';
  });
  (opt.ziele || []).forEach((z) => document.querySelector('.zone.z' + z).classList.add('ziel'));
  (opt.ringe || []).forEach((r) => {
    const zone = document.querySelector('.zone.z' + r.zone);
    const ring = document.createElement('div');
    ring.className = 'ring';
    const box = zone.getBoundingClientRect();
    const ueber = r.ueber;
    ring.style.transform = 'scale(' + (1 + 2 * ueber / box.width).toFixed(4) + ',' + (1 + 2 * ueber / box.height).toFixed(4) + ')';
    ring.style.opacity = String(r.deckung);
    zone.querySelector('.ringe').appendChild(ring);
  });
  if (opt.urteil) {
    const u = document.querySelector('.zone.z' + opt.urteil.zone + ' .zone-urteil');
    u.innerHTML = '';
    const s = document.createElement('strong');
    s.className = 'urteil-' + opt.urteil.key;
    s.textContent = t('urteil.' + opt.urteil.key);
    u.appendChild(s);
    if (opt.urteil.detail) {
      const sp = document.createElement('span');
      sp.className = 'urteil-detail';
      sp.textContent = t(opt.urteil.detail.key, { ms: zahl(opt.urteil.detail.ms) });
      u.appendChild(sp);
    }
    u.classList.add('zeigen');
  }
  document.getElementById('hud-punkte').textContent = zahl(opt.hud.summe);
  document.getElementById('hud-serie').textContent = zahl(opt.hud.serie);
  document.getElementById('hud-multi').textContent = t('hud.multi_wert', { m: zahl(opt.hud.multi, 1) });
  if (opt.hud.rest_s !== undefined) {
    document.getElementById('hud-fortschritt-label').textContent = t('hud.zeit');
    document.getElementById('hud-fortschritt').textContent = t('hud.zeit_wert', { s: zahl(opt.hud.rest_s) });
  } else {
    document.getElementById('hud-fortschritt-label').textContent = t('hud.treffer');
    document.getElementById('hud-fortschritt').textContent = t('hud.treffer_wert', { treffer: zahl(opt.hud.treffer), gesamt: zahl(opt.hud.gesamt) });
  }
  document.getElementById('spiel-status').textContent = t(opt.status);
  const f = document.getElementById('folge-anzeige');
  f.innerHTML = '';
  if (opt.folge) {
    opt.folge.zonen.forEach((z, i) => {
      const c = document.createElement('span');
      c.className = 'folge-schlag z' + z + (i < opt.folge.fortschritt ? ' erledigt' : '') + (i === opt.folge.fortschritt ? ' aktuell' : '');
      c.textContent = zahl(z);
      f.appendChild(c);
    });
  }
}

/* Ergebnisbildschirm aus echten Rechenfunktionen füllen. */
function ergebnisBild() {
  const t = BB.i18n.t, zahl = BB.i18n.zahl, S = BB.spiel;
  const level = 3, levelfaktor = BB.levels.STUFEN[level - 1].levelfaktor;
  const summe = 1795, maxMulti = 2;
  const treffer = 19, gesamt = 20;
  const quote = S.trefferquote(treffer, gesamt);
  const punkte = S.endpunktzahl(summe, maxMulti, levelfaktor);
  const st = S.sterne(quote);
  BB.app.zeige('ergebnis');
  document.getElementById('erg-kopf').textContent = t('ergebnis.kopf', { modus: t('modus.reaktion.name'), level: t('menue.level_nr', { n: level }) });
  document.getElementById('erg-punkte').textContent = zahl(punkte);
  document.getElementById('erg-formel').textContent = t('ergebnis.formel', { summe: zahl(summe), multi: zahl(maxMulti, 1), faktor: zahl(levelfaktor, 1) });
  const sterneEl = document.getElementById('erg-sterne');
  sterneEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const s = document.createElement('span');
    s.className = i < st ? 'stern voll' : 'stern';
    s.textContent = i < st ? '★' : '☆';
    sterneEl.appendChild(s);
  }
  const txt = document.createElement('span');
  txt.className = 'sterne-text';
  txt.textContent = t('ergebnis.sterne', { n: st });
  sterneEl.appendChild(txt);
  document.getElementById('erg-treffer').textContent = t('ergebnis.treffer', { treffer: zahl(treffer), gesamt: zahl(gesamt), quote: zahl(quote, 1) });
  const w = document.getElementById('erg-werte');
  w.innerHTML = '';
  const zeile = (k, v) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.className = 'zahl'; dd.textContent = v;
    w.appendChild(dt); w.appendChild(dd);
  };
  zeile(t('ergebnis.serie'), zahl(14));
  zeile(t('ergebnis.mittel_reaktion'), t('ergebnis.ms', { ms: zahl(302) }));
  zeile(t('ergebnis.bester'), t('ergebnis.ms', { ms: zahl(241) }));
  zeile(t('ergebnis.schlechtester'), t('ergebnis.ms', { ms: zahl(468) }));
  document.getElementById('erg-urteile').textContent = t('ergebnis.urteile', { p: zahl(11), g: zahl(6), o: zahl(2), d: zahl(1) });
  document.getElementById('erg-fehler').textContent = t('ergebnis.fehler', { f: zahl(0), s: zahl(0) });
  document.getElementById('erg-platz').textContent = t('ergebnis.platz', { platz: zahl(1), max: zahl(BB.speicher.MAX_EINTRAEGE) });
}

(async () => {
  const browser = await chromium.launch();
  const fehler = [];
  for (const code of SPRACHEN) {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: SKALA
    });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => fehler.push(code + ': ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') fehler.push(code + ' konsole: ' + m.text()); });
    await p.goto('file:///home/claude/beatbox/index.html');
    await p.evaluate(saeen);
    await p.reload();
    await p.waitForTimeout(500);
    await p.evaluate((c) => {
      BB.app.zeige('einstellungen');
      const s = document.getElementById('einst-sprache');
      s.value = c;
      s.dispatchEvent(new Event('change'));
    }, code);
    await p.waitForTimeout(250);
    const schuss = async (name) => {
      await p.waitForTimeout(220);
      await p.screenshot({ path: OUT + '/' + code + '-' + name + '.png' });
    };

    /* 1 Menü */
    await p.evaluate(() => BB.app.zeige('menue'));
    await schuss('1-menue');

    /* 2 Reaktion */
    await p.evaluate(spielBild, {
      aktiv: [1, 2, 3, 4], ziele: [2],
      hud: { summe: 820, serie: 9, multi: 1.5, treffer: 9, gesamt: 20 },
      status: 'status.reaktion'
    });
    await schuss('2-reaktion');

    /* 3 Timing */
    await p.evaluate(spielBild, {
      aktiv: [1, 2, 3, 4, 5, 6],
      ringe: [{ zone: 5, ueber: 7, deckung: 1 }, { zone: 2, ueber: 22, deckung: 0.5 }],
      urteil: { zone: 3, key: 'perfekt', detail: { key: 'detail.genau', ms: 0 } },
      hud: { summe: 2140, serie: 16, multi: 2, treffer: 16, gesamt: 24 },
      status: 'status.timing'
    });
    await schuss('3-timing');

    /* 4 Kombination */
    await p.evaluate(spielBild, {
      aktiv: [1, 2, 3, 4, 5, 6], ziele: [5],
      folge: { zonen: [1, 2, 5, 2], fortschritt: 2 },
      hud: { summe: 1480, serie: 12, multi: 1.5, treffer: 12, gesamt: 24 },
      status: 'status.los'
    });
    await schuss('4-kombination');

    /* 5 Ergebnis */
    await p.evaluate(ergebnisBild);
    await schuss('5-ergebnis');

    /* 6 Verlauf */
    await p.evaluate(() => BB.app.zeige('verlauf'));
    await schuss('6-verlauf');

    /* 7 Bestenliste */
    await p.evaluate(() => BB.app.zeige('bestenliste'));
    await schuss('7-bestenliste');

    await ctx.close();
  }
  await browser.close();
  console.log('Fehler:', fehler.length ? fehler.join(' | ') : 'keine');
})();
