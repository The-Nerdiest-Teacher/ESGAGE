/**
 * Images des matchs (equipes/images-matchs.html)
 *
 * Turns every game Gaétan-Gervais has played into an image ready to post
 * (Instagram post 1080×1350 or story 1080×1920), in French or, with ?lang=en,
 * in English. Nothing is saved on the site: the image is drawn in the browser.
 *
 * The games come from the same places as the team pages, read only:
 *   - assets/data/sports/*.json (HSSAA data from Nick's browser extension)
 *   - the MATCHS list of pages like the 7e/8e volleyball one
 * The list of teams is EQUIPES, at the bottom of images-matchs.html.
 */
(function () {
  "use strict";

  var EN = !!window.GAGE_EN;
  var MY_SCHOOL = ["gaétan", "gaetan", "gervais", "gage", "g.g"];
  var GREEN = "#1f6b3a", DARK = "#0f3a20", GOLD = "#f9a825";
  var FORMATS = { post: [1080, 1350], story: [1080, 1920] };

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

  function dateText(d) {
    if (!d) return "";
    if (EN) return EN_DAYS[d.getDay()] + ", " + EN_MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    var day = FR_DAYS[d.getDay()];
    return day.charAt(0).toUpperCase() + day.slice(1) + " " + (d.getDate() === 1 ? "1er" : d.getDate()) + " " + FR_MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  // One played game, seen from Gaétan-Gervais' side
  function makeGame(team, date, visitor, home, vScore, hScore, vSets, hSets, place) {
    var weVisit = isMySchool(visitor);
    if (!weVisit && !isMySchool(home)) return null;
    var us = weVisit ? vScore : hScore, them = weVisit ? hScore : vScore;
    var sets = [];
    for (var i = 0; i < Math.min(vSets.length, hSets.length); i++) {
      sets.push(weVisit ? [vSets[i], hSets[i]] : [hSets[i], vSets[i]]);
    }
    return {
      team: team, date: date, opponent: weVisit ? home : visitor, home: !weVisit,
      us: us, them: them, sets: sets, place: place || "",
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
      var place = "";
      var next = rows[i + 1] || [];
      if (/^Location:/.test(next[0] || "")) place = next[0].replace(/^Location:\s*/, "");
      var sets = function (s) { return s ? s.split(",").map(function (x) { return parseInt(x, 10); }).filter(function (x) { return !isNaN(x); }) : []; };
      var g = makeGame(team, parseDate(date), row[0], row[3], +v[1], +h[1], sets(v[2]), sets(h[2]), place);
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
      var g = makeGame(team, parseDate(f.date), f.visiteur, f.domicile, vWon, hWon, vSets, hSets, f.domicile);
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

  // ── Drawing ─────────────────────────────────────────────────────────────

  var images = {};
  function loadImage(src) {
    if (!images[src]) {
      images[src] = new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { resolve(null); };
        img.src = src;
      });
    }
    return images[src];
  }

  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load("100px 'Bebas Neue'"),
      document.fonts.load("700 40px Rajdhani"),
      document.fonts.load("600 40px Rajdhani"),
      document.fonts.load("700 40px 'Open Sans'")
    ]).catch(function () {});
  }

  // Shrinks the font until the text fits in maxWidth
  function fitText(ctx, text, maxWidth, size, font) {
    do { ctx.font = font.replace("SIZE", size + "px"); size -= 2; }
    while (ctx.measureText(text).width > maxWidth && size > 12);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function initials(name) {
    var words = name.replace(/\(.*?\)/g, "").split(/[\s.\-]+/).filter(function (w) {
      return w && !/^(h|s|d|c|hs|ss|dhs|cs|es|high|school|secondary|collegiate|college|catholic|the)$/i.test(w);
    });
    return words.slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join("") || "?";
  }

  function draw(canvas, game, format) {
    var size = FORMATS[format] || FORMATS.post;
    var W = size[0], H = size[1];
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    var sport = SPORTS[game.team.sport] || SPORTS.volleyball;
    var win = game.result === "win";

    return Promise.all([loadImage("/assets/img/gage-logo.png"), loadImage(sport.logo), fontsReady()]).then(function (imgs) {
      var logo = imgs[0], sportLogo = imgs[1];

      // Background: school green with a diagonal gold stripe
      var bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#1f6b3a");
      bg.addColorStop(1, DARK);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = "#ffffff";
      for (var s = -H; s < W; s += 90) {
        ctx.beginPath();
        ctx.moveTo(s, H); ctx.lineTo(s + 40, H); ctx.lineTo(s + 40 + H * 0.6, 0); ctx.lineTo(s + H * 0.6, 0);
        ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = GOLD;
      ctx.fillRect(0, 0, W, 14);
      ctx.fillRect(0, H - 14, W, 14);

      // Story format: everything is centred in the taller image
      var top = format === "story" ? 360 : 60;

      // Eagle
      if (logo) {
        var lw = 440, lh = lw * logo.height / logo.width;
        ctx.drawImage(logo, (W - lw) / 2, top, lw, lh);
      }
      var y = top + 255;

      // Sport and team
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "700 40px Rajdhani";
      var teamName = (EN ? sport.en + " · " + game.team.en : sport.fr + " · " + game.team.fr).toUpperCase();
      fitText(ctx, teamName, W - 160, 40, "700 SIZE Rajdhani");
      ctx.fillText(teamName, W / 2, y + 40);

      // Headline
      var headline = win ? tr("VICTOIRE !", "VICTORY!") : game.result === "tie" ? tr("MATCH NUL", "TIE GAME") : tr("RÉSULTAT FINAL", "FINAL SCORE");
      ctx.fillStyle = win ? GOLD : "#ffffff";
      fitText(ctx, headline, W - 120, win ? 190 : 150, "SIZE 'Bebas Neue'");
      ctx.fillText(headline, W / 2, y + (win ? 215 : 200));
      y += 255;

      // Score card: our row, then the opponent's
      var cardX = 70, cardW = W - 140, rowH = 155;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
      roundRect(ctx, cardX, y, cardW, rowH * 2, 28);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
      ctx.save();
      roundRect(ctx, cardX, y, cardW, rowH * 2, 28);
      ctx.clip();
      ctx.fillStyle = win ? GOLD : "#cfd8d3";
      ctx.fillRect(cardX, y, 16, rowH);
      ctx.restore();
      ctx.strokeStyle = "#e3e8e5"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cardX + 30, y + rowH); ctx.lineTo(cardX + cardW - 30, y + rowH); ctx.stroke();

      var rows = [
        { name: "Gaétan-Gervais", sub: "Griffons", score: game.us, won: game.us > game.them, ours: true },
        { name: game.opponent, sub: "", score: game.them, won: game.them > game.us, ours: false }
      ];
      rows.forEach(function (r, i) {
        var ry = y + i * rowH, cy = ry + rowH / 2;
        // Badge: eagle for us, initials for them
        ctx.beginPath(); ctx.arc(cardX + 105, cy, 56, 0, Math.PI * 2);
        ctx.fillStyle = r.ours ? GREEN : "#e9eeeb"; ctx.fill();
        if (r.ours && logo) {
          var bw = 100, bh = bw * logo.height / logo.width;
          ctx.drawImage(logo, cardX + 105 - bw / 2, cy - bh / 2, bw, bh);
        } else {
          ctx.fillStyle = "#5c636a"; ctx.textAlign = "center";
          ctx.font = "700 40px Rajdhani";
          ctx.fillText(initials(r.name), cardX + 105, cy + 14);
        }
        // Name
        ctx.textAlign = "left";
        ctx.fillStyle = r.ours ? "#134527" : "#2b2f33";
        fitText(ctx, r.name.toUpperCase(), cardW - 400, 56, (r.won ? "700" : "600") + " SIZE Rajdhani");
        ctx.fillText(r.name.toUpperCase(), cardX + 190, cy + (r.sub ? 4 : 18));
        if (r.sub) {
          ctx.fillStyle = "#6b7570"; ctx.font = "600 30px Rajdhani";
          ctx.fillText(r.sub.toUpperCase(), cardX + 190, cy + 44);
        }
        // Score
        ctx.textAlign = "right";
        ctx.fillStyle = r.won ? (r.ours ? GREEN : "#2b2f33") : "#9aa3a0";
        ctx.font = "120px 'Bebas Neue'";
        ctx.fillText(String(r.score), cardX + cardW - 50, cy + 44);
      });
      y += rowH * 2 + 60;

      // Set scores (volleyball), from our side
      if (game.sets.length) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "700 30px Rajdhani";
        ctx.fillText(tr("MANCHES", "SETS"), W / 2, y);
        y += 30;
        var n = game.sets.length, chipW = 170, gap = 22;
        var startX = (W - (n * chipW + (n - 1) * gap)) / 2;
        game.sets.forEach(function (set, i) {
          var x = startX + i * (chipW + gap), won = set[0] > set[1];
          roundRect(ctx, x, y, chipW, 76, 38);
          ctx.fillStyle = won ? GOLD : "rgba(255,255,255,0.14)"; ctx.fill();
          ctx.fillStyle = won ? "#134527" : "#ffffff";
          ctx.font = "700 42px Rajdhani";
          ctx.fillText(set[0] + "-" + set[1], x + chipW / 2, y + 52);
        });
        y += 76 + 62;
      } else {
        y += 20;
      }

      // Date and place
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 38px 'Open Sans'";
      ctx.fillText(dateText(game.date), W / 2, y);
      var where = game.home ? tr("À domicile", "Home game") : tr("À l'extérieur", "Away game");
      // Neutral site (e.g. a tournament at another school): say where
      if (game.place && !isMySchool(game.place) && game.place.toLowerCase() !== game.opponent.toLowerCase()) where = game.place;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      fitText(ctx, where, W - 160, 32, "SIZE 'Open Sans'");
      ctx.fillText(where, W / 2, y + 50);

      // Footer
      ctx.fillStyle = GOLD;
      ctx.font = "56px 'Bebas Neue'";
      ctx.fillText(tr("ALLEZ LES GRIFFONS !", "GO GRIFFONS!"), W / 2, H - (format === "story" ? 300 : 100));
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "600 30px Rajdhani";
      ctx.fillText("ÉCOLE SECONDAIRE GAÉTAN-GERVAIS · ESGAGE.CA", W / 2, H - (format === "story" ? 250 : 52));
    });
  }

  // ── Page ────────────────────────────────────────────────────────────────

  function fileName(game, format) {
    var d = game.date;
    var day = d ? d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) : "match";
    var opp = game.opponent.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return day + "-" + game.team.cle + "-" + opp + (format === "story" ? "-story" : "") + ".png";
  }

  function toBlob(canvas) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, "image/png"); });
  }

  function start(teams) {
    var list = document.getElementById("games");
    var select = document.getElementById("team-filter");
    var formatButtons = document.querySelectorAll("[data-format]");
    var format = "post";
    var all = [];

    teams.forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.cle;
      o.textContent = (EN ? SPORTS[t.sport].en + " — " + t.en : SPORTS[t.sport].fr + " — " + t.fr);
      select.appendChild(o);
    });
    var wanted = new URLSearchParams(location.search).get("equipe");
    if (wanted) select.value = wanted;

    function render() {
      var games = all.filter(function (g) { return !select.value || g.team.cle === select.value; });
      list.innerHTML = "";
      if (!games.length) {
        list.innerHTML = '<p class="data-loading">' + tr("Aucun match joué pour l'instant.", "No games played yet.") + "</p>";
        return;
      }
      games.forEach(function (g) {
        var card = document.createElement("article");
        card.className = "game-image-card";
        var canvas = document.createElement("canvas");
        canvas.setAttribute("role", "img");
        var label = (g.result === "win" ? tr("Victoire", "Win") : g.result === "tie" ? tr("Nulle", "Tie") : tr("Défaite", "Loss")) +
          " " + g.us + "-" + g.them + " " + tr("contre", "against") + " " + g.opponent;
        canvas.setAttribute("aria-label", label);
        var info = document.createElement("div");
        info.className = "game-image-info";
        info.innerHTML = '<span class="game-image-team"></span><span class="game-image-label"></span>';
        info.firstChild.textContent = (EN ? SPORTS[g.team.sport].en + " " + g.team.en : SPORTS[g.team.sport].fr + " " + g.team.fr) + " · " + dateText(g.date);
        info.lastChild.textContent = label;
        var actions = document.createElement("div");
        actions.className = "game-image-actions";
        var dl = document.createElement("button");
        dl.type = "button"; dl.className = "btn-image";
        dl.innerHTML = '<i class="bi bi-download"></i> ' + tr("Télécharger", "Download");
        actions.appendChild(dl);
        var share = null;
        if (navigator.canShare) {
          share = document.createElement("button");
          share.type = "button"; share.className = "btn-image btn-image-outline";
          share.innerHTML = '<i class="bi bi-share"></i> ' + tr("Partager", "Share");
          actions.appendChild(share);
        }
        card.appendChild(canvas); card.appendChild(info); card.appendChild(actions);
        list.appendChild(card);

        var ready = draw(canvas, g, format);
        dl.addEventListener("click", function () {
          ready.then(function () { return toBlob(canvas); }).then(function (blob) {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = fileName(g, format);
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
          });
        });
        if (share) share.addEventListener("click", function () {
          ready.then(function () { return toBlob(canvas); }).then(function (blob) {
            var file = new File([blob], fileName(g, format), { type: "image/png" });
            if (navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(function () {});
            else dl.click();
          });
        });
      });
    }

    select.addEventListener("change", render);
    formatButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        format = b.getAttribute("data-format");
        formatButtons.forEach(function (x) { x.classList.toggle("active", x === b); x.setAttribute("aria-pressed", x === b); });
        render();
      });
    });

    Promise.all(teams.map(loadTeam)).then(function (lists) {
      all = [].concat.apply([], lists);
      all.sort(function (a, b) { return (b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0); });
      render();
    });
  }

  window.imagesMatchs = start;
})();
