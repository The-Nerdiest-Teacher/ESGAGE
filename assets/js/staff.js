/**
 * Staff page renderer
 * Data source: assets/data/staff.json
 * Compatible with static hosting (GitHub/Cloudflare Pages) + VS Code Live Server
 */
(function () {
  "use strict";

  // English pages (/en/personnel.html) show English headings and job titles.
  // To translate a new title or department, add it to EN_TERMS; anything missing stays in French.
  const EN = /^en/i.test(document.documentElement.lang);
  const EN_TERMS = {
    "Direction": "Principal",
    "Direction adjointe": "Vice-principal",
    "Secrétaire senior": "Senior secretary",
    "Secrétaire": "Secretary",
    "Administration": "Administration",
    "Aide-enseignant(e)": "Educational assistant",
    "Concierge en chef": "Head custodian",
    "Concierge": "Custodian",
    "Animateur culturel": "Cultural facilitator",
    "Bibliotechnicienne": "Library technician",
    "CP ÉSB": "CP ÉSB",
    "Technicien en informatique": "IT technician",
    "Travailleuse sociale": "Social worker",
    "Arts et français": "Arts and French",
    "COOP": "Co-op",
    "English": "English",
    "English 7/8": "English 7/8",
    "English et Études sociales": "English and Social studies",
    "Français": "French",
    "Français 7/8": "French 7/8",
    "Informatique": "Computer science",
    "Mathématiques": "Math",
    "Mathématiques 7/8": "Math 7/8",
    "Mathématiques et musculation": "Math and Weight training",
    "Mathématiques et sciences 7/8": "Math and Science 7/8",
    "Orientation": "Guidance",
    "Sciences": "Science",
    "Sciences 7/8": "Science 7/8",
    "Technologie": "Technology",
    "secondaire": "Secondary",
    "Éducation physique 7/8": "Physical education 7/8",
    "Éducation spécialisée 7/8": "Special education 7/8",
    "Éducation spécialisée secondaire": "Special education (secondary)"
  };

  function tr(text) {
    return EN && EN_TERMS[text] ? EN_TERMS[text] : text;
  }

  async function loadStaff() {
    const grid = document.getElementById("staff-grid");
    if (!grid) return;

    try {
      const res = await fetch("/assets/data/staff.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load staff.json: " + res.status);
      const staff = await res.json();

      // Groups are shown in this order, each with its own heading.
      // Staff without a known "category" go in a final "Autre" group.
      // "detail" is the one line shown under each name; the other field
      // would only repeat the heading (e.g. "Enseignante" under Personnel enseignant).
      const groups = [
        { key: "admin", title: EN ? "Administration" : "Administration", detail: "role" },
        { key: "enseignant", title: EN ? "Teaching staff" : "Personnel enseignant", detail: "department" },
        { key: "aide", title: EN ? "Educational assistants" : "Aides-enseignants", detail: "department" },
        { key: "soutien", title: EN ? "Support staff" : "Personnel de soutien", detail: "role" },
        { key: "conciergerie", title: EN ? "Custodial staff" : "Personnel de conciergerie", detail: "role" }
      ];
      const knownKeys = groups.map((g) => g.key);
      groups.push({ key: "autre", title: EN ? "Other" : "Autre", detail: "role", match: (p) => !knownKeys.includes(p.category) });

      grid.innerHTML = groups.map((g) => {
        const members = staff.filter(g.match || ((p) => p.category === g.key));
        if (!members.length) return "";

        return `
<div class="col-12 staff-group-heading" data-aos="fade-up">
  <h2>${g.title}</h2>
</div>` + members.map((p, idx) => renderMember(p, idx, g.detail)).join("");
      }).join("");

      // Re-init AOS if present
      if (window.AOS && typeof window.AOS.refresh === "function") {
        window.AOS.refresh();
      }
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div class="col-12"><p>${EN ? "Unable to load the staff list." : "Impossible de charger la liste du personnel."}</p></div>`;
    }
  }

  function renderMember(p, idx, detailField) {
    const delay = ((idx % 6) + 1) * 100;
    const name = p.name || "";
    const detail = tr(p[detailField] || "");
    const email = p.email || "";
    // Photo paths in staff.json start at the site root, so add "/" for pages in /en/
    let photo = p.photo || "assets/img/team/team-1.jpg";
    if (!/^(\/|https?:)/.test(photo)) photo = "/" + photo;

    const mailto = email ? `mailto:${email}` : "#";

    return `
<div class="col-lg-4 col-md-6 member" data-aos="fade-up" data-aos-delay="${delay}">
  <div class="member-img">
    <img src="${photo}" class="img-fluid" alt="${name}" width="640" height="640" loading="lazy" onload="if (this.naturalHeight > this.naturalWidth) this.classList.add('is-portrait')">
    <div class="social">
      ${email ? `<a href="${mailto}" aria-label="${EN ? "Email" : "Écrire à"} ${name}"><i class="bi bi-envelope"></i></a>` : ""}
    </div>
  </div>
  <div class="member-info text-center">
    <h3>${name}</h3>
    ${detail ? `<p>${detail}</p>` : ""}
  </div>
</div>`;
  }

  document.addEventListener("DOMContentLoaded", loadStaff);
})();
