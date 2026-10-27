/**
 * Nouvelles page renderer
 * Data source: assets/data/news.json
 * Each item: { "date": "2026-10-01", "categorie": "...", "titre": "...", "resume": "...", "url": "..." (optional), "image": "..." (optional) }
 * For the English page (/en/nouvelles.html), add "categorie_en", "titre_en" and "resume_en" to each item.
 * An item without them shows its French text there.
 */
(function () {
  "use strict";

  const EN = /^en/i.test(document.documentElement.lang);

  // The English text when on the English page and it exists, otherwise the French
  function field(n, name) {
    return (EN && n[name + "_en"]) || n[name];
  }

  const container = document.getElementById("news-container");
  if (!container) return;

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(iso) {
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return escapeHtml(iso);
    return d.toLocaleDateString(EN ? "en-CA" : "fr-CA", { year: "numeric", month: "long", day: "numeric" });
  }

  function card(n) {
    const titre = field(n, "titre");
    const resume = field(n, "resume");
    const categorie = field(n, "categorie");
    let image = n.image || "";
    if (image && !/^(\/|https?:)/.test(image)) image = "/" + image;
    image = image
      ? `<img src="${escapeHtml(image)}" class="card-img-top" alt="" loading="lazy">`
      : "";
    const link = n.url && n.url !== "#"
      ? `<a href="${escapeHtml(n.url)}" class="stretched-link" aria-label="${escapeHtml(titre)}"></a>`
      : "";
    return `
<div class="col-lg-4 col-md-6">
  <div class="card h-100">
    ${image}
    <div class="card-body">
      <p class="small text-muted mb-1">${formatDate(n.date)}${categorie ? " · " + escapeHtml(categorie) : ""}</p>
      <h3 class="h5 card-title">${escapeHtml(titre)}</h3>
      <p class="card-text">${escapeHtml(resume)}</p>
      ${link}
    </div>
  </div>
</div>`;
  }

  fetch("/assets/data/news.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (items) {
      if (!items.length) {
        container.innerHTML = '<p class="text-center">' + (EN ? "No news for now." : "Aucune nouvelle pour le moment.") + "</p>";
        return;
      }
      items.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      container.innerHTML = items.map(card).join("");
    })
    .catch(function (e) {
      console.error(e);
      container.innerHTML = '<p class="text-center">' + (EN ? "Unable to load the news." : "Impossible de charger les nouvelles.") + "</p>";
    });
})();
