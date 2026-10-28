# esgage.ca

Website of École secondaire Gaétan-Gervais. Plain HTML/CSS/JS, served by GitHub Pages straight from `main` (no build step). Anything merged to `main` is live within a minute or two.

## Where things live

```
index.html, cours.html, ...      Top-level pages (French)
en/                              English version: same file names (en/index.html, en/cours.html, ...)
partials/header.html             Menu shown on every page (header-en.html on English pages)
partials/footer.html             Footer shown on every page (footer-en.html on English pages)
equipes/                         One page per team and season (e.g. volleyball-garcons-senior-2026-2027.html)
equipes/archive/<saison>/        Past seasons' team pages
assets/css/main.css              Site-wide styles (colours, header, footer, dark mode)
assets/css/equipes.css           Styles shared by the team pages
assets/css/<page>.css            Styles for one page only
assets/js/include-partials.js    Loads the header and footer into each page
assets/js/main.js                Menu, FR/EN and dark mode buttons, scroll animations
assets/js/event-icons.js         Which icon each calendar event gets (word list)
assets/js/matchs.js              Teams list + reads played games (game images, home page wins)
assets/js/images-matchs.js       Draws the game images (equipes/images-matchs.html)
assets/js/aujourdhui.js          "Aujourd'hui à GAGE" page (today's events, Installer l'app card)
parents.html                     Coin des parents (bell schedule, absences, buses, links)
sw.js, manifest.webmanifest      Installable app (see "Application (PWA)" below); en/manifest.webmanifest for English
assets/data/staff.json           Personnel page
assets/data/news.json            Nouvelles page
assets/data/events.json          Calendrier page, home "À venir" and Coin des parents (copied from Outlook, don't edit)
.github/workflows/calendrier.yml Copies the shared Outlook calendar to events.json every 30 minutes
assets/js/recherche.js           Site search (magnifier in the menu)
assets/data/recherche.json       What the search looks in (rebuilt automatically, don't edit)
.github/workflows/recherche.yml  Rebuilds recherche.json whenever a page changes
assets/data/sports/*.json        Standings and scores (updated by the browser extension)
assets/img/                      Images
assets/video/                    Home page drone video (720p for computers, 480p for phones)
```

## English version (`en/`)

The site is bilingual. Each main page has an English twin with the **same file name** in `en/` (`cours.html` → `en/cours.html`), and the FR/EN button in the menu jumps between the two. **Any change to a page needs the same change in its twin**: same blocks in the same order, only the words in English.

- **Paths in `en/` pages start with `/`** (`/assets/img/...`, `/en/contact.html`) because the files sit one folder down.
- **Menu and footer** have one file per language: `partials/header.html` / `header-en.html` and `partials/footer.html` / `footer-en.html`. Links in the English ones start with `/en/`.
- **New page**: make `page.html` and `en/page.html` (`<html lang="en">` on the English one). In each `<head>`, under the `canonical` line, paste the three `hreflang` lines from any other page and change the file name. They tell Google the two pages are translations of each other, and the FR/EN button uses them to find the twin. Add both pages to `sitemap.xml`. Also keep the `manifest` and `theme-color` lines under `apple-touch-icon` (the English page points to `/en/manifest.webmanifest`).
- **Staff**: `staff.json` stays in French. Job titles and departments are translated by the `EN_TERMS` list at the top of `assets/js/staff.js`; a new title shows in French on the English page until it's added there.
- **News**: give each item in `news.json` a `titre_en`, `resume_en` and `categorie_en` too.
- **Fiertés Griffons** (home page): wins from the last 45 days are added automatically from the scores (`assets/js/fiertes.js`). Type only tournaments and other achievements, in `index.html` and `en/index.html`; typed cards always come first.
- **Team pages** (`equipes/`) are **one file for both languages**: add `?lang=en` to the address for English (`/equipes/natation-2026-2027.html?lang=en`). `assets/js/team-lang.js` does the switch:
  - Text written in the HTML gets its English in a `data-en="..."` attribute on the same tag, e.g. `<h3 data-en="Grade 9 girls">9e année filles</h3>` (also on `<title>` and the `description` meta).
  - Text built by the page's script uses `tr("français", "English")`, e.g. `tr("Victoire", "Win")`.
  - French dates like "Mardi 13 octobre 2026" and cross-country places like "3e" are turned into English automatically, so `MATCHS`, `PLAYERS`, `REPLAYS` and results are typed once, as before.
  - Links to team pages from `en/` pages end with `?lang=en`.
- **Calendar events** are written in French only in Outlook; the English pages show them as is.

## Common updates

**Calendar** — staff add events to the shared Outlook calendar. Every 30 minutes, the "Calendrier (Outlook)" job (Actions tab) copies it to `assets/data/events.json`, which the Calendrier page and the home page "À venir" read. To update right away: Actions → Calendrier (Outlook) → Run workflow. The calendar's published ICS link is `CALENDAR_ICS_URL` in `.github/workflows/calendrier.yml`. Private events are left out.

**Games are added automatically** from the team pages: the HSSAA schedule in `assets/data/sports/*.json` and the `MATCHS` list of pages like the 7e/8e volleyball one (7e/8e games start at 15 h 30; add `heure: "16 h 45"` to a game there if it starts at another time). Home and away games are both added: a green house means home (at Gaétan-Gervais), a gold bus means away (the place comes from the HSSAA "Location", or the home team's school). If a game is also typed in Outlook (same day, sport and opponent, e.g. "VB Garçons Senior vs Acton"), it shows once, as typed in Outlook. Each game links to its team page. Once a game is played, HSSAA replaces its time with the score, so the times are remembered in `assets/data/matchs-heures.json` (updated by the same job, don't edit).

**Calendars to subscribe to**: the same job writes `.ics` calendars that phones, Google Calendar and Outlook can subscribe to. They update themselves (each app checks a few times a day). The "S'abonner" panel under the Calendrier page (`calendrier.html#s-abonner`) has the buttons for each app and the links:
- `assets/data/calendriers/gage.ics`: the whole calendar (Outlook events and all games)
- `assets/data/calendriers/matchs.ics`: all games
- `assets/data/calendriers/<team>.ics`: one team, e.g. `volleyball-garcons-senior.ics` (a team gets one as soon as it has games)
- `assets/data/matchs-domicile.ics`: home games only (the first one, kept at its old link)

In those calendars, game names start with 🏠 (home) or 🚌 (away). In Outlook by hand: Calendar → Add calendar → Subscribe from web, paste `https://esgage.ca/` followed by one of the paths above.

Each event gets an icon picked from words in its name. Sports get their emoji ("volleyball" or "VB" → 🏐, "basket" or "BB" → 🏀, "soccer" → ⚽, "course de fond" → 🏃, ...); other events get an icon ("photo" → camera, "tournoi" → trophy, "journée pédagogique" → crossed-out calendar, ...). The word list is at the top of `assets/js/event-icons.js`. To choose the icon yourself, start the event name with an emoji in Outlook (`🎃 Danse d'Halloween`).

**Open house banner** — open `assets/js/portes-ouvertes.js` and fill in the lines at the top (keep the quotes and the commas):

```js
date: "2026-12-03",   // year-month-day
debut: "18:00",       // start time (24 h)
fin: "20:00",         // end time
lien: "",             // optional link for a "Détails" button
JOURS_AVANT: 28       // how many days before the night the banner appears
```

That's the only place to change, for both the French and English home pages. While `date` is `""` the banner stays hidden. It appears on its own `JOURS_AVANT` days before (with a countdown, an "Ajouter à mon calendrier" button and a gold "Portes ouvertes" button at the top of the page) and disappears on its own once the end time has passed. Next year, just change the date. Also add the night to the Outlook calendar so it shows in "À venir" and the Calendrier page.

**Staff** — edit `assets/data/staff.json`. Each person has `name`, `category` (`admin`, `enseignant`, `aide`, `soutien` or `conciergerie`), `role`, `department`, `email` and `photo` (e.g. `assets/img/team/N. Chauvin.jpg`).

**News** — add an item to `assets/data/news.json`; the newest date shows first:

```json
{ "date": "2026-10-01", "categorie": "Vie scolaire", "titre": "Titre", "resume": "Une ou deux phrases.", "url": "calendrier.html", "image": "assets/img/..." }
```

`url` and `image` are optional. For the English page, add `"categorie_en"`, `"titre_en"` and `"resume_en"` to the same item. When the page has real news, add `https://esgage.ca/nouvelles.html` and `https://esgage.ca/en/nouvelles.html` back to `sitemap.xml` (and a link in both header partials if you want it in the menu).

**Game images for Instagram** — `equipes/images-matchs.html` (English: add `?lang=en`) makes one image per game Gaétan-Gervais has played, newest first: "Victoire !" for a win, "Résultat final" otherwise, set scores for volleyball. Pick a team, pick Publication (4:5) or Story (9:16), then Télécharger (or Partager on a phone). Nothing to type: it reads the same data as the team pages (the extension's files and the `MATCHS` lists) and updates itself. The page isn't in the menu or in Google, so bookmark it. `?equipe=volleyball-garcons-senior` opens it on one team. The list of teams is `EQUIPES` at the top of `assets/js/matchs.js` (shared with the home page wins): each new season, change the year in the `page` links; a new team page with a `MATCHS` list needs one line there. The drawing code is in `assets/js/images-matchs.js`.

**Palmarès (team records)** — `palmares.html` and `en/palmares.html` (in the Vie étudiante menu and under the Sports page) build themselves from the same data as the team pages, read only: each team's season record and standing, playoff games, a card for a first place in a finished season, a playoff final (Champions / Finalistes) or a lost semi-final, and the 1st to 3rd places on the cross-country pages. Only tournaments are typed by hand: add a line to `EXPLOITS` at the top of `assets/js/palmares.js` (French and English in the same line, for both pages), as well as the tournament card on the team page. Titles from before 2025-2026 go in the same list (the "Avant 2025-2026" box disappears once one is there). When a season is archived, add it to `SAISONS` in that file with its archive files.

**Players on a team page** — edit the `PLAYERS` list near the bottom of the team's page in `equipes/`. Photos go in the folder named by `IMG_BASE` on that page.

Player photos should be **WebP, about 600×750**. Full-size PNGs are ~1.3 MB each; WebP at that size is ~50 KB and looks the same on the card. To convert a folder (needs Python and `pip install pillow`):

```bash
python3 -c "
import sys, glob
from PIL import Image
for p in glob.glob(sys.argv[1] + '/*.png'):
    im = Image.open(p); im.thumbnail((600, 750)); im.save(p[:-4] + '.webp', quality=82)
" assets/img/sportsplayers/2026-2027/VBGS
```

Online converters (e.g. squoosh.app) work too.

**Game replays** — add a line to the `REPLAYS` list on the team page; the comments above it show the format.

**New team page** — copy an existing team page for the same sport, keep the `equipes.css` and `team-lang.js` lines in the `<head>`, change the `PLAYERS`, `IMG_BASE` and `DATA_FILE` values, update the `data-en` texts, and add it to `sitemap.xml` twice (once more with `?lang=en` at the end). The Sports pages (`athletisme.html` and `en/athletisme.html`) show "À venir" / "Coming soon" for any team button whose page doesn't exist yet, and link to it automatically once the file is there. Each page can add its own `<style>` block for a layout unique to that sport.

**Home page video** — `index.html` plays `assets/video/drone-720.mp4` on computers and `drone-480.mp4` on phones, with `assets/img/hero-drone.webp` shown while it loads (and instead of the video for visitors with data saver or "reduce motion" on). To swap in a new video, export it without sound and convert it with [ffmpeg](https://ffmpeg.org):

```bash
ffmpeg -i nouvelle-video.mp4 -an -vf "scale=1280:720,hqdn3d=2:2:4:4" -c:v libx264 -preset slow -crf 34 -pix_fmt yuv420p -movflags +faststart assets/video/drone-720.mp4
ffmpeg -i nouvelle-video.mp4 -an -vf "scale=854:480,hqdn3d=2:2:4:4" -c:v libx264 -preset slow -crf 36 -pix_fmt yuv420p -movflags +faststart assets/video/drone-480.mp4
ffmpeg -i nouvelle-video.mp4 -frames:v 1 -vf scale=1280:720 -quality 62 assets/img/hero-drone.webp
```

Keep the files small (about 10 MB and 5 MB for two minutes): every visitor downloads the video as it plays.

## Application (PWA)

The site can be installed on a phone like an app (free, no app store). It opens on **Aujourd'hui à GAGE** (`aujourdhui.html`, or `en/aujourdhui.html` when installed from an English page), which shows today's events and games from `events.json` and the next few events.

- **Install**: iPhone/iPad, in Safari: Share → *Sur l'écran d'accueil* / *Add to Home Screen*. Android, in Chrome: the *Installer l'app* button on the Aujourd'hui page, or menu ⋮ → *Installer l'application* / *Ajouter à l'écran d'accueil*.
- **Name, colours, shortcuts**: `manifest.webmanifest` and `en/manifest.webmanifest`. Icons are in `assets/img/app/` (the `maskable` one keeps the griffon inside the middle 80% so Android can crop it to a circle).
- **`sw.js`** (service worker) always loads pages, scripts, styles and data (events, scores) **from the network first**, so nobody keeps an old version. The saved copy is only used offline, and `offline.html` / `en/offline.html` show for pages never opened before. Images and `assets/vendor/` are shown from the saved copy and refreshed in the background. Videos aren't saved. If you change the `PRECACHE` list or the rules in `sw.js`, change `VERSION` too (`gage-v2`, ...).
- **Emergency off switch**: if the app ever misbehaves, replace everything in `sw.js` with the lines below and merge. Every visitor's browser removes the saved copies and goes back to plain website mode on their next visit.

```js
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.map(function (n) { return caches.delete(n); })); })
    .then(function () { return self.registration.unregister(); }));
});
```

## Accessibility (AODA)

The site aims for WCAG 2.1 AA, the level Ontario's AODA asks for. What is already built in:
a "Skip to main content" link, a keyboard-friendly menu (Tab, Enter, Escape), a visible focus outline,
a pause button on the home video, no animations for visitors who ask their device for less motion,
and a calendar that works with the keyboard and screen readers.

When you add or change a page:
- Every photo needs `alt="..."` describing it (a student's photo: their name; a decorative icon: `alt=""`).
- Keep heading levels in order: one `<h1>` per page, then `<h2>` for sections, `<h3>` inside them.
- Link text should say where it goes ("Calendrier", not "cliquez ici").
- Don't use colour alone to show something (the Victoire/Défaite badges also have words).
- Embedded videos (`<iframe>`) need a `title="..."`.

## Site search

The magnifier button in the menu opens a search box over the page (shortcut: `/` or Ctrl+K). It finds pages, sections, courses, clubs, team pages and staff (name, title, email), in French on French pages and in English on English pages. Accents and capitals don't matter, and the start of a word is enough (`volley` finds Volleyball).

**Nothing to do by hand.** Every time a page, `staff.json` or `news.json` changes on `main`, the "Recherche (index)" action reruns `.github/scripts/recherche.py`, which reads the pages and saves `assets/data/recherche.json`. New pages show up in the search a minute or two after they go live.

- Each `<h2>` and `<h3>` starts a section, and a result links to the section's `id` when it (or the `<section>` around it) has one.
- Text a page's script writes (game schedules, scores, rosters) isn't searched, only what is typed in the HTML. Team pages are found by their title and description.
- A part of a page with no heading can get a name in the results with `data-search-title`, e.g. the subject tabs in `cours.html`: `<div class="subject-panel" id="panel-maths" data-search-title="Mathématiques">`. A link to `cours.html#panel-maths` opens that tab.
- Pages with `<meta name="robots" content="noindex">` (404, offline, archives, game images) are left out.
- The suggestion buttons under the empty box ("Essayez : Horaire, Personnel…") are the `ideas` lists at the top of `assets/js/recherche.js`.

## Visitor stats (GoatCounter)

Page views are counted by [GoatCounter](https://www.goatcounter.com) (no cookies, no personal data). The stats are private: log in at **esgage.goatcounter.com** to see them. Nothing is shown on the site.

- The counter is added by `assets/js/include-partials.js`, so every page that loads the header and footer is counted automatically, including new pages.
- English team pages show up as `…html?lang=en` so French and English visits stay apart.
- To leave a page out (utility pages like `equipes/images-matchs.html`), add `data-no-stats` to its `<html>` tag.
- The service worker never saves the counter script (it only saves files from esgage.ca).

## Archiving a season

1. `git mv` each outgoing team page into `equipes/archive/<saison>/` and add it to `equipes/archive/index.html`.
2. Copy the current `assets/data/sports/<sport>.json` to `assets/data/sports/archive/<saison>/<sport>-<saison>.json`, and point the archived page's `DATA_FILE` at that frozen copy.
3. Move any `-replays.json` file for that page into the same archive folder.
4. Add the season to `SAISONS` in `assets/js/palmares.js` (archived JSON and page) so the Palmarès keeps it.
5. Build the new season's pages in `equipes/` (year-stamped filename, empty `PLAYERS` list until rosters are set) and update the links in `athletisme.html` and `en/athletisme.html` (English links end with `?lang=en`).

## Contact form

`contact.html` posts to Formspree (`formspree.io/f/mkovzpwe`), so it works on GitHub Pages without a server.

## Credits

Based on the Mentor template by BootstrapMade (https://bootstrapmade.com/license/).
