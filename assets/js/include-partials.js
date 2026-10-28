/**
 * Shared header + footer loader
 * - Fetches partials/header.html and partials/footer.html without blocking the page
 * - English pages (<html lang="en">) get partials/header-en.html and partials/footer-en.html
 * - main.js waits on window.gagePartialsReady before wiring up the menu
 * - Then loads the site search (assets/js/recherche.js)
 * - Also loads the GoatCounter visitor stats (private: only Nick sees them,
 *   logged in at esgage.goatcounter.com). A page with data-no-stats on <html>
 *   is not counted.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var base = (script && script.src) ? script.src.replace(/assets\/js\/include-partials\.js(\?.*)?$/, "") : "";

  function domReady() {
    return new Promise(function (resolve) {
      if (document.readyState !== "loading") resolve();
      else document.addEventListener("DOMContentLoaded", resolve);
    });
  }

  var suffix = /^en/i.test(document.documentElement.lang) ? "-en" : "";

  function include(name) {
    var url = base + "partials/" + name + suffix + ".html";
    return Promise.all([fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + url);
      return r.text();
    }), domReady()]).then(function (res) {
      var placeholder = document.getElementById(name + "-placeholder");
      if (placeholder) placeholder.outerHTML = res[0];
    }).catch(function (e) {
      console.error("Include failed:", e);
    });
  }

  window.gagePartialsReady = Promise.all([include("header"), include("footer")]);

  // Site search (magnifier button in the menu): assets/js/recherche.js
  window.gagePartialsReady.then(function () {
    var s = document.createElement("script");
    s.src = base + "assets/js/recherche.js";
    document.body.appendChild(s);
  });

  // Visitor stats. Team pages are one file for both languages, so keep ?lang=en
  // in the counted path to see French and English visits apart.
  if (!document.documentElement.hasAttribute("data-no-stats")) {
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.path = function (p) {
      return /[?&]lang=en\b/.test(location.search) ? p + "?lang=en" : p;
    };
    var gc = document.createElement("script");
    gc.async = true;
    gc.src = "https://gc.zgo.at/count.js";
    gc.setAttribute("data-goatcounter", "https://esgage.goatcounter.com/count");
    document.head.appendChild(gc);
  }
})();
