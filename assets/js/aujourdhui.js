/**
 * "Aujourd'hui à GAGE" page (aujourdhui.html and en/aujourdhui.html):
 * today's events and home games from assets/data/events.json (the same file
 * as the Calendrier page), then the next few events.
 * Also shows the "Installer l'app" card (hidden once the site is installed).
 * The page refreshes itself when the app is reopened on another day.
 */
(function () {
  "use strict";

  var root = document.getElementById("today");
  if (!root) return;

  var EN = /^en/i.test(document.documentElement.lang);
  var LOCALE = EN ? "en-CA" : "fr-CA";
  var SOURCE = "/assets/data/events.json";
  var CALENDAR = EN ? "/en/calendrier.html" : "/calendrier.html";
  var MAX_NEXT = 5;
  var T = EN ? {
    allDay: "All day", game: "Home game", next: "Coming up",
    none: "Nothing on the calendar today. Have a great day, Griffons!",
    noNext: "No upcoming events for now.",
    tomorrow: "Tomorrow", loading: "Loading today's events…",
    error: "Today's events could not be loaded. Check your connection and try again.",
    offline: "You're offline: these events may not be up to date."
  } : {
    allDay: "Toute la journée", game: "Match à domicile", next: "Prochainement",
    none: "Rien au calendrier aujourd’hui. Bonne journée, Griffons !",
    noNext: "Aucun événement à venir pour le moment.",
    tomorrow: "Demain", loading: "Chargement des événements du jour…",
    error: "Les événements du jour n’ont pas pu être chargés. Vérifiez votre connexion et réessayez.",
    offline: "Vous êtes hors ligne : ces événements ne sont peut-être pas à jour."
  };

  /* ── Dates are plain "YYYY-MM-DD" strings in school (Toronto) time, as in calendar.js ── */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function toDate(iso) {
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2], 12);
  }
  function addDays(iso, n) {
    var d = toDate(iso);
    d.setDate(d.getDate() + n);
    return isoDate(d);
  }
  function fmt(iso, options) { return toDate(iso).toLocaleDateString(LOCALE, options); }
  function cap(text) { return text.charAt(0).toUpperCase() + text.slice(1); }
  function fmtTime(stamp) {
    var p = stamp.slice(11).split(":");
    return new Date(2000, 0, 1, +p[0], +p[1]).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
  }
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // First and last day an event covers (all-day "end" is the day after, as in Outlook)
  function firstDay(e) { return e.start.slice(0, 10); }
  function lastDay(e) {
    if (e.allDay) return e.end && e.end > e.start ? addDays(e.end, -1) : e.start;
    var end = (e.end || e.start).slice(0, 10);
    if (e.end && e.end.slice(11) === "00:00" && end > firstDay(e)) end = addDays(end, -1);
    return end;
  }

  function whenText(e) {
    var first = firstDay(e), last = lastDay(e);
    if (first !== last) return cap(fmt(first, { day: "numeric", month: "long" })) + " – " + fmt(last, { day: "numeric", month: "long" });
    if (e.allDay) return T.allDay;
    var text = fmtTime(e.start);
    if (e.end && e.end !== e.start) text += " – " + fmtTime(e.end);
    return text;
  }

  function eventItem(e) {
    var icon = window.gageEventIcon(e.title); // assets/js/event-icons.js
    return '<li class="cal-event' + (e.allDay ? " is-allday" : "") + '">' +
      window.gageEventIconHtml(icon, "cal-event-icon") +
      '<span class="cal-event-text">' +
      '<span class="cal-event-when">' + escapeHtml(whenText(e)) +
      (e.game ? ' <span class="today-pill"><i class="bi bi-trophy"></i> ' + T.game + "</span>" : "") + "</span>" +
      '<strong class="cal-event-title">' + (e.url
        ? '<a href="' + escapeHtml(e.url + (EN ? "?lang=en" : "")) + '">' + escapeHtml(icon.title) + ' <i class="bi bi-arrow-right-short"></i></a>'
        : escapeHtml(icon.title)) + "</strong>" +
      (e.location ? '<span class="cal-event-place"><i class="bi bi-geo-alt"></i> ' + escapeHtml(e.location) + "</span>" : "") +
      (e.description ? '<p class="cal-event-desc">' + escapeHtml(e.description).replace(/\n/g, "<br>") + "</p>" : "") +
      "</span></li>";
  }

  function nextItem(e, today) {
    var start = firstDay(e);
    var tomorrow = start === addDays(today, 1);
    return '<li class="cal-list-item">' +
      '<a class="cal-badge" href="' + CALENDAR + "#" + start + '"' + (tomorrow ? ' title="' + T.tomorrow + '"' : "") + ">" +
      '<span class="cal-badge-day">' + toDate(start).getDate() + "</span>" +
      '<span class="cal-badge-week">' + escapeHtml(tomorrow ? T.tomorrow : fmt(start, { weekday: "short" }).replace(".", "")) + "</span></a>" +
      '<ul class="cal-events">' + eventItem(e) + "</ul></li>";
  }

  var events = null;
  var shownDay = "";

  function render() {
    var today = isoDate(new Date());
    shownDay = today;
    var dateEl = document.getElementById("today-date");
    if (dateEl) dateEl.textContent = cap(fmt(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));

    var now = events.filter(function (e) { return firstDay(e) <= today && lastDay(e) >= today; });
    var next = events.filter(function (e) { return firstDay(e) > today; }).slice(0, MAX_NEXT);

    root.innerHTML =
      (navigator.onLine === false ? '<p class="today-offline"><i class="bi bi-wifi-off"></i> ' + T.offline + "</p>" : "") +
      '<div class="cal-day-panel today-panel">' +
        (now.length ? '<ul class="cal-events">' + now.map(eventItem).join("") + "</ul>"
                    : '<p class="cal-empty today-none"><i class="bi bi-sun"></i> ' + T.none + "</p>") +
      "</div>" +
      '<h2 class="cal-list-month today-next">' + T.next + "</h2>" +
      (next.length ? '<ul class="cal-list">' + next.map(function (e) { return nextItem(e, today); }).join("") + "</ul>"
                   : '<p class="cal-empty">' + T.noNext + "</p>");
  }

  function load() {
    return fetch(SOURCE, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(function (data) {
        events = ((data && data.events) || []).filter(function (e) { return e && e.title && e.start; });
        events.sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
        render();
      })
      .catch(function () {
        if (events) return render(); // keep what we had
        root.innerHTML = '<p class="cal-empty cal-empty-big"><i class="bi bi-exclamation-circle me-2"></i>' + T.error + "</p>";
      });
  }

  root.innerHTML = '<p class="cal-empty cal-empty-big"><i class="bi bi-arrow-clockwise me-2"></i>' + T.loading + "</p>";
  load();

  // An installed app can stay open for days: reload the events when it comes back
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && events) load();
  });
  setInterval(function () {
    if (events && isoDate(new Date()) !== shownDay) load();
  }, 60 * 1000);

  /* ── "Installer l'app" card ── */
  var card = document.getElementById("install-card");
  if (!card) return;
  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (standalone) return; // already installed

  var ua = navigator.userAgent;
  var ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var button = document.getElementById("install-button");
  var deferred = null;

  card.hidden = false;
  if (ios) card.classList.add("is-ios");

  window.addEventListener("beforeinstallprompt", function (ev) {
    ev.preventDefault();
    deferred = ev;
    card.classList.add("can-prompt");
  });
  window.addEventListener("appinstalled", function () { card.hidden = true; });
  if (button) {
    button.addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () {
        deferred = null;
        card.classList.remove("can-prompt");
      });
    });
  }
})();
