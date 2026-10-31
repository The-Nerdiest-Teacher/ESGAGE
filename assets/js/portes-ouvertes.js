/**
 * Soirée portes ouvertes : bandeau sur la page d'accueil (FR + EN).
 *
 * ── À MODIFIER CHAQUE ANNÉE ─────────────────────────────────────────────
 * Écrivez la date entre guillemets, au format "AAAA-MM-JJ".
 * Tant que la date est vide (""), le bandeau reste caché.
 * Il apparaît tout seul JOURS_AVANT jours avant la soirée et disparaît
 * tout seul à l'heure de fin (ou à minuit si l'heure de fin est vide).
 * Les champs vides ("") sont simplement omis du bandeau.
 */
var PORTES_OUVERTES = {
  date: "2026-11-26",     // ex. "2026-12-03"
  debut: "18:00",         // heure de début, ex. "18:00"
  fin: "20:00",           // heure de fin, ex. "20:00"
  lieu: "1075 McCraney St E, Oakville",
  lien: "",               // optionnel : page d'inscription ou d'info, ex. "https://..."
  JOURS_AVANT: 28
};
/* ─────────────────────────────────────────────────────────────────────── */

(function (cfg) {
  "use strict";

  var box = document.getElementById("portes-ouvertes");
  if (!box || !/^\d{4}-\d{2}-\d{2}$/.test(cfg.date)) return;

  var EN = /^en/i.test(document.documentElement.lang);
  var LOCALE = EN ? "en-CA" : "fr-CA";
  var HOUR = /^\d{1,2}:\d{2}$/;

  function at(time, fallback) {
    var d = cfg.date.split("-");
    var t = HOUR.test(time) ? time.split(":") : fallback;
    return new Date(+d[0], +d[1] - 1, +d[2], +t[0], +t[1]);
  }

  var start = at(cfg.debut, [0, 0]);
  var end = at(cfg.fin, [23, 59]);
  var midnight = at("", [0, 0]);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var daysLeft = Math.round((midnight - today) / 86400000);
  if (now > end || daysLeft > (+cfg.JOURS_AVANT || 28)) return;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function hour(d) { return d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" }); }

  var dateText = midnight.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });
  var timeText = "";
  if (HOUR.test(cfg.debut)) {
    timeText = HOUR.test(cfg.fin)
      ? (EN ? hour(start) + " to " + hour(end) : "de " + hour(start) + " à " + hour(end))
      : (EN ? "at " : "à ") + hour(start);
  }

  var countdown;
  if (daysLeft <= 0) countdown = EN ? (start.getHours() >= 16 ? "Tonight!" : "Today!") : (start.getHours() >= 16 ? "C'est ce soir !" : "C'est aujourd'hui !");
  else if (daysLeft === 1) countdown = EN ? "Tomorrow!" : "C'est demain !";
  else countdown = EN ? "In " + daysLeft + " days" : "Dans " + daysLeft + " jours";

  // "Add to my calendar": a small .ics file made on the spot
  function icsStamp(d) {
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "T" + p(d.getHours()) + p(d.getMinutes()) + "00";
  }
  var calEnd = HOUR.test(cfg.fin) ? end : new Date(start.getTime() + 2 * 3600000);
  var title = EN ? "Open house - École secondaire Gaétan-Gervais" : "Soirée portes ouvertes - École secondaire Gaétan-Gervais";
  var ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//esgage.ca//portes-ouvertes//FR", "BEGIN:VEVENT",
    "UID:portes-ouvertes-" + cfg.date + "@esgage.ca",
    "DTSTAMP:" + icsStamp(new Date()),
    HOUR.test(cfg.debut) ? "DTSTART;TZID=America/Toronto:" + icsStamp(start) : "DTSTART;VALUE=DATE:" + cfg.date.replace(/-/g, ""),
    HOUR.test(cfg.debut) ? "DTEND;TZID=America/Toronto:" + icsStamp(calEnd) : "",
    "SUMMARY:" + title,
    cfg.lieu ? "LOCATION:" + cfg.lieu.replace(/,/g, "\\,") : "",
    "URL:" + (cfg.lien || "https://esgage.ca/"),
    "END:VEVENT", "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
  var icsHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

  var html =
    '<div class="container po-bar">' +
      '<i class="bi bi-door-open-fill po-icon" aria-hidden="true"></i>' +
      '<p class="po-text">' +
        '<strong class="po-title" id="po-title">' + (EN ? "Open house" : "Soirée portes ouvertes") + "</strong> " +
        '<span class="po-when">' + escapeHtml(dateText) + (timeText ? ", " + escapeHtml(timeText) : "") + "</span>" +
        (cfg.lieu ? ' <span class="po-where">· ' + escapeHtml(cfg.lieu) + "</span>" : "") +
        ' <span class="po-countdown">' + escapeHtml(countdown) + "</span>" +
      "</p>" +
      '<span class="po-actions">' +
        (cfg.lien ? '<a class="po-btn" href="' + escapeHtml(cfg.lien) + '"><i class="bi bi-info-circle-fill" aria-hidden="true"></i> ' + (EN ? "Details" : "Détails") + "</a>" : "") +
        '<a class="po-btn' + (cfg.lien ? " po-btn-outline" : "") + '" href="' + icsHref + '" download="portes-ouvertes-gage.ics">' +
          '<i class="bi bi-calendar-plus-fill" aria-hidden="true"></i> ' + (EN ? "Add to calendar" : "Ajouter au calendrier") + "</a>" +
      "</span>" +
    "</div>";

  box.innerHTML = html;
  box.setAttribute("aria-labelledby", "po-title");
  box.hidden = false;
})(PORTES_OUVERTES);
