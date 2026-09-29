# esgage.ca

Website of École secondaire Gaétan-Gervais. Plain HTML/CSS/JS, served by GitHub Pages straight from `main` (no build step). Anything merged to `main` is live within a minute or two.

## Where things live

```
index.html, cours.html, ...      Top-level pages
partials/header.html             Menu shown on every page
partials/footer.html             Footer shown on every page
equipes/                         One page per team and season (e.g. volleyball-garcons-senior-2026-2027.html)
equipes/archive/<saison>/        Past seasons' team pages
assets/css/main.css              Site-wide styles (colours, header, footer, dark mode)
assets/css/equipes.css           Styles shared by the team pages
assets/css/<page>.css            Styles for one page only
assets/js/include-partials.js    Loads the header and footer into each page
assets/js/main.js                Menu, dark mode button, scroll animations
assets/data/staff.json           Personnel page
assets/data/news.json            Nouvelles page
assets/data/sports/*.json        Standings and scores (updated by the browser extension)
assets/img/                      Images
```

## Common updates

**Staff** — edit `assets/data/staff.json`. Each person has `name`, `category` (`admin`, `enseignant` or `aide`), `role`, `department`, `email` and `photo` (e.g. `assets/img/team/N. Chauvin.jpg`).

**News** — add an item to `assets/data/news.json`; the newest date shows first:

```json
{ "date": "2026-10-01", "categorie": "Vie scolaire", "titre": "Titre", "resume": "Une ou deux phrases.", "url": "calendrier.html", "image": "assets/img/..." }
```

`url` and `image` are optional. When the page has real news, add `https://esgage.ca/nouvelles.html` back to `sitemap.xml` (and a link in `partials/header.html` if you want it in the menu).

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

**New team page** — copy an existing team page for the same sport, keep the `equipes.css` link, change the `PLAYERS`, `IMG_BASE` and `DATA_FILE` values, and add it to `sitemap.xml`. The Sports page (`athletisme.html`) shows "À venir" for any team button whose page doesn't exist yet, and links to it automatically once the file is there. Each page can add its own `<style>` block for a layout unique to that sport.

## Archiving a season

1. `git mv` each outgoing team page into `equipes/archive/<saison>/` and add it to `equipes/archive/index.html`.
2. Copy the current `assets/data/sports/<sport>.json` to `assets/data/sports/archive/<saison>/<sport>-<saison>.json`, and point the archived page's `DATA_FILE` at that frozen copy.
3. Move any `-replays.json` file for that page into the same archive folder.
4. Build the new season's pages in `equipes/` (year-stamped filename, empty `PLAYERS` list until rosters are set) and update the links in `athletisme.html`.

## Contact form

`contact.html` posts to Formspree (`formspree.io/f/mkovzpwe`), so it works on GitHub Pages without a server.

## Credits

Based on the Mentor template by BootstrapMade (https://bootstrapmade.com/license/).
