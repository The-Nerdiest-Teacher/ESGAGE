/**
 * Picks a small icon for a calendar event from words in its name
 * (used by the Calendrier page and the home page "À venir").
 * The first rule that matches wins; accents and capitals don't matter.
 * Icons: https://icons.getbootstrap.com (write the name without "bi-").
 * Starting an event name with an emoji (e.g. "🎃 Danse") shows that emoji instead.
 */
(function () {
  "use strict";

  var RULES = [
    ["snow", /\b(ski|neige|planche a neige|hiver)\b/],
    ["calendar-x", /\b(journee pedagogique|pedagogique|conge|ferie|relache|vacances|pas d.ecole|ecole fermee|fermeture)\b/],
    ["mortarboard", /\b(diplome|diplomes|graduation|finissant|finissants|collation|bal)\b/],
    ["camera", /\b(photo|photos)\b/],
    ["journal-text", /\b(bulletin|bulletins|releve)\b/],
    ["pencil-square", /\b(examen|examens|evaluation|test|oqre|tpcl)\b/],
    ["stopwatch", /\b(course|cross|athletisme|marathon)\b/],
    ["trophy", /\b(volley|volleyball|basket|basketball|soccer|hockey|badminton|natation|rugby|football|ultimate|tournoi|match|championnat|sport|sports|griffons)\b/],
    ["people", /\b(parents|conseil d.ecole|rencontre|reunion|soiree d.information)\b/],
    ["megaphone", /\b(election|elections|conseil des eleves|assemblee)\b/],
    ["flag", /\b(francophonie|franco|fierte|drapeau)\b/],
    ["music-note-beamed", /\b(concert|musique|chorale|spectacle|talents)\b/],
    ["mic", /\b(theatre|improvisation|impro|debat|debats)\b/],
    ["palette", /\b(art|arts|exposition|vernissage)\b/],
    ["robot", /\b(robotique|robot|gagetech|techno|technologie|hackathon)\b/],
    ["bus-front", /\b(sortie|sorties|voyage|excursion|visite au|visite a)\b/],
    ["house-door", /\b(portes ouvertes|inscription|inscriptions|visite)\b/],
    ["balloon", /\b(danse|halloween|fete|fetes|carnaval|party|celebration|noel)\b/],
    ["book", /\b(lecture|bibliotheque|livre|livres|salon du livre)\b/],
    ["heart-pulse", /\b(sante|vaccin|vaccination|clinique|don de sang)\b/],
    ["gift", /\b(collecte|dons|charite|benevolat|levee de fonds|campagne)\b/],
    ["briefcase", /\b(carriere|carrieres|orientation|universite|college|postsecondaire|stage)\b/]
  ];

  var EMOJI = /^(\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*)\s*/u;

  function normalize(text) {
    return String(text).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'");
  }

  /** Returns { emoji, title } when the name starts with an emoji, else { icon, title }. */
  window.gageEventIcon = function (title) {
    var match = String(title).match(EMOJI);
    if (match) return { emoji: match[1], title: title.slice(match[0].length) || title };
    var text = normalize(title);
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][1].test(text)) return { icon: RULES[i][0], title: title };
    }
    return { icon: "calendar-event", title: title };
  };

  /** Ready-made HTML for the icon (title not included). */
  window.gageEventIconHtml = function (picked, className) {
    return picked.emoji
      ? '<span class="' + className + ' is-emoji" aria-hidden="true">' + picked.emoji + "</span>"
      : '<span class="' + className + '" aria-hidden="true"><i class="bi bi-' + picked.icon + '"></i></span>';
  };
})();
