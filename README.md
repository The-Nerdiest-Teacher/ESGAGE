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
assets/data/staff.json           Personnel page
assets/data/news.json            Nouvelles page
assets/data/events.json          Calendrier page and home "À venir" (copied from Outlook, don't edit)
.github/workflows/calendrier.yml Copies the shared Outlook calendar to events.json every 30 minutes
assets/data/sports/*.json        Standings and scores (updated by the browser extension)
assets/img/                      Images
assets/video/                    Home page drone video (720p for computers, 480p for phones)
```

## English version (`en/`)

The site is bilingual. Each main page has an English twin with the **same file name** in `en/` (`cours.html` → `en/cours.html`), and the FR/EN button in the menu jumps between the two. **Any change to a page needs the same change in its twin**: same blocks in the same order, only the words in English.

- **Paths in `en/` pages start with `/`** (`/assets/img/...`, `/en/contact.html`) because the files sit one folder down.
- **Menu and footer** have one file per language: `partials/header.html` / `header-en.html` and `partials/footer.html` / `footer-en.html`. Links in the English ones start with `/en/`.
- **New page**: make `page.html` and `en/page.html` (`<html lang="en">` on the English one). In each `<head>`, under the `canonical` line, paste the three `hreflang` lines from any other page and change the file name. They tell Google the two pages are translations of each other, and the FR/EN button uses them to find the twin. Add both pages to `sitemap.xml`.
- **Staff**: `staff.json` stays in French. Job titles and departments are translated by the `EN_TERMS` list at the top of `assets/js/staff.js`; a new title shows in French on the English page until it's added there.
- **News**: give each item in `news.json` a `titre_en`, `resume_en` and `categorie_en` too.
- **Fiertés Griffons** (home page): add the card to `index.html` and `en/index.html`.
- **Team pages** (`equipes/`) are **one file for both languages**: add `?lang=en` to the address for English (`/equipes/natation-2026-2027.html?lang=en`). `assets/js/team-lang.js` does the switch:
  - Text written in the HTML gets its English in a `data-en="..."` attribute on the same tag, e.g. `<h3 data-en="Grade 9 girls">9e année filles</h3>` (also on `<title>` and the `description` meta).
  - Text built by the page's script uses `tr("français", "English")`, e.g. `tr("Victoire", "Win")`.
  - French dates like "Mardi 13 octobre 2026" and cross-country places like "3e" are turned into English automatically, so `MATCHS`, `PLAYERS`, `REPLAYS` and results are typed once, as before.
  - Links to team pages from `en/` pages end with `?lang=en`.
- **Calendar events**: write the title as `Français | English` in Outlook (e.g. `Soirée des parents | Parents' night`). For a description, write the French, then a new line starting with `EN:` and the English. Without them, the English pages show the French.

## Common updates

**Calendar** — staff add events to the shared Outlook calendar. Every 30 minutes, the "Calendrier (Outlook)" job (Actions tab) copies it to `assets/data/events.json`, which the Calendrier page and the home page "À venir" read. To update right away: Actions → Calendrier (Outlook) → Run workflow. The calendar's published ICS link is `CALENDAR_ICS_URL` in `.github/workflows/calendrier.yml`. Private events are left out.

**Staff** — edit `assets/data/staff.json`. Each person has `name`, `category` (`admin`, `enseignant`, `aide`, `soutien` or `conciergerie`), `role`, `department`, `email` and `photo` (e.g. `assets/img/team/N. Chauvin.jpg`).

**News** — add an item to `assets/data/news.json`; the newest date shows first:

```json
{ "date": "2026-10-01", "categorie": "Vie scolaire", "titre": "Titre", "resume": "Une ou deux phrases.", "url": "calendrier.html", "image": "assets/img/..." }
```

`url` and `image` are optional. For the English page, add `"categorie_en"`, `"titre_en"` and `"resume_en"` to the same item. When the page has real news, add `https://esgage.ca/nouvelles.html` and `https://esgage.ca/en/nouvelles.html` back to `sitemap.xml` (and a link in both header partials if you want it in the menu).

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

## Archiving a season

1. `git mv` each outgoing team page into `equipes/archive/<saison>/` and add it to `equipes/archive/index.html`.
2. Copy the current `assets/data/sports/<sport>.json` to `assets/data/sports/archive/<saison>/<sport>-<saison>.json`, and point the archived page's `DATA_FILE` at that frozen copy.
3. Move any `-replays.json` file for that page into the same archive folder.
4. Build the new season's pages in `equipes/` (year-stamped filename, empty `PLAYERS` list until rosters are set) and update the links in `athletisme.html` and `en/athletisme.html` (English links end with `?lang=en`).

## Contact form

`contact.html` posts to Formspree (`formspree.io/f/mkovzpwe`), so it works on GitHub Pages without a server.

## Credits

Based on the Mentor template by BootstrapMade (https://bootstrapmade.com/license/).
