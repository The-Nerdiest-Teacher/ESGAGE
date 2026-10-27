/**
 * Home page "À venir": the next events from assets/data/events.json
 * (the school's shared Outlook calendar, also shown on calendrier.html),
 * so the list updates itself.
 * If there are no upcoming events, only the "Voir le calendrier complet" link shows.
 */
(function () {
  "use strict";

  var EN = /^en/i.test(document.documentElement.lang);
  var LOCALE = EN ? "en-CA" : "fr-CA";
  var SOURCE = EN ? "/assets/data/events.json" : "assets/data/events.json";
  var CALENDAR = EN ? "/en/calendrier.html" : "calendrier.html";
  var MAX_EVENTS = 3;
  var list = document.getElementById("events-list");
  if (!list) return;

  function showFallback() {
    list.innerHTML = '<div class="col-lg-8"><p class="events-empty"><i class="bi bi-calendar-event me-2"></i>' +
      (EN ? "See the calendar for upcoming events." : "Consultez le calendrier pour voir les prochains événements.") + "</p></div>";
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  // Dates in events.json are school (Toronto) time: "2026-11-05" or "2026-11-05T18:30"
  function formatParts(e) {
    var p = e.start.split(/[-T:]/);
    var date = new Date(+p[0], +p[1] - 1, +p[2], e.allDay ? 12 : +p[3], e.allDay ? 0 : +p[4]);
    return {
      day: date.toLocaleDateString(LOCALE, { day: "numeric" }),
      month: date.toLocaleDateString(LOCALE, { month: "short" }).replace(".", ""),
      weekday: date.toLocaleDateString(LOCALE, { weekday: "long" }),
      time: e.allDay ? "" : date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })
    };
  }

  function render(events) {
    var cards = events.map(function (e) {
      var p = formatParts(e);
      var when = p.weekday + (p.time ? " · " + p.time : "");
      var icon = window.gageEventIcon(e.title); // assets/js/event-icons.js
      return '<div class="col-lg-4 col-md-6">' +
        '<a class="event-card" href="' + CALENDAR + "#" + e.start.slice(0, 10) + '">' +
          '<span class="event-date"><span class="event-day">' + p.day + '</span><span class="event-month">' + escapeHtml(p.month) + "</span></span>" +
          '<span class="event-body">' +
            '<strong class="event-title">' + window.gageEventIconHtml(icon, "event-icon") + escapeHtml(icon.title) + "</strong>" +
            '<span class="event-when">' + escapeHtml(when) + "</span>" +
          "</span>" +
        "</a></div>";
    });
    list.innerHTML = cards.join("");
  }

  fetch(SOURCE, { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (data) {
      var today = isoDate(new Date());
      var events = ((data && data.events) || []).filter(function (e) {
        return e && e.title && e.start && e.start.slice(0, 10) >= today;
      }).slice(0, MAX_EVENTS);

      if (events.length) render(events);
      else showFallback();
    })
    .catch(showFallback);
})();
