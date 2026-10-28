/**
 * Games played by Gaétan-Gervais, for the pages that show them outside the
 * team pages: the game images (equipes/images-matchs.html) and the home page
 * "Fiertés Griffons" wins.
 *
 * The games come from the same places as the team pages, read only:
 *   - assets/data/sports/*.json (HSSAA data from Nick's browser extension)
 *   - the MATCHS list of pages like the 7e/8e volleyball one
 *
 * GageMatchs.load() gives every played game, newest first.
 */
(function () {
  "use strict";

  // ── Équipes ───────────────────────────────────────────────────────────────
  //   donnees : fichier de l'extension (HSSAA)
  //   page    : page de l'équipe (lien des cartes). Sans donnees, les matchs
  //             sont lus dans la liste MATCHS de cette page.
  // Nouvelle saison : changez l'année dans page. Nouvelle équipe : copiez une ligne.
  var EQUIPES = [
    { cle: "volleyball-garcons-senior", sport: "volleyball", fr: "Garçons senior", en: "Senior boys",    donnees: "/assets/data/sports/volleyball-garcons-senior.json", page: "/equipes/volleyball-garcons-senior-2026-2027.html" },
    { cle: "volleyball-garcons-junior", sport: "volleyball", fr: "Garçons junior", en: "Junior boys",    donnees: "/assets/data/sports/volleyball-garcons-junior.json", page: "/equipes/volleyball-garcons-junior-2026-2027.html" },
    { cle: "volleyball-filles-senior",  sport: "volleyball", fr: "Filles senior",  en: "Senior girls",   donnees: "/assets/data/sports/volleyball-filles-senior.json" },
    { cle: "volleyball-filles-junior",  sport: "volleyball", fr: "Filles junior",  en: "Junior girls",   donnees: "/assets/data/sports/volleyball-filles-junior.json" },
    { cle: "volleyball-garcons-78",     sport: "volleyball", fr: "Garçons 7e/8e",  en: "Grade 7/8 boys", page: "/equipes/volleyball-garcons-78-2026-2027.html" },
    { cle: "basketball-filles-senior",  sport: "basketball", fr: "Filles senior",  en: "Senior girls",   donnees: "/assets/data/sports/basketball-filles-senior.json", page: "/equipes/basketball-filles-senior-2026-2027.html" },
    { cle: "basketball-filles-junior",  sport: "basketball", fr: "Filles junior",  en: "Junior girls",   donnees: "/assets/data/sports/basketball-filles-junior.json" },
    { cle: "basketball-garcons-senior", sport: "basketball", fr: "Garçons senior", en: "Senior boys",    donnees: "/assets/data/sports/basketball-garcons-senior.json" },
    { cle: "basketball-garcons-junior", sport: "basketball", fr: "Garçons junior", en: "Junior boys",    donnees: "/assets/data/sports/basketball-garcons-junior.json" },
    { cle: "soccer-filles-senior",      sport: "soccer",     fr: "Filles senior",  en: "Senior girls",   donnees: "/assets/data/sports/soccer-filles-senior.json" },
    { cle: "soccer-filles-junior",      sport: "soccer",     fr: "Filles junior",  en: "Junior girls",   donnees: "/assets/data/sports/soccer-filles-junior.json" },
    { cle: "soccer-garcons-senior",     sport: "soccer",     fr: "Garçons senior", en: "Senior boys",    donnees: "/assets/data/sports/soccer-garcons-senior.json" },
    { cle: "soccer-garcons-junior",     sport: "soccer",     fr: "Garçons junior", en: "Junior boys",    donnees: "/assets/data/sports/soccer-garcons-junior.json" },
  ];

  var MY_SCHOOL = ["gaétan", "gaetan", "gervais", "gage", "g.g"];
  var SPORTS = {
    volleyball: { fr: "Volleyball", en: "Volleyball", logo: "/assets/img/sportslogos/volleyball.png" },
    basketball: { fr: "Basketball", en: "Basketball", logo: "/assets/img/sportslogos/basketball.png" },
    soccer: { fr: "Soccer", en: "Soccer", logo: "/assets/img/sportslogos/soccer.png" }
  };

  var FR_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var FR_DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function isMySchool(name) {
    var n = (name || "").toLowerCase();
    return MY_SCHOOL.some(function (k) { return n.indexOf(k) >= 0; });
  }

  // "Monday, September 28, 2026" or "Mardi 13 octobre 2026" → Date
  function parseDate(text) {
    var t = (text || "").toLowerCase();
    var m = t.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) {
      var i = EN_MONTHS.map(function (x) { return x.toLowerCase(); }).indexOf(m[1]);
      if (i >= 0) return new Date(+m[3], i, +m[2]);
    }
    m = t.match(/(\d{1,2})(?:er)?\s+([a-zéû]+)\s+(\d{4})/);
    if (m) {
      var j = FR_MONTHS.indexOf(m[2].replace("fevrier", "février").replace("aout", "août").replace("decembre", "décembre"));
      if (j >= 0) return new Date(+m[3], j, +m[1]);
    }
    return null;
  }

  // Full date ("Mercredi 21 octobre 2026"), or short ("21 octobre 2026") with short = true
  function dateText(d, en, short) {
    if (!d) return "";
    if (en && short) return EN_MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    if (!en && short) return (d.getDate() === 1 ? "1er" : d.getDate()) + " " + FR_MONTHS[d.getMonth()] + " " + d.getFullYear();
    if (en) return EN_DAYS[d.getDay()] + ", " + EN_MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    var day = FR_DAYS[d.getDay()];
    return day.charAt(0).toUpperCase() + day.slice(1) + " " + (d.getDate() === 1 ? "1er" : d.getDate()) + " " + FR_MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  // One played game, seen from Gaétan-Gervais' side
  function makeGame(team, date, visitor, home, vScore, hScore, vSets, hSets, place, notes) {
    var weVisit = isMySchool(visitor);
    if (!weVisit && !isMySchool(home)) return null;
    var us = weVisit ? vScore : hScore, them = weVisit ? hScore : vScore;
    var sets = [];
    for (var i = 0; i < Math.min(vSets.length, hSets.length); i++) {
      sets.push(weVisit ? [vSets[i], hSets[i]] : [hSets[i], vSets[i]]);
    }
    return {
      team: team, date: date, opponent: weVisit ? home : visitor, home: !weVisit,
      us: us, them: them, sets: sets, place: place || "", notes: notes || "",
      result: us > them ? "win" : us < them ? "loss" : "tie"
    };
  }

  // HSSAA rows, the way the team pages read them
  function gamesFromHssaa(team, data) {
    var games = [], date = "", rows = (data && data.scores) || [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] || [];
      if (row[0] === "__DATE__") { date = row[1] || ""; continue; }
      if (!row[0] || row[0] === "Visitor" || /^(Location:|Notes:)/.test(row[0]) || row.length < 4) continue;
      var v = String(row[1] || "").match(/^\s*(\d+)\s*(?:\(([^)]*)\))?\s*$/);
      var h = String(row[2] || "").match(/^\s*(\d+)\s*(?:\(([^)]*)\))?\s*$/);
      if (!v || !h) continue; // not played yet (time instead of a score)
      var place = "", notes = "";
      var next = rows[i + 1] || [];
      if (/^Location:/.test(next[0] || "")) place = next[0].replace(/^Location:\s*/, "");
      if (/^Notes:/.test(next[1] || "")) notes = next[1].replace(/^Notes:\s*/, "").replace(/\s+/g, " ").trim();
      var sets = function (s) { return s ? s.split(",").map(function (x) { return parseInt(x, 10); }).filter(function (x) { return !isNaN(x); }) : []; };
      var g = makeGame(team, parseDate(date), row[0], row[3], +v[1], +h[1], sets(v[2]), sets(h[2]), place, notes);
      if (g) games.push(g);
    }
    return games;
  }

  // MATCHS list typed in a team page: { date, visiteur, domicile, manches: "25-19; 13-25" }
  function gamesFromPage(team, html) {
    var block = html.match(/var MATCHS\s*=\s*\[([\s\S]*?)\n\s*\];/);
    if (!block) return [];
    var games = [];
    (block[1].match(/\{[^{}]*\}/g) || []).forEach(function (item) {
      var f = {};
      item.replace(/(\w+)\s*:\s*"([^"]*)"/g, function (_, k, val) { f[k] = val; });
      if (!f.manches || !f.visiteur || !f.domicile) return;
      var vSets = [], hSets = [], vWon = 0, hWon = 0;
      f.manches.split(/[;,]/).forEach(function (s) {
        var m = s.match(/(\d+)\s*-\s*(\d+)/);
        if (!m) return;
        vSets.push(+m[1]); hSets.push(+m[2]);
        if (+m[1] > +m[2]) vWon++; else if (+m[2] > +m[1]) hWon++;
      });
      if (!vSets.length) return;
      var g = makeGame(team, parseDate(f.date), f.visiteur, f.domicile, vWon, hWon, vSets, hSets, f.domicile, f.notes);
      if (g) games.push(g);
    });
    return games;
  }

  function loadTeam(team) {
    var url = team.donnees || team.page;
    return fetch(url, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return team.donnees ? r.json() : r.text(); })
      .then(function (d) { return team.donnees ? gamesFromHssaa(team, d) : gamesFromPage(team, d); })
      .catch(function () { return []; });
  }

  function load() {
    return Promise.all(EQUIPES.map(loadTeam)).then(function (lists) {
      var all = [].concat.apply([], lists);
      all.sort(function (a, b) { return (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0); });
      return all;
    });
  }

  window.GageMatchs = {
    EQUIPES: EQUIPES, SPORTS: SPORTS, load: load, dateText: dateText, isMySchool: isMySchool,
    // Used by the Palmarès page (assets/js/palmares.js) to read past seasons too
    parseDate: parseDate, gamesFromHssaa: gamesFromHssaa, gamesFromPage: gamesFromPage
  };
})();
