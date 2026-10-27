/**
 * Team pages (equipes/) are one file for both languages.
 * The English version is the same address with ?lang=en at the end, e.g.
 *   /equipes/volleyball-garcons-senior-2026-2027.html?lang=en
 *
 * On that address this script:
 *   - loads the English menu and footer (include-partials.js reads <html lang>),
 *   - replaces the text of every element that has a data-en="..." attribute
 *     (on <title> and <meta> tags it replaces the title / content),
 *   - points the page's links to the English pages,
 *   - lets the page's own script pick its words with tr("français", "English").
 *
 * Load it in the <head>, before include-partials.js.
 */
(function () {
  "use strict";

  var EN = new URLSearchParams(location.search).get("lang") === "en";
  window.GAGE_EN = EN;

  // tr("Victoire", "Win") gives the word for the page's language
  window.tr = function (fr, en) { return EN ? en : fr; };

  // "Mardi 13 octobre 2026" → "Tuesday, October 13, 2026" on the English page
  var DAYS = { dimanche: "Sunday", lundi: "Monday", mardi: "Tuesday", mercredi: "Wednesday", jeudi: "Thursday", vendredi: "Friday", samedi: "Saturday" };
  var MONTHS = { janvier: "January", "février": "February", fevrier: "February", mars: "March", avril: "April", mai: "May", juin: "June",
    juillet: "July", "août": "August", aout: "August", septembre: "September", octobre: "October", novembre: "November", "décembre": "December", decembre: "December" };
  window.trDate = function (text) {
    if (!EN || !text) return text;
    var m = String(text).trim().match(/^(?:(\S+)\s+)?(\d{1,2})(?:er)?\s+(\S+)(?:\s+(\d{4}))?$/i);
    if (!m) return text;
    var day = m[1] ? DAYS[m[1].toLowerCase()] : "";
    var month = MONTHS[m[3].toLowerCase()];
    if (!month || (m[1] && !day)) return text;
    return (day ? day + ", " : "") + month + " " + parseInt(m[2], 10) + (m[4] ? ", " + m[4] : "");
  };

  // 1 → "1st", 22 → "22nd", 69 → "69th"
  window.enOrdinalSuffix = function (n) {
    var t = n % 100;
    if (t >= 11 && t <= 13) return "th";
    return { 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th";
  };

  // This page in each language, for Google and for the FR/EN button in the menu
  var base = location.origin + location.pathname;
  [["fr-CA", base], ["en-CA", base + "?lang=en"], ["x-default", base]].forEach(function (pair) {
    var link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = pair[0];
    link.href = pair[1];
    document.head.appendChild(link);
  });

  if (!EN) return;
  document.documentElement.lang = "en";

  // Pages with an English twin in /en/
  var EN_PAGES = ["index.html", "academique.html", "cours.html", "programmes-specialises.html", "activite.html",
    "athletisme.html", "calendrier.html", "personnel.html", "contact.html", "nouvelles.html"];

  function translatePage() {
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var en = el.getAttribute("data-en");
      if (el.tagName === "TITLE") document.title = en;
      else if (el.tagName === "META") el.setAttribute("content", en);
      else el.innerHTML = en;
    });

    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = base + "?lang=en";

    document.querySelectorAll("main a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      var url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      var file = url.pathname.replace(/^\//, "") || "index.html";
      if (EN_PAGES.indexOf(file) >= 0) {
        a.href = "/en/" + file + url.hash;
      } else if (/^equipes\/.+\.html$/.test(file)) {
        url.searchParams.set("lang", "en");
        a.href = url.pathname + url.search + url.hash;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", translatePage);
})();
