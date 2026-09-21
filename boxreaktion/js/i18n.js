"use strict";
/* BeatBox - alle Textbausteine, Deutsch und Englisch.
   Regel: Jeder Schluessel existiert in beiden Sprachen (geprueft in tools/pruefung.js).
   Keine Textfragmente ausserhalb dieser Datei. */

const TEXTS = {
  de: {
    app: { subtitle: "Sechs Zonen. Ein Takt. Deine Reaktion." },
    menu: {
      start: "Spielen", highscores: "Bestenlisten", history: "Verlauf",
      calibrate: "Kalibrierung", help: "Hilfe",
      calibValue: "Kalibrierung: {ms} ms", calibNone: "Kalibrierung: nicht gesetzt"
    },
    modes: {
      title: "Modus wählen",
      reaktion: "Reaktion", timing: "Timing", kombination: "Kombination",
      ausdauer: "Ausdauer", rhythmus: "Rhythmus",
      descReaktion: "Zufällige Zone, zufälliger Moment. 20 Schläge.",
      descTiming: "Triff den Moment, in dem der Ring die Zone berührt.",
      descKombination: "Vorgeführte Folge in richtiger Reihenfolge tippen.",
      descAusdauer: "60 Sekunden Dauerfeuer, alle 10 Sekunden schneller.",
      descRhythmus: "Folge auf den Zählzeiten, gelernt über den Takt."
    },
    levels: { title: "Level wählen", level: "Level {n}" },
    hud: { hits: "Treffer", pause: "Pause" },
    judge: { perfect: "Perfekt", good: "Gut", ok: "Ok", miss: "Daneben", early: "zu früh", late: "zu spät" },
    game: { ready: "Bereit …", tapNow: "Los!", paused: "Pausiert", resume: "Weiter", quit: "Beenden" },
    result: {
      title: "Ergebnis", score: "Punkte", accuracy: "Trefferquote", streak: "Längste Serie",
      avgReaction: "Ø Reaktion", best: "Bester Wert", worst: "Schlechtester Wert",
      spm: "Schläge pro Minute", name: "Dein Name",
      save: "In Bestenliste speichern", saved: "Gespeichert",
      again: "Nochmal", menu: "Zum Menü"
    },
    hs: {
      title: "Bestenlisten", rank: "#", name: "Name", points: "Punkte", acc: "Quote",
      streak: "Serie", reaction: "Ø Reaktion", date: "Datum",
      empty: "Noch keine Einträge. Spiel eine Runde!"
    },
    hist: {
      title: "Verlauf", avg30: "Durchschnittliche Reaktionszeit, letzte 30 Tage",
      empty: "Noch keine Messungen."
    },
    cal: {
      title: "Kalibrierung",
      intro: "Klopfe acht Beats mit, sobald der Klick startet. Aus deiner mittleren Abweichung wird ein persönlicher Korrekturwert berechnet und von jeder Messung abgezogen.",
      btWarning: "Hinweis: Bluetooth-Kopfhörer erzeugen 100 bis 200 ms zusätzliche Verzögerung. Nutze für genaue Messungen den Lautsprecher oder kabelgebundene Kopfhörer.",
      start: "Start", tapping: "Mitklopfen: {n}/8", result: "Korrekturwert: {ms} ms",
      positive: "Du schlägst im Schnitt später als der Klick.",
      negative: "Du schlägst im Schnitt früher als der Klick.",
      again: "Neu messen", reset: "Korrektur löschen"
    },
    help: {
      title: "Hilfe",
      intro: "Boxe mit den Fingern auf sechs Trefferzonen. Gemessen werden Reaktionszeit, Trefferquote und Serienlänge. Alle Level sind von Anfang an offen: Es gibt keine Freischaltungen und keine Käufe. Punkte sind reine Leistungsanzeige und werden nie ausgegeben.",
      zonesTitle: "Die sechs Zonen (Boxnotation)",
      modesTitle: "Die fünf Modi",
      reaktion: "Eine zufällige Zone leuchtet zu einem zufälligen Zeitpunkt auf. Gemessen wird die Zeit vom Aufleuchten bis zur Berührung. Aus 20 Schlägen werden Durchschnitt, bester und schlechtester Wert gemeldet. Die Musik läuft nur als Kulisse und gibt keinen Takt vor.",
      timing: "Um die Zielzone zieht sich ein Ring zusammen. Triff den Moment, in dem Ring und Zonenrand zusammenfallen. Bewertet wird die Abweichung in Millisekunden mit Vorzeichen: zu früh oder zu spät.",
      kombination: "Eine Schlagfolge wird vorgeführt und muss in der richtigen Reihenfolge auf den Zählzeiten nachgetippt werden. Eine falsche Zone beendet die Serie.",
      ausdauer: "60 Sekunden Dauerfeuer, das Tempo steigt alle 10 Sekunden. Gemeldet werden Schläge pro Minute und Trefferquote.",
      rhythmus: "Die Schlagfolge liegt auf den Zählzeiten der Musik. Lerne die Kombination über den Takt; ein schrumpfender Ring zeigt den Sollmoment. So werden Timing und Folge verbunden.",
      scoringTitle: "Bewertung",
      scoring: "Perfekt: ±40 ms (100 Punkte). Gut: ±80 ms (60 Punkte). Ok: bis zum Trefferfenster des Levels (25 Punkte). Daneben: 0 Punkte, die Serie endet. Der Serienmultiplikator steigt alle 10 Treffer in Folge: ×1, ×1,5, ×2, ×3, ×4 (Obergrenze). Endpunktzahl = Summe der Schlagpunkte × erreichter Multiplikator × Levelfaktor.",
      calibTitle: "Kalibrierung",
      calib: "Unter Kalibrierung klopfst du acht Beats mit. Der Median deiner Abweichung wird als persönlicher Korrekturwert gespeichert und von jeder Messung abgezogen. Der Wert ist jederzeit im Menü sichtbar und neu ermittelbar.",
      calibHint: "Bluetooth-Kopfhörer erzeugen 100 bis 200 ms zusätzliche Verzögerung. Für genaue Messungen den Lautsprecher oder kabelgebundene Kopfhörer nutzen.",
      privacy: "Alle Daten bleiben ausschließlich auf dem Gerät. Kein Konto, keine Werbung, keine Übertragung."
    },
    common: { zone: "Zone {z}" },
    zones: { one: "Jab links", two: "Cross rechts", three: "Haken links", four: "Haken rechts", five: "Uppercut links", six: "Uppercut rechts" }
  },
  en: {
    app: { subtitle: "Six zones. One beat. Your reaction." },
    menu: {
      start: "Play", highscores: "Leaderboards", history: "Progress",
      calibrate: "Calibration", help: "Help",
      calibValue: "Calibration: {ms} ms", calibNone: "Calibration: not set"
    },
    modes: {
      title: "Choose a mode",
      reaktion: "Reaction", timing: "Timing", kombination: "Combination",
      ausdauer: "Endurance", rhythmus: "Rhythm",
      descReaktion: "Random zone, random moment. 20 punches.",
      descTiming: "Hit the moment the ring meets the zone.",
      descKombination: "Repeat the shown sequence in the right order.",
      descAusdauer: "60 seconds of nonstop targets, faster every 10 s.",
      descRhythmus: "Sequence on the beats, learned through the pulse."
    },
    levels: { title: "Choose a level", level: "Level {n}" },
    hud: { hits: "Hits", pause: "Pause" },
    judge: { perfect: "Perfect", good: "Good", ok: "Ok", miss: "Miss", early: "too early", late: "too late" },
    game: { ready: "Get ready …", tapNow: "Go!", paused: "Paused", resume: "Resume", quit: "Quit" },
    result: {
      title: "Result", score: "Points", accuracy: "Hit rate", streak: "Longest streak",
      avgReaction: "Avg. reaction", best: "Best value", worst: "Worst value",
      spm: "Punches per minute", name: "Your name",
      save: "Save to leaderboard", saved: "Saved",
      again: "Play again", menu: "Back to menu"
    },
    hs: {
      title: "Leaderboards", rank: "#", name: "Name", points: "Points", acc: "Rate",
      streak: "Streak", reaction: "Avg. reaction", date: "Date",
      empty: "No entries yet. Play a round!"
    },
    hist: {
      title: "Progress", avg30: "Average reaction time, last 30 days",
      empty: "No measurements yet."
    },
    cal: {
      title: "Calibration",
      intro: "Tap along with eight beats once the click starts. Your median deviation becomes a personal correction value that is subtracted from every measurement.",
      btWarning: "Note: Bluetooth headphones add 100 to 200 ms of delay. For accurate measurements use the loudspeaker or wired headphones.",
      start: "Start", tapping: "Tap along: {n}/8", result: "Correction value: {ms} ms",
      positive: "On average you tap later than the click.",
      negative: "On average you tap earlier than the click.",
      again: "Measure again", reset: "Clear correction"
    },
    help: {
      title: "Help",
      intro: "Box with your fingers on six target zones. Reaction time, hit rate and streak length are measured. All levels are open from the start: no locks, no purchases. Points only show performance and are never spent.",
      zonesTitle: "The six zones (boxing notation)",
      modesTitle: "The five modes",
      reaktion: "A random zone lights up at a random moment. The time from lighting up to your touch is measured. Over 20 punches you get the average, best and worst value. Music only plays as a backdrop and does not set a beat.",
      timing: "A ring shrinks around the target zone. Hit the moment when ring and zone border meet. Your deviation is judged in milliseconds with a sign: too early or too late.",
      kombination: "A punch sequence is shown first and must then be tapped in the right order on the counted beats. A wrong zone ends the streak.",
      ausdauer: "60 seconds of continuous targets, tempo rises every 10 seconds. You get punches per minute and hit rate.",
      rhythmus: "The sequence sits on the counted beats of the music. Learn the combination through the beat; a shrinking ring shows the target moment, combining timing and sequence.",
      scoringTitle: "Scoring",
      scoring: "Perfect: ±40 ms (100 points). Good: ±80 ms (60 points). Ok: up to the level's hit window (25 points). Miss: 0 points, the streak ends. The streak multiplier rises every 10 hits in a row: ×1, ×1.5, ×2, ×3, ×4 (maximum). Final score = sum of punch points × reached multiplier × level factor.",
      calibTitle: "Calibration",
      calib: "Under Calibration you tap along eight beats. The median of your deviation is stored as a personal correction value and subtracted from every measurement. The value is always visible in the menu and can be re-measured at any time.",
      calibHint: "Bluetooth headphones add 100 to 200 ms of delay. For accurate measurements use the loudspeaker or wired headphones.",
      privacy: "All data stays on the device only. No account, no ads, no transfer."
    },
    common: { zone: "Zone {z}" },
    zones: { one: "Jab left", two: "Cross right", three: "Hook left", four: "Hook right", five: "Uppercut left", six: "Uppercut right" }
  }
};

if (typeof module !== "undefined" && module.exports) { module.exports = { TEXTS }; }