/**
 * Palmarès des Griffons (palmares.html and en/palmares.html).
 *
 * Most of the page builds itself, read only, from the same data as the team pages:
 *   - season records, standings and playoff games: assets/data/sports/*.json
 *     (Nick's browser extension) and the MATCHS lists of pages like the 7e/8e one
 *   - playoff finals and semi-finals become "exploits" on their own
 *   - individual medals: the 1st, 2nd and 3rd places on the cross-country pages
 *
 * Only the tournaments are typed by hand, in EXPLOITS below.
 * Both pages (French and English) read this file: type each exploit once.
 */
(function () {
  "use strict";

  var EN = document.documentElement.lang === "en";
  var M = window.GageMatchs;
  function tr(fr, en) { return EN ? en : fr; }

  // ── Exploits typés à la main (tournois, championnats d'avant 2025-2026...) ──
  // Copiez une ligne et placez-la en premier. Champs :
  //   saison   : "2026-2027"
  //   date     : "2026-10-23" (sert à trier ; affichée en français et en anglais)
  //   dates_fr / dates_en : facultatif, pour un tournoi sur plusieurs jours
  //   cle      : l'équipe, comme dans EQUIPES de assets/js/matchs.js (ou SAISONS plus bas)
  //   titre_fr / titre_en : nom du tournoi
  //   resultat_fr / resultat_en : ce que l'équipe a gagné
  //   niveau   : "or" (champions), "argent" (finalistes), "bronze" (3e place)
  //
  // Un titre d'une saison passée sans page d'équipe ? Mettez sport_fr/sport_en à la place de cle, par exemple :
  //   { saison: "2018-2019", date: "2019-03-01", sport_fr: "Basketball garçons senior", sport_en: "Senior boys basketball",
  //     titre_fr: "Championnat HSSAA", titre_en: "HSSAA championship", resultat_fr: "Champions", resultat_en: "Champions", niveau: "or" },
  var EXPLOITS = [
    { saison: "2026-2027", date: "2026-10-31", cle: "basketball-garcons-senior",
      titre_fr: "Tournoi de basketball ESCSFA", titre_en: "ESCSFA basketball tournament",
      resultat_fr: "Champions", resultat_en: "Champions", niveau: "or" },
    { saison: "2026-2027", date: "2026-10-23", cle: "volleyball-garcons-senior",
      titre_fr: "Canes Cup", titre_en: "Canes Cup",
      resultat_fr: "Finalistes (2e place)", resultat_en: "Finalists (2nd place)", niveau: "argent" },
    { saison: "2026-2027", date: "2026-09-30", dates_fr: "30 septembre au 1er octobre 2026", dates_en: "September 30 to October 1, 2026",
      cle: "volleyball-garcons-senior",
      titre_fr: "Tournoi provincial Franco", titre_en: "Franco provincial tournament",
      resultat_fr: "Champions de la consolation AA", resultat_en: "AA consolation champions", niveau: "or" },
  ];

  // ── Saisons ───────────────────────────────────────────────────────────────
  // La saison en cours prend les équipes de assets/js/matchs.js.
  // En fin de saison, quand les pages vont aux archives : ajoutez la saison ici
  // avec ses fichiers d'archive (comme 2025-2026).
  var SAISONS = [
    { saison: "2026-2027", enCours: true, equipes: M.EQUIPES },
    { saison: "2025-2026", equipes: [
      { cle: "volleyball-garcons-senior", sport: "volleyball", fr: "Garçons senior", en: "Senior boys",
        donnees: "/assets/data/sports/archive/2025-2026/volleyball-garcons-senior-2025-2026.json",
        page: "/equipes/archive/2025-2026/volleyball-garcons-senior-2025-2026.html" },
      { cle: "basketball-garcons-senior", sport: "basketball", fr: "Garçons senior", en: "Senior boys",
        donnees: "/assets/data/sports/archive/2025-2026/basketball-garcons-senior-2025-2026.json",
        page: "/equipes/archive/2025-2026/basketball-garcons-senior-2025-2026.html" }
    ] }
  ];
  var PREMIERE_SAISON = "2025-2026"; // avant celle-ci : la carte « à venir » s'affiche

  // Cross-country pages: 1st to 3rd places become medals
  var COURSES = [
    { saison: "2026-2027", page: "/equipes/coursdefond-2026-2027.html", fr: "Course de fond secondaire", en: "High school cross-country" },
    { saison: "2026-2027", page: "/equipes/coursdefond-78-2026-2027.html", fr: "Course de fond 7e/8e", en: "Grade 7/8 cross-country" }
  ];

  var NIVEAUX = {
    or: { icon: "bi-trophy-fill", fr: "Champions", en: "Champions" },
    argent: { icon: "bi-award-fill", fr: "Finalistes", en: "Finalists" },
    bronze: { icon: "bi-award", fr: "Podium", en: "Podium" }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function link(page) { return page ? page + (EN ? "?lang=en" : "") : ""; }
  function ordinal(n) {
    if (!EN) return n + (n === 1 ? "<sup>er</sup>" : "<sup>e</sup>");
    var s = (n % 100 >= 11 && n % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" })[n % 10] || "th";
    return n + "<sup>" + s + "</sup>";
  }
  function teamName(team) {
    var sport = M.SPORTS[team.sport] || { fr: team.sport, en: team.sport };
    return EN ? team.en + " " + sport.en.toLowerCase() : sport.fr + " " + team.fr.toLowerCase();
  }
  function seasonLabel(s) { return s.replace("-", "–"); }
  function isoDate(text) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function percent(w, gp) { return gp ? Math.round((w / gp) * 1000) / 10 : 0; }

  // "Quarter Final.", "GHAC. A Semi Final", "Playoff Final. Tier 2" → readable stage
  function stage(notes) {
    var n = notes.replace(/\.(\s|$)/g, " ").trim();
    var league = /GHAC/i.test(n) ? "GHAC" : "HSSAA";
    var level = (n.match(/Tier \d+/) || [])[0] || (n.match(/GHAC\s+(A{1,3})\b/) || [])[1] || "";
    var kind, fr, en;
    if (/quarter/i.test(n)) { kind = "quart"; fr = "Quart de finale"; en = "Quarter-final"; }
    else if (/semi/i.test(n)) { kind = "demi"; fr = "Demi-finale"; en = "Semi-final"; }
    else if (/final|championship/i.test(n)) { kind = "finale"; fr = "Finale"; en = "Final"; }
    else if (/challenge/i.test(n)) { kind = "barrage"; fr = "Match de barrage"; en = "Challenge game"; }
    else { kind = "autre"; fr = "Séries"; en = "Playoffs"; }
    var where = league + (level ? " " + level : "");
    return { kind: kind, text: tr(fr, en) + " " + where, where: where };
  }
  function isPlayoff(g) { return g.notes && !/regular season/i.test(g.notes); }

  // Gaétan-Gervais' line in the standings: group, rank, record
  function standingFor(data) {
    var tiers = (data && data.standings) || [];
    for (var t = 0; t < tiers.length; t++) {
      var rows = tiers[t].rows || [], head = null, group = [];
      var groups = [];
      rows.forEach(function (row) {
        if (row[1] === "School") { if (group.length) groups.push({ head: head, rows: group }); head = row; group = []; }
        else if (head) group.push(row);
      });
      if (group.length) groups.push({ head: head, rows: group });
      for (var g = 0; g < groups.length; g++) {
        var gr = groups[g];
        for (var r = 0; r < gr.rows.length; r++) {
          if (!M.isMySchool(gr.rows[r][1])) continue;
          var col = function (names) {
            for (var k = 0; k < names.length; k++) { var i = gr.head.indexOf(names[k]); if (i >= 0) return +gr.rows[r][i] || 0; }
            return 0;
          };
          // The table's name (e.g. "Tier 1") only describes its first group of schools
          var label = g === 0 ? ((tiers[t].headers || [])[0] || "").trim() : "";
          return { rank: r + 1, of: gr.rows.length, group: label === "Classement" ? "" : label,
                   gp: col(["GP", "MP"]), w: col(["W"]), l: col(["L"]), t: col(["T"]) };
        }
      }
    }
    return null;
  }

  function fetchTeam(team) {
    var url = team.donnees || team.page;
    if (!url) return Promise.resolve(null);
    return fetch(url, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return team.donnees ? r.json() : r.text(); })
      .then(function (d) {
        var games = team.donnees ? M.gamesFromHssaa(team, d) : M.gamesFromPage(team, d);
        return { games: games, standing: team.donnees ? standingFor(d) : null };
      })
      .catch(function () { return null; });
  }

  // One team's season: record, standing, playoff run
  function seasonOf(season, team, got) {
    if (!got || !got.games.length) return null;
    var regular = got.games.filter(function (g) { return !isPlayoff(g); });
    var playoffs = got.games.filter(isPlayoff); // oldest first, like the data
    var st = got.standing;
    var w = st ? st.w : regular.filter(function (g) { return g.result === "win"; }).length;
    var l = st ? st.l : regular.filter(function (g) { return g.result === "loss"; }).length;
    var t = st ? st.t : regular.filter(function (g) { return g.result === "tie"; }).length;
    var gp = st && st.gp ? st.gp : w + l + t;
    return { saison: season.saison, enCours: !!season.enCours, team: team, w: w, l: l, t: t, gp: gp,
             pct: percent(w, gp), standing: st, playoffs: playoffs };
  }

  // First place of a finished season, finals and semi-finals from the playoff games
  function autoExploits(s) {
    var list = [];
    if (!s.enCours && s.standing && s.standing.rank === 1 && s.standing.of > 1) {
      list.push({ saison: s.saison, team: s.team, auto: true, niveau: "or",
        titre: tr("Saison régulière", "Regular season") + (s.standing.group ? " " + s.standing.group : ""),
        resultat: tr("1re place au classement", "1st place in the standings"),
        detail: tr("fiche de ", "record of ") + recordText(s) });
    }
    s.playoffs.forEach(function (g) {
      var st = stage(g.notes);
      var score = g.us + "-" + g.them;
      if (st.kind === "finale") {
        list.push({ saison: s.saison, when: g.date, team: s.team, auto: true,
          niveau: g.result === "win" ? "or" : "argent",
          titre: tr("Finale ", "Final ") + st.where,
          resultat: g.result === "win" ? tr("Champions", "Champions") : tr("Finalistes", "Finalists"),
          detail: tr("contre ", "vs ") + g.opponent + " (" + score + ")" });
      } else if (st.kind === "demi" && g.result === "loss") {
        list.push({ saison: s.saison, when: g.date, team: s.team, auto: true, niveau: "bronze",
          titre: tr("Séries ", "Playoffs ") + st.where,
          resultat: tr("Demi-finalistes", "Semi-finalists"),
          detail: tr("contre ", "vs ") + g.opponent + " (" + score + ")" });
      }
    });
    return list;
  }

  // ── Cross-country medals ──────────────────────────────────────────────────
  function loadMedals() {
    return Promise.all(COURSES.map(function (c) {
      return fetch(c.page, { cache: "no-cache" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html"), out = [];
          doc.querySelectorAll(".cdf-card").forEach(function (card) {
            var h = card.querySelector("h3");
            var race = h ? (EN && h.getAttribute("data-en") ? h.getAttribute("data-en") : h.innerHTML) : "";
            card.querySelectorAll("tbody tr").forEach(function (tr) {
              var placeEl = tr.querySelector(".cdf-place");
              var place = placeEl ? parseInt(placeEl.textContent, 10) : NaN;
              if (place >= 1 && place <= 3) {
                out.push({ course: c, race: race, place: place, name: tr.cells[0].textContent.trim() });
              }
            });
          });
          return out;
        })
        .catch(function () { return []; });
    })).then(function (lists) { return [].concat.apply([], lists); });
  }

  // ── Rendering ─────────────────────────────────────────────────────────────
  function sportLogo(team, cls) {
    var sp = M.SPORTS[team.sport];
    return sp ? '<img class="' + cls + '" src="' + sp.logo + '" alt="" width="40" height="40" loading="lazy">' : "";
  }

  function exploitCard(e) {
    var niv = NIVEAUX[e.niveau] || NIVEAUX.or;
    var who = e.team ? teamName(e.team) : tr(e.sport_fr, e.sport_en);
    var when = e.dates || (e.when ? M.dateText(e.when, EN, true) : "");
    var page = e.team && e.team.page ? link(e.team.page) : "";
    var tag = page ? "a" : "div";
    return '<li class="col-lg-6"><' + tag + ' class="palm-exploit niveau-' + esc(e.niveau || "or") + '"' + (page ? ' href="' + esc(page) + '"' : "") + '>' +
      '<span class="palm-medal" aria-hidden="true"><i class="bi ' + niv.icon + '"></i></span>' +
      '<span class="palm-exploit-body">' +
        '<span class="palm-exploit-team">' + esc(who) + '</span>' +
        '<strong class="palm-exploit-title">' + esc(e.resultat) + '</strong>' +
        '<span class="palm-exploit-event">' + esc(e.titre) + (e.detail ? ' · ' + esc(e.detail) : "") + '</span>' +
        (when ? '<span class="palm-exploit-date"><i class="bi bi-calendar-event me-1" aria-hidden="true"></i>' + esc(when) + '</span>' : "") +
      '</span></' + tag + '></li>';
  }

  function renderExploits(seasons, el) {
    var typed = EXPLOITS.map(function (x) {
      var team = null;
      SAISONS.forEach(function (s) {
        if (s.saison !== x.saison) return;
        s.equipes.forEach(function (t) { if (t.cle === x.cle) team = t; });
      });
      if (!team && x.cle) M.EQUIPES.forEach(function (t) { if (t.cle === x.cle) team = t; });
      return { saison: x.saison, when: isoDate(x.date), dates: tr(x.dates_fr, x.dates_en), team: team,
               sport_fr: x.sport_fr, sport_en: x.sport_en, niveau: x.niveau,
               titre: tr(x.titre_fr, x.titre_en), resultat: tr(x.resultat_fr, x.resultat_en) };
    });
    var all = typed;
    seasons.forEach(function (s) { all = all.concat(autoExploits(s)); });

    var bySeason = {};
    all.forEach(function (e) { (bySeason[e.saison] = bySeason[e.saison] || []).push(e); });
    var keys = Object.keys(bySeason).sort().reverse();
    var html = "";
    keys.forEach(function (k) {
      var rank = { or: 0, argent: 1, bronze: 2 };
      bySeason[k].sort(function (a, b) {
        var ta = a.when ? a.when.getTime() : 0, tb = b.when ? b.when.getTime() : 0;
        return (tb - ta) || ((rank[a.niveau] || 0) - (rank[b.niveau] || 0));
      });
      var current = SAISONS.some(function (s) { return s.saison === k && s.enCours; });
      html += '<h3 class="palm-season">' + tr("Saison ", "") + seasonLabel(k) + (EN ? " season" : "") +
        (current ? ' <span class="palm-live">' + tr("en cours", "in progress") + '</span>' : "") + '</h3>' +
        '<ul class="row g-3 palm-exploits">' + bySeason[k].map(exploitCard).join("") + '</ul>';
    });
    if (!keys.some(function (k) { return k < PREMIERE_SAISON; })) {
      html += '<div class="palm-todo"><i class="bi bi-hourglass-split" aria-hidden="true"></i><div>' +
        '<h3>' + tr("Avant 2025–2026", "Before 2025–2026") + '</h3>' +
        '<p>' + tr("Les titres et bannières des saisons précédentes seront ajoutés ici au fil du temps.",
                   "Titles and banners from earlier seasons will be added here over time.") + '</p></div></div>';
    }
    el.innerHTML = html;
    return all.length;
  }

  function rankText(st) {
    if (!st) return "";
    return ordinal(st.rank) + tr(" sur ", " of ") + st.of + (st.group ? " · " + esc(st.group) : "");
  }
  function recordText(s) { return s.w + "-" + s.l + (s.t ? "-" + s.t : ""); }

  function playoffText(s) {
    if (!s.playoffs.length) return "";
    return s.playoffs.map(function (g) {
      var st = stage(g.notes);
      var res = g.result === "win" ? tr("V", "W") : g.result === "loss" ? tr("D", "L") : tr("N", "T");
      return '<span class="palm-po palm-po-' + g.result + '">' + esc(st.text) + " : " + res + " " + g.us + "-" + g.them + '</span>';
    }).join(" ");
  }

  function renderBest(seasons, el) {
    var best = seasons.filter(function (s) { return s.gp >= 4 && s.w > 0; })
      .sort(function (a, b) { return (b.pct - a.pct) || (b.w - a.w); }).slice(0, 3);
    if (!best.length) { el.innerHTML = '<p class="palm-empty">' + tr("Aucune saison complète pour l'instant.", "No full season yet.") + '</p>'; return null; }
    el.innerHTML = best.map(function (s, i) {
      var page = link(s.team.page);
      return '<li class="col-md-4"><' + (page ? 'a href="' + esc(page) + '"' : "div") + ' class="palm-best">' +
        '<span class="palm-best-rank" aria-hidden="true">' + (i + 1) + '</span>' +
        sportLogo(s.team, "palm-best-logo") +
        '<span class="palm-best-team">' + esc(teamName(s.team)) + '</span>' +
        '<span class="palm-best-season">' + seasonLabel(s.saison) + (s.enCours ? " · " + tr("en cours", "in progress") : "") + '</span>' +
        '<strong class="palm-best-record">' + recordText(s) + '</strong>' +
        '<span class="palm-best-pct">' + s.pct.toLocaleString(EN ? "en-CA" : "fr-CA") + tr(" % de victoires", "% wins") + '</span>' +
        (s.standing ? '<span class="palm-best-standing">' + rankText(s.standing) + '</span>' : "") +
        '</' + (page ? "a" : "div") + '></li>';
    }).join("");
    return best[0];
  }

  function renderTable(seasons, el) {
    var rows = seasons.slice().sort(function (a, b) {
      return (b.saison > a.saison ? 1 : b.saison < a.saison ? -1 : 0) || (b.pct - a.pct);
    });
    el.innerHTML = rows.map(function (s) {
      var page = link(s.team.page);
      var name = esc(teamName(s.team));
      return '<tr>' +
        '<td>' + seasonLabel(s.saison) + (s.enCours ? ' <span class="palm-live">' + tr("en cours", "in progress") + '</span>' : "") + '</td>' +
        '<th scope="row">' + (page ? '<a href="' + esc(page) + '">' + name + '</a>' : name) + '</th>' +
        '<td class="num">' + s.gp + '</td><td class="num">' + s.w + '</td><td class="num">' + s.l + '</td>' +
        '<td class="num">' + s.pct.toLocaleString(EN ? "en-CA" : "fr-CA") + '</td>' +
        '<td>' + (s.standing ? rankText(s.standing) : '<span class="palm-muted">—</span>') + '</td>' +
        '<td>' + (playoffText(s) || '<span class="palm-muted">—</span>') + '</td>' +
        '</tr>';
    }).join("");
  }

  function renderMedals(medals, el) {
    if (!medals.length) {
      el.innerHTML = '<p class="palm-empty">' + tr("Aucune médaille individuelle pour l'instant.", "No individual medals yet.") + '</p>';
      return;
    }
    var cls = { 1: ["gold", tr("Médaille d'or", "Gold medal")], 2: ["silver", tr("Médaille d'argent", "Silver medal")], 3: ["bronze", tr("Médaille de bronze", "Bronze medal")] };
    medals.sort(function (a, b) { return a.place - b.place; });
    el.innerHTML = medals.map(function (m) {
      var c = cls[m.place];
      return '<li class="col-md-6 col-lg-4"><a class="palm-indiv" href="' + esc(link(m.course.page)) + '">' +
        '<span class="palm-indiv-medal ' + c[0] + '" role="img" aria-label="' + c[1] + '"><i class="bi bi-award-fill" aria-hidden="true"></i></span>' +
        '<span class="palm-indiv-body"><strong>' + esc(m.name) + '</strong>' +
        '<span>' + ordinal(m.place) + " " + tr("place", "place") + ' · ' + m.race + '</span>' +
        '<span class="palm-muted">' + esc(tr(m.course.fr, m.course.en)) + ' · ' + seasonLabel(m.course.saison) + '</span></span>' +
        '</a></li>';
    }).join("");
  }

  function renderStats(seasons, nbExploits, best, nbMedals) {
    var wins = seasons.reduce(function (n, s) { return n + s.w + s.playoffs.filter(function (g) { return g.result === "win"; }).length; }, 0);
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.innerHTML = v; };
    set("palm-stat-exploits", nbExploits);
    set("palm-stat-wins", wins);
    set("palm-stat-best", best ? recordText(best) : "—");
    set("palm-stat-best-label", best ? esc(teamName(best.team)) + " · " + seasonLabel(best.saison) : "");
    set("palm-stat-medals", nbMedals);
  }

  function init() {
    var jobs = [];
    SAISONS.forEach(function (season) {
      season.equipes.forEach(function (team) {
        jobs.push(fetchTeam(team).then(function (got) { return seasonOf(season, team, got); }));
      });
    });
    Promise.all([Promise.all(jobs), loadMedals()]).then(function (res) {
      var seasons = res[0].filter(Boolean), medals = res[1];
      var nb = renderExploits(seasons, document.getElementById("palm-exploits"));
      var best = renderBest(seasons, document.getElementById("palm-best"));
      renderTable(seasons, document.getElementById("palm-table-body"));
      renderMedals(medals, document.getElementById("palm-medals"));
      renderStats(seasons, nb, best, medals.length);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
