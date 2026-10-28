/**
 * Site search: the magnifier button in the menu (#search-toggle) opens a search box over the page.
 * - Looks in assets/data/recherche.json, rebuilt automatically by .github/workflows/recherche.yml
 *   whenever a page changes (script: .github/scripts/recherche.py). Nothing to update by hand.
 * - French pages search the French pages, English pages (and ?lang=en team pages) the English ones.
 * - Accents and capitals don't matter ("eleve" finds "élève"), and the start of a word is enough ("volley").
 * - Shortcut: "/" or Ctrl+K opens it; Escape closes it; arrow keys move through the results.
 * Loaded by include-partials.js once the menu is on the page.
 */
(function () {
  "use strict";

  var EN = /^en/i.test(document.documentElement.lang);
  var T = EN ? {
    open: "Search the site",
    title: "Search the site",
    label: "Search",
    placeholder: "Courses, staff, teams…",
    close: "Close search",
    loading: "Loading…",
    error: "Search isn't available right now. Please try again later.",
    none: function (q) { return "No results for “" + q + "”. Try another word, or check the spelling."; },
    count: function (n, q) { return n + (n === 1 ? " result" : " results") + " for “" + q + "”"; },
    more: function (n) { return "Showing the first " + n + ". Add a word to narrow it down."; },
    hint: "Try:",
    ideas: ["Bell schedule", "Staff", "Volleyball", "IB", "Bus"],
    kinds: { page: "Page", staff: "Staff", team: "Team" },
    email: "Email"
  } : {
    open: "Rechercher sur le site",
    title: "Rechercher sur le site",
    label: "Rechercher",
    placeholder: "Cours, personnel, équipes…",
    close: "Fermer la recherche",
    loading: "Chargement…",
    error: "La recherche n'est pas disponible pour le moment. Réessayez plus tard.",
    none: function (q) { return "Aucun résultat pour « " + q + " ». Essayez un autre mot ou vérifiez l'orthographe."; },
    count: function (n, q) { return n + (n === 1 ? " résultat" : " résultats") + " pour « " + q + " »"; },
    more: function (n) { return "Les " + n + " premiers sont affichés. Ajoutez un mot pour préciser."; },
    hint: "Essayez :",
    ideas: ["Horaire", "Personnel", "Volleyball", "BI", "Autobus"],
    kinds: { page: "Page", staff: "Personnel", team: "Équipe" },
    email: "Courriel"
  };
  var MAX_RESULTS = 20;
  var STOP = EN
    ? ["the", "a", "an", "of", "and", "to", "in", "for", "on", "at", "is"]
    : ["le", "la", "les", "l", "de", "des", "du", "d", "et", "un", "une", "a", "au", "aux", "en", "pour"];

  var docs = null;      // the index, once loaded
  var loading = null;   // its download
  var dialog, input, status, list, ideas, lastFocus;

  // Same length as the text it comes from, so a match's position is the same in both
  function norm(text) {
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var c = text[i].normalize("NFD")[0].toLowerCase();
      out += /[a-z0-9]/.test(c) || c.charCodeAt(0) > 127 && /\p{L}|\p{N}/u.test(c) ? c : " ";
    }
    return out;
  }

  function load() {
    if (!loading) {
      loading = fetch("/assets/data/recherche.json").then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(function (all) {
        docs = all.filter(function (d) { return d.l === (EN ? "en" : "fr"); }).map(function (d) {
          var sections = (d.s || []).map(function (s) {
            return { h: s.h, a: s.a, t: s.t, nh: " " + norm(s.h), nt: " " + norm(s.t) };
          });
          return {
            d: d, sections: sections,
            nti: " " + norm(d.ti), nd: " " + norm(d.d || ""), ne: " " + norm(d.e || ""),
            all: " " + norm([d.ti, d.d, d.e].concat((d.s || []).map(function (s) { return s.h + " " + s.t; })).join(" "))
          };
        });
      });
      loading.catch(function () { loading = null; });
    }
    return loading;
  }

  function terms(q) {
    var seen = {};
    return norm(q).split(" ").filter(function (w) {
      if (!w || seen[w] || STOP.indexOf(w) !== -1) return false;
      seen[w] = true;
      return true;
    });
  }

  // How well one piece of text matches: whole word > start of a word
  function hit(text, w) {
    var i = text.indexOf(" " + w);
    if (i === -1) return 0;
    var after = text.charAt(i + 1 + w.length);
    return after === " " || after === "" ? 2 : 1;
  }

  function search(q) {
    var words = terms(q);
    if (!words.length) return [];
    var results = [];
    docs.forEach(function (doc) {
      for (var i = 0; i < words.length; i++) if (!hit(doc.all, words[i])) return;
      var score = 0;
      words.forEach(function (w) {
        score += hit(doc.nti, w) * 10 + hit(doc.nd, w) * 3 + hit(doc.ne, w) * 3;
      });
      // The section that matches best is the one shown and linked to
      var best = null, bestScore = 0;
      doc.sections.forEach(function (s) {
        var sc = 0;
        words.forEach(function (w) { sc += hit(s.nh, w) * 6 + hit(s.nt, w); });
        if (sc > bestScore) { best = s; bestScore = sc; }
      });
      if (doc.d.k === "team") score -= 1;   // pages first when it's a tie
      results.push({ doc: doc, section: best, score: score + bestScore });
    });
    results.sort(function (a, b) { return b.score - a.score; });
    return results;
  }

  // A short piece of text around the first match, with the matching words in <mark>
  function snippet(text, words) {
    var n = " " + norm(text), first = -1;
    words.forEach(function (w) {
      var i = n.indexOf(" " + w);
      if (i !== -1 && (first === -1 || i < first)) first = i;
    });
    var start = 0, end = Math.min(text.length, 170);
    if (first > 60) {
      start = text.lastIndexOf(" ", first - 50) + 1;
      end = Math.min(text.length, start + 170);
    }
    end = end < text.length ? text.lastIndexOf(" ", end) : end;
    if (end <= start) end = Math.min(text.length, start + 170);
    var frag = document.createDocumentFragment();
    if (start > 0) frag.appendChild(document.createTextNode("… "));
    var pos = start;
    var piece = n.slice(start + 1, end + 1);
    var re = new RegExp("(^| )(" + words.map(function (w) { return w.replace(/[^\p{L}\p{N}]/gu, ""); }).join("|") + ")", "gu");
    var m;
    while ((m = re.exec(piece))) {
      var at = start + m.index + m[1].length;
      var len = m[2].length;
      // Extend to the end of the word
      while (at + len < end && n.charAt(at + len + 1) !== " ") len++;
      if (at > pos) frag.appendChild(document.createTextNode(text.slice(pos, at)));
      var mark = document.createElement("mark");
      mark.textContent = text.slice(at, at + len);
      frag.appendChild(mark);
      pos = at + len;
      re.lastIndex = Math.max(re.lastIndex, pos - start);
    }
    frag.appendChild(document.createTextNode(text.slice(pos, end) + (end < text.length ? " …" : "")));
    return frag;
  }

  function render() {
    var q = input.value.trim();
    list.textContent = "";
    ideas.hidden = !!q;
    if (!q) { status.textContent = ""; return; }
    if (!docs) {
      status.textContent = T.loading;
      load().then(render, function () { status.textContent = T.error; });
      return;
    }
    var words = terms(q);
    var results = search(q);
    if (!results.length) { status.textContent = T.none(q); return; }
    status.textContent = T.count(results.length, q) + (results.length > MAX_RESULTS ? ". " + T.more(MAX_RESULTS) : "");
    results.slice(0, MAX_RESULTS).forEach(function (r) {
      var d = r.doc.d, s = r.section;
      var li = document.createElement("li");
      li.className = "site-search-result";
      var a = document.createElement("a");
      a.href = d.u + (s && s.a ? "#" + s.a : "");
      var kind = document.createElement("span");
      kind.className = "site-search-kind";
      kind.textContent = d.k === "staff" ? T.kinds.staff : d.k === "team" ? T.kinds.team : T.kinds.page;
      var title = document.createElement("span");
      title.className = "site-search-title";
      title.textContent = d.ti + (s && s.h && s.h !== d.ti ? " › " + s.h : "");
      a.appendChild(kind);
      a.appendChild(title);
      li.appendChild(a);
      var text = d.k === "staff" ? d.d : (s && s.t) || d.d || "";
      if (text) {
        var p = document.createElement("p");
        p.className = "site-search-snippet";
        p.appendChild(snippet(text, words));
        li.appendChild(p);
      }
      if (d.e) {
        var mail = document.createElement("a");
        mail.className = "site-search-email";
        mail.href = "mailto:" + d.e;
        mail.textContent = d.e;
        mail.setAttribute("aria-label", T.email + " " + d.ti + " : " + d.e);
        li.appendChild(mail);
      }
      list.appendChild(li);
    });
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.className = "site-search";
    dialog.setAttribute("aria-labelledby", "site-search-title");
    dialog.innerHTML =
      '<div class="site-search-panel">' +
        '<h2 id="site-search-title" class="sr-only"></h2>' +
        '<form class="site-search-form" role="search">' +
          '<label for="site-search-input" class="sr-only"></label>' +
          '<i class="bi bi-search" aria-hidden="true"></i>' +
          '<input type="search" id="site-search-input" autocomplete="off" spellcheck="false" enterkeyhint="search">' +
          '<button type="button" class="site-search-close"><i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
        '</form>' +
        '<p class="site-search-status" role="status" aria-live="polite"></p>' +
        '<div class="site-search-ideas"><span></span></div>' +
        '<ul class="site-search-results"></ul>' +
      '</div>';
    dialog.querySelector("h2").textContent = T.title;
    dialog.querySelector("label").textContent = T.label;
    input = dialog.querySelector("input");
    input.placeholder = T.placeholder;
    var close = dialog.querySelector(".site-search-close");
    close.setAttribute("aria-label", T.close);
    status = dialog.querySelector(".site-search-status");
    list = dialog.querySelector(".site-search-results");
    ideas = dialog.querySelector(".site-search-ideas");
    ideas.firstChild.textContent = T.hint;
    T.ideas.forEach(function (word) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = word;
      b.addEventListener("click", function () { input.value = word; render(); input.focus(); });
      ideas.appendChild(b);
    });

    var timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(render, 150);
    });
    dialog.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      render();
      var first = list.querySelector("a");
      if (first) first.click();
    });
    close.addEventListener("click", function () { dialog.close(); });
    // A click on the dark area around the box closes it
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () {
      document.documentElement.classList.remove("site-search-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    });
    // Arrow keys move between the search box and the results
    dialog.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      var links = [input].concat([].slice.call(list.querySelectorAll(".site-search-result > a")));
      var current = document.activeElement;
      var item = current.closest(".site-search-result");
      var i = current === input ? 0 : item ? links.indexOf(item.firstChild) : -1;
      if (i === -1) return;
      e.preventDefault();
      var next = links[Math.max(0, Math.min(links.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))];
      next.focus();
    });
    // Following a link to the same page with a #section: close so the page can scroll there
    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) dialog.close();
    });
    document.body.appendChild(dialog);
  }

  function open() {
    if (!dialog) build();
    if (dialog.open) return;
    lastFocus = document.activeElement;
    document.documentElement.classList.add("site-search-open");
    dialog.showModal();
    input.focus();
    input.select();
    load().catch(function () {});
  }

  var button = document.getElementById("search-toggle");
  if (button) {
    button.addEventListener("click", open);
    // Start downloading the list as soon as someone points at the button
    button.addEventListener("pointerenter", function () { load().catch(function () {}); }, { once: true });
  }

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    var typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
    if ((e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
      if (!button) return;
      e.preventDefault();
      open();
    }
  });
})();
