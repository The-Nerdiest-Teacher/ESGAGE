/**
 * Shared header loader (synchronous)
 * - Works on static hosting + VS Code Live Server
 * - Ensures header exists before template main.js initializes
 */
(function () {
  "use strict";

  function getBaseFromCurrentScript() {
    var script = document.currentScript;
    if (!script || !script.src) return "";
    // .../assets/js/include-header.js -> .../
    return script.src.replace(/assets\/js\/include-header\.js(\?.*)?$/, "");
  }

  function loadHeader() {
    var placeholder = document.getElementById("header-placeholder");
    if (!placeholder) return;

    var base = getBaseFromCurrentScript();
    var url = base ? (base + "partials/header.html") : "partials/header.html";

    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false); // synchronous
      xhr.send(null);

      if (xhr.status >= 200 && xhr.status < 300) {
        placeholder.outerHTML = xhr.responseText;
      } else {
        console.error("Header include failed:", xhr.status, url);
      }
    } catch (e) {
      console.error("Header include error:", e);
    }
  }

  loadHeader();
})();
