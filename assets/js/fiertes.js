/**
 * Home page "Fiertés Griffons": adds the latest wins, read from the scores
 * (assets/js/matchs.js), after the cards typed in index.html / en/index.html.
 * Typed cards (tournaments, etc.) always stay first. Wins older than
 * RECENT_DAYS are left out, so the section doesn't show last season's games.
 * The whole row fades in at once (data-aos on #fiertes-cartes), so typed and
 * added cards appear together.
 */
(function () {
  "use strict";

  var RECENT_DAYS = 45;
  var EN = document.documentElement.lang === "en";
  var row = document.getElementById("fiertes-cartes");
  if (!row || !window.GageMatchs) return;
  var M = window.GageMatchs;

  M.load().then(function (games) {
    var since = Date.now() - RECENT_DAYS * 86400000;
    var wins = games.filter(function (g) { return g.result === "win" && g.date && g.date.getTime() >= since; });
    // Fill the rows of three: 2 typed cards + 4 wins = 6, 3 typed + 3 wins = 6, etc.
    var typed = row.children.length;
    var count = Math.max(3, Math.ceil((typed + 3) / 3) * 3 - typed);

    wins.slice(0, count).forEach(function (g) {
      var sport = M.SPORTS[g.team.sport];
      var href = g.team.page ? g.team.page + (EN ? "?lang=en" : "") : (EN ? "/en/athletisme.html" : "/athletisme.html");
      var col = document.createElement("div");
      col.className = "col-lg-4 col-md-6";
      col.innerHTML =
        '<a class="fierte-card fierte-victoire">' +
          '<span class="fierte-trophy"><i class="bi bi-star-fill"></i></span>' +
          '<span class="fierte-body">' +
            '<span class="fierte-sport"></span>' +
            '<strong class="fierte-title"></strong>' +
            '<span class="fierte-date"></span>' +
          "</span>" +
        "</a>";
      var a = col.firstChild;
      a.href = href;
      a.querySelector(".fierte-sport").textContent = (EN ? g.team.en + " " + sport.en.toLowerCase() : sport.fr + " " + g.team.fr.toLowerCase());
      a.querySelector(".fierte-title").textContent = (EN ? "Won " : "Victoire ") + g.us + "-" + g.them + (EN ? " against " : " contre ") + g.opponent;
      a.querySelector(".fierte-date").textContent = M.dateText(g.date, EN, true);
      row.appendChild(col);
    });
    // The section got taller: let the scroll animations below recompute where they start
    if (window.AOS) window.AOS.refresh();
  });
})();
