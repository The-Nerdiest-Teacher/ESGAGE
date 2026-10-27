/**
 * Home page "À venir": the next events from the school's Tockify calendar
 * (the same calendar as calendrier.html), so the list updates itself.
 * If the calendar can't be reached, only the "Voir le calendrier complet" link shows.
 */
(function () {
  "use strict";

  var CALENDAR = "gaetangervais";
  var EN = /^en/i.test(document.documentElement.lang);
  var LOCALE = EN ? "en-CA" : "fr-CA";
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

  // All-day events are stored as a date, so show them in UTC to avoid landing on the day before
  function formatParts(millis, allDay) {
    var date = new Date(millis);
    var zone = allDay ? "UTC" : "America/Toronto";
    return {
      day: date.toLocaleDateString(LOCALE, { day: "numeric", timeZone: zone }),
      month: date.toLocaleDateString(LOCALE, { month: "short", timeZone: zone }).replace(".", ""),
      weekday: date.toLocaleDateString(LOCALE, { weekday: "long", timeZone: zone }),
      time: allDay ? "" : date.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: zone })
    };
  }

  function render(events) {
    var cards = events.map(function (e) {
      var p = formatParts(e.start, e.allDay);
      var when = p.weekday + (p.time ? " · " + p.time : "");
      return '<div class="col-lg-4 col-md-6">' +
        '<a class="event-card" href="calendrier.html">' +
          '<span class="event-date"><span class="event-day">' + p.day + '</span><span class="event-month">' + escapeHtml(p.month) + "</span></span>" +
          '<span class="event-body">' +
            '<strong class="event-title">' + escapeHtml(e.title) + "</strong>" +
            '<span class="event-when">' + escapeHtml(when) + "</span>" +
          "</span>" +
        "</a></div>";
    });
    list.innerHTML = cards.join("");
  }

  var url = "https://tockify.com/api/ngevent?calname=" + CALENDAR + "&max=" + MAX_EVENTS + "&startms=" + Date.now();

  fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (data) {
      var events = ((data && data.events) || []).map(function (e) {
        var when = e.when || {};
        var start = when.start || {};
        var summary = (e.content && e.content.summary) || {};
        return {
          title: summary.text || "",
          start: start.millis,
          allDay: !!(when.allDay || start.allDay)
        };
      }).filter(function (e) {
        return e.title && typeof e.start === "number";
      }).slice(0, MAX_EVENTS);

      if (events.length) render(events);
      else showFallback();
    })
    .catch(showFallback);
})();
