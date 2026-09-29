/**
 * Nouvelles page renderer
 * Data source: assets/data/news.json
 * Each item: { "date": "2026-10-01", "categorie": "...", "titre": "...", "resume": "...", "url": "..." (optional), "image": "..." (optional) }
 */
(function () {
  "use strict";

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
    return d.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  }

  function card(n) {
    const image = n.image
      ? `<img src="${escapeHtml(n.image)}" class="card-img-top" alt="" loading="lazy">`
      : "";
    const link = n.url && n.url !== "#"
      ? `<a href="${escapeHtml(n.url)}" class="stretched-link" aria-label="${escapeHtml(n.titre)}"></a>`
      : "";
    return `
<div class="col-lg-4 col-md-6">
  <div class="card h-100">
    ${image}
    <div class="card-body">
      <p class="small text-muted mb-1">${formatDate(n.date)}${n.categorie ? " · " + escapeHtml(n.categorie) : ""}</p>
      <h3 class="h5 card-title">${escapeHtml(n.titre)}</h3>
      <p class="card-text">${escapeHtml(n.resume)}</p>
      ${link}
    </div>
  </div>
</div>`;
  }

  fetch("assets/data/news.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (items) {
      if (!items.length) {
        container.innerHTML = '<p class="text-center">Aucune nouvelle pour le moment.</p>';
        return;
      }
      items.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
      container.innerHTML = items.map(card).join("");
    })
    .catch(function (e) {
      console.error(e);
      container.innerHTML = '<p class="text-center">Impossible de charger les nouvelles.</p>';
    });
})();
