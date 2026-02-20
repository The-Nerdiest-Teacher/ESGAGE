/**
 * Staff page renderer
 * Data source: assets/data/staff.json
 * Compatible with static hosting (GitHub/Cloudflare Pages) + VS Code Live Server
 */
(function () {
  "use strict";

  async function loadStaff() {
    const grid = document.getElementById("staff-grid");
    if (!grid) return;

    try {
      const res = await fetch("assets/data/staff.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load staff.json: " + res.status);
      const staff = await res.json();

      grid.innerHTML = staff.map((p, idx) => {
        const delay = ((idx % 6) + 1) * 100;
        const name = p.name || "";
        const dept = p.department || "";
        const role = p.role || "";
        const email = p.email || "";
        const photo = p.photo || "assets/img/team/team-1.jpg";

        const mailto = email ? `mailto:${email}` : "#";

        return `
<div class="col-lg-4 col-md-6 member" data-aos="fade-up" data-aos-delay="${delay}">
  <div class="member-img">
    <img src="${photo}" class="img-fluid" alt="${name}">
    <div class="social">
      ${email ? `<a href="${mailto}" aria-label="Email ${name}"><i class="bi bi-envelope"></i></a>` : ""}
    </div>
  </div>
  <div class="member-info text-center">
    <h4>${name}</h4>
    <span>${dept}</span>
    <p>${role}</p>
  </div>
</div>`;
      }).join("");

      // Re-init AOS if present
      if (window.AOS && typeof window.AOS.refresh === "function") {
        window.AOS.refresh();
      }
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="col-12"><p>Unable to load staff list.</p></div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", loadStaff);
})();
