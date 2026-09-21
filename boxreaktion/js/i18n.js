/* BeatBox — alle Textbausteine Deutsch und Englisch. Keine Textfragmente im restlichen Code. */
(function (root, factory) {
  var I18N = factory();
  root.BEATBOX_I18N = I18N;
  if (typeof module !== "undefined" && module.exports) { module.exports = I18N; }
})(typeof self !== "undefined" ? self : this, function () {
  return {
    de: {
      app_title: "BeatBox",
      app_sub: "Boxe mit den Fingern. Schnell. Genau. Im Takt.",
      menu_choose_mode: "Wähle einen Modus",
      level_x: "Level {n}",
      all_unlocked: "Alle 10 Level jedes Modus sind von Anfang an frei wählbar. Es gibt keine Freischaltung und keine Schloss-Symbole.",
      btn_help: "Hilfe",
      btn_history: "Verlauf",
      btn_calibration: "Kalibrierung",
      btn_back: "Zurück",
      btn_menu: "Menü",
      btn_again: "Nochmal",
      best_label: "Bestleistung",
      no_scores_yet: "Noch keine Bestleistung in diesem Modus und Level.",
      mode_reaktion: "Reaktion",
      mode_timing: "Timing",
      mode_kombination: "Kombination",
      mode_ausdauer: "Ausdauer",
      mode_rhythmus: "Rhythmus",
      mode_desc_reaktion: "Eine Zone leuchtet zu einem zufallszeitpunkt auf. Tippe so schnell wie möglich. 20 Schläge, gemessen wird die Reaktionszeit.",
      mode_desc_timing: "Ein Ring zieht sich um die Zone zusammen. Triff genau den Moment, in dem Ring und Zonenrand zusammenfallen.",
      mode_desc_kombination: "Eine Schlagfolge wird vorgegeben und muss in der richtigen Reihenfolge getippt werden. Eine falsche Zone beendet die Serie.",
      mode_desc_ausdauer: "60 Sekunden Dauerfeuer. Das Tempo steigt alle 10 Sekunden. Zählt Schläge pro Minute und Trefferquote.",
      mode_desc_rhythmus: "Schlagfolgen liegen auf den Zählzeiten der Musik. Lerne die Kombination über den Takt.",
      zone_1: "Jab links",
      zone_2: "Cross rechts",
      zone_3: "Haken links",
      zone_4: "Haken rechts",
      zone_5: "Uppercut links",
      zone_6: "Uppercut rechts",
      verdict_perfect: "Perfekt",
      verdict_good: "Gut",
      verdict_ok: "Ok",
      verdict_miss: "Daneben",
      hits_of: "{a} von {b} Treffer",
      series_x: "Serie {n}",
      multiplier_x: "Multiplikator ×{x}",
      result_title: "Ergebnis",
      result_score: "Endpunktzahl",
      result_accuracy: "Trefferquote",
      result_avg_reaction: "Ø Reaktionszeit",
      result_min_reaction: "Beste Reaktion",
      result_max_reaction: "Langsamste Reaktion",
      result_punches: "Schläge gesamt",
      result_ppm: "Schläge pro Minute",
      result_best_streak: "Längste Serie",
      unit_ms: "ms",
      unit_percent: "%",
      game_ready: "Bereit …",
      game_go: "Los!",
      time_left: "{s} s",
      combo_memorize: "Merke dir die Folge …",
      combo_your_turn: "Du bist dran!",
      seq_label: "Folge:",
      distractor_warning: "Achtung: dunkel leuchtende Zonen sind Störziele — nicht treffen!",
      calib_title: "Kalibrierung",
      calib_intro: "Tippe achtmal genau im Takt auf eine beliebige Zone, wenn der Tic-Ton erklingt. Aus den Abweichungen wird dein persönlicher Korrekturwert berechnet und bei jeder Messung abgezogen.",
      calib_hint_bt: "Hinweis: Bluetooth-Kopfhörer erzeugen 100 bis 200 ms zusätzliche Verzögerung. Kabelgebundene Wiedergabe oder der Lautsprecher führt zu genaueren Messungen.",
      calib_start: "Kalibrierung starten",
      calib_tap_now: "Tippe mit!",
      calib_done: "Kalibrierung abgeschlossen.",
      calib_offset: "Korrekturwert: {v} ms",
      calib_none: "Noch nicht kalibriert. Standardwert 0 ms wird verwendet.",
      calib_again: "Neu kalibrieren",
      history_title: "Verlauf",
      history_empty: "Noch keine Einträge im Verlauf.",
      history_info: "Durchschnittliche Reaktionszeit der letzten 30 Tage (alle Modi und Level zusammen):",
      help_title: "Hilfe",
      score_saved: "Ergebnis gespeichert.",
      bpm_label: "{n} BPM",
      help_text:
"# BeatBox — Hilfe\n" +
"\n" +
"## Das Spiel\n" +
"BeatBox trainiert Reaktion, Timing und Koordination. Du boxst mit den Fingern auf sechs Trefferzonen des Bildschirms. Zonen leuchten auf, du tippst sie so schnell und so genau wie möglich. Gemessen werden Reaktionszeit in Millisekunden, Trefferquote und Serienlänge.\n" +
"\n" +
"## Die sechs Zonen (Boxnotation)\n" +
"1 — Jab links — oben links\n" +
"2 — Cross rechts — oben rechts\n" +
"3 — Haken links — Mitte links\n" +
"4 — Haken rechts — Mitte rechts\n" +
"5 — Uppercut links — unten links\n" +
"6 — Uppercut rechts — unten rechts\n" +
"\n" +
"## Die fünf Modi\n" +
"Reaktion: Eine zufällige Zone leuchtet zu einem zufälligen Zeitpunkt auf. Gemessen wird die Zeit vom Aufleuchten bis zur Berührung. Ergebnis: Durchschnitt, bester und schlechtester Wert aus 20 Schlägen. Musik läuft nur als Kulisse.\n" +
"Timing: Um die Zone zieht sich ein schrumpfender Ring zusammen. Getroffen werden muss der Moment, in dem Ring und Zonenrand zusammenfallen. Bewertet wird die Abweichung in Millisekunden, mit Vorzeichen: zu früh oder zu spät.\n" +
"Kombination: Eine Schlagfolge wird vorgegeben und muss in der richtigen Reihenfolge getippt werden. Falsche Zone beendet die Serie.\n" +
"Ausdauer: 60 Sekunden Dauerfeuer, das Tempo steigt alle 10 Sekunden. Ergebnis: Schläge pro Minute und Trefferquote.\n" +
"Rhythmus: Die Schlagfolgen liegen auf den Zählzeiten der Musik. Du lernst die Kombination über den Takt. Kombiniert Timing und Kombination.\n" +
"\n" +
"## Bewertung\n" +
"Pro Schlag ein Urteil nach Abweichung vom Sollzeitpunkt:\n" +
"Perfekt — sehr kleine Abweichung — 100 Punkte\n" +
"Gut — kleine Abweichung — 60 Punkte\n" +
"Ok — noch innerhalb des Trefferfensters des Levels — 25 Punkte\n" +
"Daneben — darüber oder falsche Zone — 0 Punkte, die Serie endet.\n" +
"Das Trefferfenster wird pro Level enger (Level 1: ±130 ms, Level 10: ±70 ms).\n" +
"Trefferquote = getroffene Ziele geteilt durch Gesamtziele, in Prozent.\n" +
"Serienmultiplikator: alle 10 Treffer in Folge steigt er — ×1, ×1,5, ×2, ×3, ×4 als Obergrenze.\n" +
"Endpunktzahl = Summe der Schlagpunkte × erreichter Serienmultiplikator × Levelfaktor.\n" +
"Punkte werden ausschließlich gezählt, niemals abgezogen. Es gibt keine Währung, keinen Einkauf und keine verbrauchbare Ressource.\n" +
"\n" +
"## Level\n" +
"Jeder Modus hat 10 Level. Die Schwierigkeit steigt über Tempo (80 bis 160 BPM), aktive Zonen (2 bis 6), Sequenzlänge (2 bis 6 Schläge), Trefferfenster (±130 bis ±70 ms) und Störziele (keine bis zu 2 gleichzeitig).\n" +
"Alle Level sind von Anfang an frei wählbar und sichtbar. Es gibt keine Freischaltung, keine Fortschrittssperre und keine Schloss-Symbole.\n" +
"\n" +
"## Kalibrierung\n" +
"Der Taktgeber des Spiels ist die Audio-Uhr. Geräte und Kopfhörer verzögern den Klang unterschiedlich. Deshalb gibt es den Kalibrierungsbildschirm: Du tippst achtmal im Takt mit, der Median der Abweichung wird als persönlicher Korrekturwert gespeichert und von jeder Messung abgezogen. Der Wert ist jederzeit neu ermittelbar und im Menü sichtbar.\n" +
"Achtung: Bluetooth-Kopfhörer erzeugen 100 bis 200 ms zusätzliche Verzögerung. Kabelgebundene Wiedergabe oder der Lautsprecher führt zu genaueren Messungen.\n" +
"\n" +
"## Bedienung\n" +
"Im Hochformat spielen. Zonen antippen, nicht drücken und halten. Pro Treffer gibt es ein kurzes Aufblitzen, einen Urteilstext und — falls das Gerät es unterstützt — eine Vibration. Fortschritt wird immer als Verhältnis angezeigt, also „18 von 20 Treffer“, nicht als Zuwachs.\n" +
"\n" +
"## Bestenlisten und Verlauf\n" +
"Bestenlisten werden getrennt pro Modus und Level gespeichert: Name, Punktzahl, Trefferquote, längste Serie, durchschnittliche Reaktionszeit und Datum. Der Verlaufsbildschirm zeigt die Kurve der durchschnittlichen Reaktionszeit der letzten 30 Tage. Es gibt keinen Server, kein Konto und keine Datenübertragung — alles bleibt auf dem Gerät."
    },
    en: {
      app_title: "BeatBox",
      app_sub: "Punch with your fingers. Fast. Precise. In time.",
      menu_choose_mode: "Choose a mode",
      level_x: "Level {n}",
      all_unlocked: "All 10 levels of every mode are selectable from the start. There is no unlocking and no lock symbols.",
      btn_help: "Help",
      btn_history: "History",
      btn_calibration: "Calibration",
      btn_back: "Back",
      btn_menu: "Menu",
      btn_again: "Play again",
      best_label: "Best score",
      no_scores_yet: "No best score yet for this mode and level.",
      mode_reaktion: "Reaction",
      mode_timing: "Timing",
      mode_kombination: "Combination",
      mode_ausdauer: "Endurance",
      mode_rhythmus: "Rhythm",
      mode_desc_reaktion: "One zone lights up at a random moment. Tap it as fast as possible. 20 punches, reaction time is measured.",
      mode_desc_timing: "A ring shrinks around the zone. Hit the exact moment when ring and zone edge coincide.",
      mode_desc_kombination: "A punch sequence is shown and must be tapped in the right order. A wrong zone ends the streak.",
      mode_desc_ausdauer: "60 seconds of rapid fire. The tempo rises every 10 seconds. Counts punches per minute and accuracy.",
      mode_desc_rhythmus: "Punch sequences sit on the beats of the music. Learn the combination by the beat.",
      zone_1: "Jab left",
      zone_2: "Cross right",
      zone_3: "Hook left",
      zone_4: "Hook right",
      zone_5: "Uppercut left",
      zone_6: "Uppercut right",
      verdict_perfect: "Perfect",
      verdict_good: "Good",
      verdict_ok: "Okay",
      verdict_miss: "Miss",
      hits_of: "{a} of {b} hits",
      series_x: "Streak {n}",
      multiplier_x: "Multiplier ×{x}",
      result_title: "Result",
      result_score: "Final score",
      result_accuracy: "Accuracy",
      result_avg_reaction: "Avg. reaction",
      result_min_reaction: "Best reaction",
      result_max_reaction: "Slowest reaction",
      result_punches: "Total punches",
      result_ppm: "Punches per minute",
      result_best_streak: "Longest streak",
      unit_ms: "ms",
      unit_percent: "%",
      game_ready: "Ready …",
      game_go: "Go!",
      time_left: "{s} s",
      combo_memorize: "Memorize the sequence …",
      combo_your_turn: "Your turn!",
      seq_label: "Sequence:",
      distractor_warning: "Careful: dimly lit zones are distractors — do not hit them!",
      calib_title: "Calibration",
      calib_intro: "Tap any zone exactly on the beat eight times when the tick sounds. The median deviation becomes your personal correction value and is subtracted from every measurement.",
      calib_hint_bt: "Note: Bluetooth headphones add 100 to 200 ms of extra delay. Wired playback or the speaker gives more accurate measurements.",
      calib_start: "Start calibration",
      calib_tap_now: "Tap along!",
      calib_done: "Calibration finished.",
      calib_offset: "Correction value: {v} ms",
      calib_none: "Not calibrated yet. Default value 0 ms is used.",
      calib_again: "Calibrate again",
      history_title: "History",
      history_empty: "No history entries yet.",
      history_info: "Average reaction time over the last 30 days (all modes and levels combined):",
      help_title: "Help",
      score_saved: "Result saved.",
      bpm_label: "{n} BPM",
      help_text:
"# BeatBox — Help\n" +
"\n" +
"## The game\n" +
"BeatBox trains reaction, timing and coordination. You punch with your fingers on six target zones on the screen. Zones light up; you tap them as fast and as accurately as possible. Reaction time in milliseconds, accuracy and streak length are measured.\n" +
"\n" +
"## The six zones (boxing notation)\n" +
"1 — Jab left — top left\n" +
"2 — Cross right — top right\n" +
"3 — Hook left — middle left\n" +
"4 — Hook right — middle right\n" +
"5 — Uppercut left — bottom left\n" +
"6 — Uppercut right — bottom right\n" +
"\n" +
"## The five modes\n" +
"Reaction: A random zone lights up at a random moment. The time from lighting up to touch is measured. Result: average, best and worst value over 20 punches. Music is just ambience.\n" +
"Timing: A shrinking ring closes in around the zone. You must hit the exact moment when ring and zone edge coincide. The deviation in milliseconds is rated, with sign: too early or too late.\n" +
"Combination: A punch sequence is shown and must be tapped in the right order. A wrong zone ends the streak.\n" +
"Endurance: 60 seconds of rapid fire, the tempo rises every 10 seconds. Result: punches per minute and accuracy.\n" +
"Rhythm: The punch sequences sit on the beats of the music. You learn the combination by the beat. Combines Timing and Combination.\n" +
"\n" +
"## Rating\n" +
"Each punch gets a verdict by deviation from the target moment:\n" +
"Perfect — very small deviation — 100 points\n" +
"Good — small deviation — 60 points\n" +
"Okay — still inside the level's hit window — 25 points\n" +
"Miss — beyond it or wrong zone — 0 points, the streak ends.\n" +
"The hit window gets tighter per level (level 1: ±130 ms, level 10: ±70 ms).\n" +
"Accuracy = hit targets divided by total targets, in percent.\n" +
"Streak multiplier: every 10 consecutive hits it rises — ×1, ×1.5, ×2, ×3, ×4 as the cap.\n" +
"Final score = sum of punch points × reached streak multiplier × level factor.\n" +
"Points are only ever counted, never subtracted or spent. There is no currency, no purchases and no consumable resource.\n" +
"\n" +
"## Levels\n" +
"Each mode has 10 levels. Difficulty rises via tempo (80 to 160 BPM), active zones (2 to 6), sequence length (2 to 6 punches), hit window (±130 to ±70 ms) and distractors (none up to 2 at once).\n" +
"All levels are selectable and visible from the start. There is no unlocking, no progress gating and no lock symbols.\n" +
"\n" +
"## Calibration\n" +
"The game's clock is the audio clock. Devices and headphones delay sound differently. That is why there is a calibration screen: you tap along on the beat eight times; the median deviation is stored as your personal correction value and subtracted from every measurement. The value can be re-measured at any time and is visible in the menu.\n" +
"Caution: Bluetooth headphones add 100 to 200 ms of extra delay. Wired playback or the speaker gives more accurate measurements.\n" +
"\n" +
"## Controls\n" +
"Play in portrait orientation. Tap zones; do not press and hold. Each hit gives a brief flash, a verdict text and — if the device supports it — a vibration. Progress is always shown as a ratio, e.g. \"18 of 20 hits\", not as a gain.\n" +
"\n" +
"## Best scores and history\n" +
"Best scores are stored separately per mode and level: name, score, accuracy, longest streak, average reaction time and date. The history screen shows the curve of average reaction time over the last 30 days. There is no server, no account and no data transfer — everything stays on the device."
    }
  };
});
