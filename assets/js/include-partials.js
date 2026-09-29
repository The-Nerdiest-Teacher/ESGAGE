/**
 * Shared header + footer loader
 * - Fetches partials/header.html and partials/footer.html without blocking the page
 * - main.js waits on window.gagePartialsReady before wiring up the menu
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

  function include(name) {
    var url = base + "partials/" + name + ".html";
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
})();
