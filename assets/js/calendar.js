/**
 * Calendrier page: month and list views of assets/data/events.json,
 * which a GitHub Action copies from the school's shared Outlook calendar.
 * The same file is used by calendrier.html and en/calendrier.html.
 * calendrier.html#2026-11-05 opens on that day.
 */
(function () {
  "use strict";

  var root = document.getElementById("gage-calendar");
  if (!root) return;

  var EN = /^en/i.test(document.documentElement.lang);
  var LOCALE = EN ? "en-CA" : "fr-CA";
  var T = EN ? {
    month: "Month", list: "List", today: "Today", prev: "Previous month", next: "Next month",
    allDay: "All day", more: "more", none: "No events this day.",
    noUpcoming: "No upcoming events for now.", error: "The calendar could not be loaded. Please try again later.",
    loading: "Loading the calendar…", upcoming: "Upcoming events"
  } : {
    month: "Mois", list: "Liste", today: "Aujourd’hui", prev: "Mois précédent", next: "Mois suivant",
    allDay: "Toute la journée", more: "de plus", none: "Aucun événement cette journée.",
    noUpcoming: "Aucun événement à venir pour le moment.", error: "Le calendrier n’a pas pu être chargé. Réessayez plus tard.",
    loading: "Chargement du calendrier…", upcoming: "Événements à venir"
  };

  var events = [];
  var view = "month";
  var today = isoDate(new Date());
  var selected = today;
  var shown = today.slice(0, 7); // "YYYY-MM"

  /* ── Dates are plain "YYYY-MM-DD" strings in school (Toronto) time ── */
  function isoDate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toDate(iso) {
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +(p[2] || 1), 12);
  }
  function addDays(iso, n) {
    var d = toDate(iso);
    d.setDate(d.getDate() + n);
    return isoDate(d);
  }
  function addMonths(ym, n) {
    var d = toDate(ym + "-01");
    d.setMonth(d.getMonth() + n);
    return isoDate(d).slice(0, 7);
  }
  function fmt(iso, options) {
    return toDate(iso).toLocaleDateString(LOCALE, options);
  }
  function cap(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
  function fmtTime(stamp) {
    var p = stamp.slice(11).split(":");
    var d = new Date(2000, 0, 1, +p[0], +p[1]);
    return d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Event names come from Outlook in French; the icon is picked from the name (event-icons.js)
  function title(e) { return e.icon.title; }
  function iconHtml(e, className) { return window.gageEventIconHtml(e.icon, className); }

  // First and last day an event covers (all-day "end" is the day after, as in Outlook)
  function firstDay(e) { return e.start.slice(0, 10); }
  function lastDay(e) {
    if (e.allDay) return e.end && e.end > e.start ? addDays(e.end, -1) : e.start;
    var end = (e.end || e.start).slice(0, 10);
    // A timed event ending at midnight belongs to the day before
    if (e.end && e.end.slice(11) === "00:00" && end > firstDay(e)) end = addDays(end, -1);
    return end;
  }
  function eventsOn(iso) {
    return events.filter(function (e) { return firstDay(e) <= iso && lastDay(e) >= iso; });
  }

  function whenText(e) {
    var first = firstDay(e), last = lastDay(e);
    if (first !== last) {
      return cap(fmt(first, { day: "numeric", month: "long" })) + " – " + fmt(last, { day: "numeric", month: "long" });
    }
    if (e.allDay) return T.allDay;
    var text = fmtTime(e.start);
    if (e.end && e.end !== e.start) text += " – " + fmtTime(e.end);
    return text;
  }

  /* ── Pieces ── */
  function eventItem(e) {
    var desc = e.description || "";
    return '<li class="cal-event' + (e.allDay ? " is-allday" : "") + '">' +
      iconHtml(e, "cal-event-icon") +
      '<span class="cal-event-text">' +
      '<span class="cal-event-when">' + escapeHtml(whenText(e)) + "</span>" +
      '<strong class="cal-event-title">' + escapeHtml(title(e)) + "</strong>" +
      (e.location ? '<span class="cal-event-place"><i class="bi bi-geo-alt"></i> ' + escapeHtml(e.location) + "</span>" : "") +
      (desc ? '<p class="cal-event-desc">' + escapeHtml(desc).replace(/\n/g, "<br>") + "</p>" : "") +
      "</span></li>";
  }

  function dayPanel() {
    var list = eventsOn(selected);
    return '<div class="cal-day-panel" aria-live="polite">' +
      '<h3 class="cal-day-title">' + escapeHtml(cap(fmt(selected, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))) + "</h3>" +
      (list.length ? '<ul class="cal-events">' + list.map(eventItem).join("") + "</ul>"
                   : '<p class="cal-empty">' + T.none + "</p>") +
      "</div>";
  }

  function monthGrid() {
    var first = toDate(shown + "-01");
    var start = addDays(shown + "-01", -first.getDay()); // weeks start on Sunday
    var html = '<div class="cal-grid" role="grid">';

    for (var w = 0; w < 7; w++) {
      var name = fmt(addDays(start, w), { weekday: "short" }).replace(".", "");
      html += '<div class="cal-weekday" role="columnheader">' + escapeHtml(cap(name)) + "</div>";
    }

    var day = start;
    for (var i = 0; i < 42; i++) {
      if (i === 35 && day.slice(0, 7) !== shown) break; // drop an empty sixth week
      var list = eventsOn(day);
      var classes = "cal-day";
      if (day.slice(0, 7) !== shown) classes += " is-outside";
      if (day === today) classes += " is-today";
      if (day === selected) classes += " is-selected";
      if (list.length) classes += " has-events";

      var chips = list.slice(0, 3).map(function (e) {
        return '<span class="cal-chip' + (e.allDay ? " is-allday" : "") + '">' +
          iconHtml(e, "cal-chip-icon") +
          (e.allDay || firstDay(e) !== day ? "" : '<span class="cal-chip-time">' + escapeHtml(fmtTime(e.start)) + "</span> ") +
          escapeHtml(title(e)) + "</span>";
      }).join("");
      if (list.length > 3) chips += '<span class="cal-more">+' + (list.length - 3) + " " + T.more + "</span>";

      var label = fmt(day, { weekday: "long", day: "numeric", month: "long" }) + (list.length ? " (" + list.length + ")" : "");
      html += '<button type="button" class="' + classes + '" data-day="' + day + '" aria-label="' + escapeHtml(label) + '"' +
        (day === selected ? ' aria-pressed="true"' : ' aria-pressed="false"') + ">" +
        '<span class="cal-num">' + toDate(day).getDate() + "</span>" +
        '<span class="cal-chips">' + chips + "</span>" +
        '<span class="cal-dots" aria-hidden="true">' + list.slice(0, 3).map(function () { return "<i></i>"; }).join("") + "</span>" +
        "</button>";
      day = addDays(day, 1);
    }
    return html + "</div>" + dayPanel();
  }

  function listView() {
    var upcoming = events.filter(function (e) { return lastDay(e) >= today; });
    if (!upcoming.length) return '<p class="cal-empty cal-empty-big">' + T.noUpcoming + "</p>";
    var html = "", month = "";
    upcoming.forEach(function (e) {
      var start = firstDay(e) < today ? today : firstDay(e);
      var m = start.slice(0, 7);
      if (m !== month) {
        if (month) html += "</ul>";
        month = m;
        html += '<h3 class="cal-list-month">' + escapeHtml(cap(fmt(m + "-01", { month: "long", year: "numeric" }))) + '</h3><ul class="cal-list">';
      }
      html += '<li class="cal-list-item">' +
        '<span class="cal-badge"><span class="cal-badge-day">' + toDate(start).getDate() + '</span><span class="cal-badge-week">' +
        escapeHtml(fmt(start, { weekday: "short" }).replace(".", "")) + "</span></span>" +
        '<ul class="cal-events">' + eventItem(e) + "</ul></li>";
    });
    return html + "</ul>";
  }

  function render() {
    var heading = view === "month"
      ? cap(fmt(shown + "-01", { month: "long", year: "numeric" }))
      : T.upcoming;
    root.innerHTML =
      '<div class="cal-toolbar">' +
        '<div class="cal-nav"' + (view === "month" ? "" : " hidden") + ">" +
          '<button type="button" class="cal-btn" data-move="-1" aria-label="' + T.prev + '"><i class="bi bi-chevron-left"></i></button>' +
          '<button type="button" class="cal-btn" data-move="0">' + T.today + "</button>" +
          '<button type="button" class="cal-btn" data-move="1" aria-label="' + T.next + '"><i class="bi bi-chevron-right"></i></button>' +
        "</div>" +
        '<h2 class="cal-heading">' + escapeHtml(heading) + "</h2>" +
        '<div class="cal-views" role="group">' +
          '<button type="button" class="cal-view' + (view === "month" ? " active" : "") + '" data-view="month" aria-pressed="' + (view === "month") + '"><i class="bi bi-calendar3"></i> ' + T.month + "</button>" +
          '<button type="button" class="cal-view' + (view === "list" ? " active" : "") + '" data-view="list" aria-pressed="' + (view === "list") + '"><i class="bi bi-list-ul"></i> ' + T.list + "</button>" +
        "</div>" +
      "</div>" +
      (view === "month" ? monthGrid() : listView());
  }

  root.addEventListener("click", function (ev) {
    var btn = ev.target.closest("button");
    if (!btn) return;
    if (btn.dataset.view) {
      view = btn.dataset.view;
      try { localStorage.setItem("gage-cal-view", view); } catch (e) {}
    } else if (btn.dataset.move) {
      var move = +btn.dataset.move;
      if (move === 0) { shown = today.slice(0, 7); selected = today; }
      else shown = addMonths(shown, move);
    } else if (btn.dataset.day) {
      selected = btn.dataset.day;
      if (selected.slice(0, 7) !== shown) shown = selected.slice(0, 7);
    } else return;
    render();
  });

  // Open on a day from the address, e.g. calendrier.html#2026-11-05
  var hash = location.hash.slice(1);
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(hash)) {
    shown = hash.slice(0, 7);
    if (hash.length === 10) selected = hash;
    view = "month";
  } else {
    try { if (localStorage.getItem("gage-cal-view") === "list") view = "list"; } catch (e) {}
  }

  root.innerHTML = '<p class="cal-empty cal-empty-big"><i class="bi bi-arrow-clockwise me-2"></i>' + T.loading + "</p>";
  fetch(root.getAttribute("data-src"), { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (data) {
      events = ((data && data.events) || []).filter(function (e) { return e && e.title && e.start; });
      events.forEach(function (e) { e.icon = window.gageEventIcon(e.title); });
      render();
    })
    .catch(function () {
      root.innerHTML = '<p class="cal-empty cal-empty-big"><i class="bi bi-exclamation-circle me-2"></i>' + T.error + "</p>";
    });
})();
