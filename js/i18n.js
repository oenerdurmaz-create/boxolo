/* BeatBox – Textbausteine.
 *
 * Alle sichtbaren Texte stehen ausschließlich hier. Aktiv ist derzeit nur Deutsch.
 * Neue Sprache: Eintrag in SPRACHEN mit allen Schlüsseln von "de" anlegen.
 * Das Prüfskript verlangt identische Schlüssel und identische Platzhalter in jeder
 * aktiven Sprache. Für Sprachen mit Leserichtung rechts nach links "richtung: 'rtl'" setzen.
 */
(function (global) {
  'use strict';
  var BB = global.BB = global.BB || {};

  /* Geplanter Sprachumfang (12). Aktiv ist, was in SPRACHEN steht. */
  var GEPLANT = ['de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'tr', 'ar', 'ja', 'zh'];

  var SPRACHEN = {
    de: {
      name: 'Deutsch',
      richtung: 'ltr',
      locale: 'de-DE',
      texte: {
        'app.titel': 'BeatBox',
        'app.unterzeile': 'Reaktion, Timing und Kombinationen auf sechs Pratzen.',

        'modus.reaktion.name': 'Reaktion',
        'modus.reaktion.kurz': 'Eine Zone leuchtet auf – so schnell wie möglich treffen. 20 Schläge.',
        'modus.timing.name': 'Timing',
        'modus.timing.kurz': 'Ein Ring zieht sich zusammen – treffen, wenn er den Rand berührt.',
        'modus.kombination.name': 'Kombination',
        'modus.kombination.kurz': 'Eine Schlagfolge ansehen und in der richtigen Reihenfolge nachschlagen.',
        'modus.ausdauer.name': 'Ausdauer',
        'modus.ausdauer.kurz': '60 Sekunden Dauerfeuer, alle 10 Sekunden schneller.',
        'modus.rhythmus.name': 'Rhythmus',
        'modus.rhythmus.kurz': 'Folgen auf den Zählzeiten der Musik: erst zuhören, dann nachspielen.',

        'menue.modus': 'Modus',
        'menue.level': 'Level',
        'menue.level_nr': 'Level {n}',
        'menue.level_details': '{bpm}\u00a0BPM, {zonen} Zonen, Folgen bis {laenge} Schläge, Fenster ±{fenster}\u00a0ms, Störziele: {stoer}',
        'menue.sterne': '{n} von 3 Sternen',
        'menue.nicht_gespielt': 'noch nicht gespielt',
        'menue.level_aria': '{level}, {wertung}',
        'menue.start': 'Runde starten',
        'menue.kalibrierung_wert': 'Kalibrierung: {ms}\u00a0ms',
        'menue.kalibrierung_offen': 'Kalibrierung: noch nicht gemessen, es gilt {ms}\u00a0ms',
        'menue.build': 'Build {build}',

        'nav.bestenliste': 'Bestenliste',
        'nav.verlauf': 'Verlauf',
        'nav.kalibrierung': 'Kalibrieren',
        'nav.hilfe': 'Hilfe',
        'nav.einstellungen': 'Einstellungen',
        'nav.zurueck': 'Zurück',

        'zone.1': 'Jab links',
        'zone.2': 'Cross rechts',
        'zone.3': 'Haken links',
        'zone.4': 'Haken rechts',
        'zone.5': 'Uppercut links',
        'zone.6': 'Uppercut rechts',
        'position.1': 'oben links',
        'position.2': 'oben rechts',
        'position.3': 'Mitte links',
        'position.4': 'Mitte rechts',
        'position.5': 'unten links',
        'position.6': 'unten rechts',
        'zone.stoer': 'Nicht treffen',
        'zone.aria': 'Zone {nr}: {name}',

        'hud.punkte': 'Punkte',
        'hud.serie': 'Serie',
        'hud.multi': 'Multi',
        'hud.treffer': 'Treffer',
        'hud.zeit': 'Zeit',
        'hud.treffer_wert': '{treffer}/{gesamt}',
        'hud.zeit_wert': '{s}\u00a0s',
        'hud.multi_wert': '×{m}',
        'spiel.abbrechen': 'Abbrechen',
        'folge.aria': 'Folge {folge}',

        'status.vorzaehler': 'Vorzähler – zähl mit',
        'status.timing': 'Tippe, wenn der Ring den Rand berührt',
        'status.ausdauer': '60 Sekunden Dauerfeuer',
        'status.tempo': 'Schneller: {bpm}\u00a0BPM',
        'status.zuhoeren': 'Zuhören und zuschauen',
        'status.nachspielen': 'Jetzt du – auf den Takt',
        'status.zuschauen': 'Merk dir die Folge',
        'status.los': 'Los – ein Schlag pro Klick',
        'status.abgebrochen': 'Folge abgebrochen',
        'status.folge_geschafft': 'Folge geschafft',
        'status.reaktion': 'Warte, bis eine Zone aufleuchtet',
        'status.unterbrochen': 'Die Runde wurde unterbrochen, weil die App im Hintergrund war. Sie wird nicht gewertet.',
        'status.audio_fehlt': 'Der Ton ließ sich nicht starten. Tippe noch einmal auf „Runde starten“.',
        'status.level_ungueltig': 'Dieses Level ist nicht spielbar: {fehler}',

        'urteil.perfekt': 'Perfekt',
        'urteil.gut': 'Gut',
        'urteil.ok': 'Ok',
        'urteil.daneben': 'Daneben',
        'detail.frueh': '{ms}\u00a0ms zu früh',
        'detail.spaet': '{ms}\u00a0ms zu spät',
        'detail.genau': 'auf den Punkt',
        'detail.reaktion': '{ms}\u00a0ms',
        'detail.verpasst': 'verpasst',
        'detail.falsche_zone': 'falsche Zone',
        'detail.stoerziel': 'Störziel getroffen',
        'detail.fehlstart': 'Fehlstart',
        'detail.fehltipp': 'kein Ziel',

        'ergebnis.titel': 'Ergebnis',
        'ergebnis.punkte': 'Endpunktzahl',
        'ergebnis.formel': '{summe} Schlagpunkte × {multi} Multiplikator × {faktor} Levelfaktor',
        'ergebnis.kopf': '{modus}, {level}',
        'ergebnis.treffer': '{treffer}/{gesamt} Treffer – Trefferquote {quote} %',
        'ergebnis.sterne': '{n} von 3 Sternen',
        'ergebnis.serie': 'Längste Serie',
        'ergebnis.mittel_reaktion': 'Ø Reaktionszeit',
        'ergebnis.bester': 'Bester Wert',
        'ergebnis.schlechtester': 'Schlechtester Wert',
        'ergebnis.mittel_abweichung': 'Ø Abweichung',
        'ergebnis.tendenz': 'Tendenz',
        'ergebnis.spm': 'Schläge pro Minute',
        'ergebnis.urteile': 'Perfekt {p}, Gut {g}, Ok {o}, Daneben {d}',
        'ergebnis.fehler': 'Fehltipps {f}, Störziele getroffen {s}',
        'ergebnis.platz': 'Platz {platz} von {max} in der Bestenliste',
        'ergebnis.kein_platz': 'Nicht unter den besten {max} dieser Bestenliste',
        'ergebnis.nochmal': 'Noch einmal',
        'ergebnis.menue': 'Zum Menü',
        'ergebnis.ms': '{ms}\u00a0ms',
        'ergebnis.kein_wert': '–',

        'bestenliste.titel': 'Bestenliste',
        'bestenliste.leer': 'Noch keine Einträge für diesen Modus und dieses Level.',
        'bestenliste.platz': 'Platz',
        'bestenliste.name': 'Name',
        'bestenliste.punkte': 'Punkte',
        'bestenliste.quote': 'Quote',
        'bestenliste.serie': 'Serie',
        'bestenliste.ms': 'Ø ms',
        'bestenliste.datum': 'Datum',
        'bestenliste.hinweis': 'Ø ms ist im Modus Reaktion die Reaktionszeit, sonst die mittlere Abweichung vom Takt.',

        'verlauf.titel': 'Verlauf',
        'verlauf.erklaerung': 'Durchschnittliche Reaktionszeit im Modus Reaktion, als Tagesmittel über die letzten 30 Tage.',
        'verlauf.leer': 'Noch keine Daten. Spiel eine Runde im Modus Reaktion, dann erscheint hier deine Kurve.',
        'verlauf.info': 'An {tage} von 30 Tagen gespielt. Bester Tag: {ms}\u00a0ms.',
        'verlauf.punkt': '{datum}: {ms}\u00a0ms',
        'verlauf.heute': 'heute',
        'verlauf.vor_tagen': 'vor {n} Tagen',

        'kalib.titel': 'Kalibrierung',
        'kalib.erklaerung': 'Du hörst vier Vorzähler-Klicks und danach acht weitere Schläge. Tippe diese acht Schläge auf der Fläche mit. Der Median deiner Abweichungen wird als persönlicher Korrekturwert gespeichert und von jeder Messung abgezogen.',
        'kalib.bluetooth': 'Bluetooth-Kopfhörer verzögern den Ton um 100 bis 200\u00a0ms. Mit kabelgebundenen Kopfhörern oder dem Lautsprecher des Geräts wird die Messung genauer.',
        'kalib.start': 'Messung starten',
        'kalib.zuruecksetzen': 'Auf 0\u00a0ms zurücksetzen',
        'kalib.pad': 'Hier mittippen',
        'kalib.vor': 'Vorzähler {n}',
        'kalib.mess': 'Schlag {n} von 8',
        'kalib.tipps': '{n}/{max} Schläge erfasst',
        'kalib.fertig': 'Gemessen: {ms}\u00a0ms aus {n} Schlägen. Der Wert ist gespeichert.',
        'kalib.fehler': 'Nur {n} Schläge erfasst, mindestens {min} sind nötig. Bitte noch einmal.',
        'kalib.aktuell': 'Aktueller Korrekturwert: {ms}\u00a0ms',
        'kalib.bereit': 'Tippe auf „Messung starten“.',
        'kalib.zurueckgesetzt': 'Der Korrekturwert steht wieder auf 0\u00a0ms.',

        'einst.titel': 'Einstellungen',
        'einst.name': 'Name für die Bestenliste',
        'einst.name_platzhalter': 'Dein Name',
        'einst.standardname': 'Spieler',
        'einst.sprache': 'Sprache',
        'einst.vibration': 'Vibration bei jedem Schlag',
        'einst.an': 'An',
        'einst.aus': 'Aus',
        'einst.daten': 'Alle Daten bleiben auf diesem Gerät. Es gibt kein Konto und keine Datenübertragung.',

        'hilfe.titel': 'Hilfe',
        'hilfe.dokumenttitel': 'BeatBox – Hilfe',
        'hilfe.ueberblick.titel': 'Worum es geht',
        'hilfe.ueberblick.text': 'Sechs Trefferzonen wie Pratzen im Boxtraining. Zonen leuchten auf oder werden von einem Ring angekündigt, und du triffst sie mit den Fingern – so schnell und so genau wie möglich. Gemessen werden Reaktionszeit in Millisekunden, Trefferquote und Serienlänge.',
        'hilfe.zonen.titel': 'Die sechs Zonen',
        'hilfe.zonen.text': 'Die Nummern folgen der Boxnotation. Ungerade Nummern liegen links, gerade rechts. Jede Zone hat eine eigene Farbe und ist beschriftet.',
        'hilfe.zone_zeile': '{nr}: {name} ({position})',
        'hilfe.modi.titel': 'Die fünf Modi',
        'hilfe.modus.reaktion': 'Eine zufällige Zone leuchtet zu einem zufälligen Zeitpunkt auf. Triff sie so schnell wie möglich. Gemessen wird die Zeit vom Aufleuchten bis zur Berührung. Nach 20 Schlägen siehst du Durchschnitt, besten und schlechtesten Wert. Wer tippt, bevor etwas leuchtet, macht einen Fehlstart. Die Musik ist nur Kulisse und gibt keinen Takt vor.',
        'hilfe.modus.timing': 'Um eine Zone zieht sich ein Ring zusammen. Triff den Moment, in dem der Ring genau auf dem Zonenrand liegt. Du siehst die Abweichung in Millisekunden mit Vorzeichen: zu früh oder zu spät.',
        'hilfe.modus.kombination': 'Eine Schlagfolge wie 1-2-5-2 wird vorgespielt: Die Zonen leuchten nacheinander auf. Nach dem Los-Signal schlägst du die Folge in derselben Reihenfolge, je ein Schlag pro Klick. Eine falsche Zone beendet die Folge und die Serie. Standardfolgen sind 1-2, 1-2-3, 1-2-5-2, 3-4-6-2 und 1-1-2-3-2.',
        'hilfe.modus.ausdauer': '60 Sekunden Dauerfeuer mit Ringen wie im Modus Timing. Alle 10 Sekunden steigt das Tempo. Ergebnis: Schläge pro Minute und Trefferquote.',
        'hilfe.modus.rhythmus': 'Die Schlagfolgen liegen auf den Zählzeiten der Musik. Im ersten Takt hörst und siehst du die Folge, im zweiten Takt spielst du sie mit Hilfe der Ringe nach. So lernst du die Kombination über den Takt. Der Modus verbindet Timing und Kombination.',
        'hilfe.bewertung.titel': 'Bewertung',
        'hilfe.bewertung.text': 'Jeder Schlag erhält ein Urteil nach seiner Abweichung vom Sollzeitpunkt:',
        'hilfe.urteil_zeile': '{name}: bis ±{ms}\u00a0ms, {punkte} Punkte',
        'hilfe.urteil_daneben': '{name}: darüber oder falsche Zone, 0 Punkte, die Serie endet',
        'hilfe.bewertung.fenster': 'Das Trefferfenster des Levels begrenzt nach außen. Liegt es zum Beispiel bei ±70\u00a0ms, ist jede größere Abweichung Daneben.',
        'hilfe.bewertung.reaktion': 'Im Modus Reaktion zählt die Zeit bis zur Berührung: Perfekt bis {perfekt}\u00a0ms, Gut bis {gut}\u00a0ms, Ok bis zum Zeitlimit des Levels. Unter {frueh}\u00a0ms gilt als Fehlstart.',
        'hilfe.bewertung.quote': 'Trefferquote = getroffene Ziele geteilt durch alle Ziele, in Prozent.',
        'hilfe.bewertung.multi': 'Der Serienmultiplikator steigt alle {n} Treffer in Folge: {stufen}. Ein Daneben, ein Fehltipp oder ein getroffenes Störziel beendet die Serie.',
        'hilfe.bewertung.formel': 'Endpunktzahl = Summe der Schlagpunkte × höchster erreichter Serienmultiplikator × Levelfaktor. Der Levelfaktor reicht von {von} in Level 1 bis {bis} in Level 10.',
        'hilfe.bewertung.zaehlen': 'Punkte werden nur gezählt. Es wird nichts abgezogen, nichts ausgegeben und nichts gekauft.',
        'hilfe.bewertung.sterne': 'Sterne: 1 ab {s1} %, 2 ab {s2} %, 3 ab {s3} % Trefferquote.',
        'hilfe.level.titel': 'Level',
        'hilfe.level.text': 'Jeder Modus hat zehn Level. Von Level 1 bis 10 steigen Tempo ({bpm1} bis {bpm10}\u00a0BPM), Zahl der aktiven Zonen ({z1} bis {z10}) und Länge der Folgen ({l1} bis {l10} Schläge). Das Trefferfenster wird enger (±{f1} bis ±{f10}\u00a0ms), und ab Level {stoerAb} erscheinen bis zu {stoerMax} Störziele gleichzeitig.',
        'hilfe.level.frei': 'Alle Level und Modi sind von Anfang an frei wählbar.',
        'hilfe.level.stoer': 'Störziele sind rot gestreift und mit ✕ markiert. Sie dürfen nicht getroffen werden.',
        'hilfe.kalibrierung.titel': 'Kalibrierung',
        'hilfe.kalibrierung.text': 'Zwischen Ton, Bild und Berührung vergeht auf jedem Gerät etwas Zeit. In der Kalibrierung tippst du acht Schläge mit. Der Median deiner Abweichung wird gespeichert und von jeder Messung abgezogen. Der Wert steht im Menü und lässt sich jederzeit neu messen oder auf 0\u00a0ms zurücksetzen.',
        'hilfe.daten.titel': 'Bestenlisten und Verlauf',
        'hilfe.daten.text': 'Die Bestenlisten werden je Modus und je Level getrennt geführt, mit Name, Punktzahl, Trefferquote, längster Serie, durchschnittlicher Reaktionszeit und Datum. Ø ms ist im Modus Reaktion die Reaktionszeit, sonst die mittlere Abweichung vom Takt. Der Verlauf zeigt die durchschnittliche Reaktionszeit der letzten 30 Tage als Kurve.',
        'hilfe.daten.speicher': 'Alles wird nur auf diesem Gerät gespeichert. Es gibt kein Konto, keine Werbung und keine Datenübertragung.',

        'sprache.de': 'Deutsch'
      }
    }
  };

  var aktuell = 'de';

  function aktiveSprachen() { return Object.keys(SPRACHEN); }

  function setzeSprache(code) {
    if (SPRACHEN[code]) aktuell = code;
    return aktuell;
  }

  function sprache() { return aktuell; }
  function richtung() { return SPRACHEN[aktuell].richtung; }
  function locale() { return SPRACHEN[aktuell].locale; }

  function t(schluessel, werte) {
    var texte = SPRACHEN[aktuell].texte;
    var s = Object.prototype.hasOwnProperty.call(texte, schluessel) ? texte[schluessel] : SPRACHEN.de.texte[schluessel];
    if (s === undefined) return schluessel;
    if (!werte) return s;
    return s.replace(/\{(\w+)\}/g, function (ganz, name) {
      return Object.prototype.hasOwnProperty.call(werte, name) ? String(werte[name]) : ganz;
    });
  }

  function zahl(n, nachkomma) {
    var stellen = nachkomma === undefined ? 0 : nachkomma;
    try {
      return new Intl.NumberFormat(locale(), { minimumFractionDigits: 0, maximumFractionDigits: stellen }).format(n);
    } catch (e) {
      return String(Math.round(n * Math.pow(10, stellen)) / Math.pow(10, stellen));
    }
  }

  function datum(iso) {
    try {
      return new Intl.DateTimeFormat(locale(), { day: '2-digit', month: '2-digit' }).format(new Date(iso));
    } catch (e) {
      return String(iso).slice(0, 10);
    }
  }

  /* Hilfe als Blockliste. Dieselben Blöcke erzeugen den Hilfe-Bildschirm und HILFE.md. */
  function hilfeBloecke(spiel, levels) {
    var b = [];
    function h(ebene, key) { b.push({ art: 'h' + ebene, text: t(key) }); }
    function p(text) { b.push({ art: 'p', text: text }); }

    h(1, 'hilfe.dokumenttitel');
    h(2, 'hilfe.ueberblick.titel');
    p(t('hilfe.ueberblick.text'));

    h(2, 'hilfe.zonen.titel');
    p(t('hilfe.zonen.text'));
    var zonen = [];
    for (var z = 1; z <= 6; z++) zonen.push(t('hilfe.zone_zeile', { nr: z, name: t('zone.' + z), position: t('position.' + z) }));
    b.push({ art: 'liste', eintraege: zonen });

    h(2, 'hilfe.modi.titel');
    levels.MODI.forEach(function (m) {
      h(3, 'modus.' + m + '.name');
      p(t('hilfe.modus.' + m));
    });

    h(2, 'hilfe.bewertung.titel');
    p(t('hilfe.bewertung.text'));
    var urteile = spiel.URTEILE.map(function (u) {
      return t('hilfe.urteil_zeile', { name: t('urteil.' + u.key), ms: u.fenster_ms, punkte: u.punkte });
    });
    urteile.push(t('hilfe.urteil_daneben', { name: t('urteil.daneben') }));
    b.push({ art: 'liste', eintraege: urteile });
    p(t('hilfe.bewertung.fenster'));
    p(t('hilfe.bewertung.reaktion', {
      perfekt: spiel.REAKTION_GRENZEN.perfekt_ms, gut: spiel.REAKTION_GRENZEN.gut_ms, frueh: spiel.REAKTION_GRENZEN.fruehstart_ms
    }));
    p(t('hilfe.bewertung.quote'));
    p(t('hilfe.bewertung.multi', {
      n: spiel.TREFFER_JE_STUFE,
      stufen: spiel.MULTIPLIKATOREN.map(function (m) { return '×' + zahl(m, 1); }).join(' → ')
    }));
    var s = levels.STUFEN;
    p(t('hilfe.bewertung.formel', { von: zahl(s[0].levelfaktor, 1), bis: zahl(s[s.length - 1].levelfaktor, 1) }));
    p(t('hilfe.bewertung.zaehlen'));
    p(t('hilfe.bewertung.sterne', { s1: spiel.STERNE_SCHWELLEN[0], s2: spiel.STERNE_SCHWELLEN[1], s3: spiel.STERNE_SCHWELLEN[2] }));

    h(2, 'hilfe.level.titel');
    var erste = s[0], letzte = s[s.length - 1], stoerAb = null, stoerMax = 0;
    s.forEach(function (x) {
      if (x.stoerziele > 0 && stoerAb === null) stoerAb = x.level;
      if (x.stoerziele > stoerMax) stoerMax = x.stoerziele;
    });
    p(t('hilfe.level.text', {
      bpm1: erste.bpm, bpm10: letzte.bpm, z1: erste.aktive_zonen, z10: letzte.aktive_zonen,
      l1: erste.sequenzlaenge, l10: letzte.sequenzlaenge, f1: erste.trefferfenster_ms, f10: letzte.trefferfenster_ms,
      stoerAb: stoerAb, stoerMax: stoerMax
    }));
    p(t('hilfe.level.frei'));
    p(t('hilfe.level.stoer'));

    h(2, 'hilfe.kalibrierung.titel');
    p(t('hilfe.kalibrierung.text'));
    p(t('kalib.bluetooth'));

    h(2, 'hilfe.daten.titel');
    p(t('hilfe.daten.text'));
    p(t('hilfe.daten.speicher'));
    return b;
  }

  BB.i18n = {
    GEPLANT: GEPLANT,
    SPRACHEN: SPRACHEN,
    aktiveSprachen: aktiveSprachen,
    setzeSprache: setzeSprache,
    sprache: sprache,
    richtung: richtung,
    locale: locale,
    t: t,
    zahl: zahl,
    datum: datum,
    hilfeBloecke: hilfeBloecke
  };
})(typeof window !== 'undefined' ? window : this);
