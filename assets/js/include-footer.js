(function () {
  "use strict";

  function getBaseFromCurrentScript() {
    var script = document.currentScript;
    if (!script || !script.src) return "";
    return script.src.replace(/assets\/js\/include-footer\.js(\?.*)?$/, "");
  }

  function loadFooter() {
    var placeholder = document.getElementById("footer-placeholder");
    if (!placeholder) return;

    var base = getBaseFromCurrentScript();
    var url = base ? (base + "partials/footer.html") : "partials/footer.html";

    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);

      if (xhr.status >= 200 && xhr.status < 300) {
        placeholder.outerHTML = xhr.responseText;
      } else {
        console.error("Footer include failed:", xhr.status);
      }
    } catch (e) {
      console.error("Footer include error:", e);
    }
  }

  loadFooter();
})();