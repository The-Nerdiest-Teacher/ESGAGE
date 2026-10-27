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
assets/video/                    Home page drone video (720p for computers, 480p for phones)
```

## Common updates

**Staff** — edit `assets/data/staff.json`. Each person has `name`, `category` (`admin`, `enseignant`, `aide`, `soutien` or `conciergerie`), `role`, `department`, `email` and `photo` (e.g. `assets/img/team/N. Chauvin.jpg`).

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
4. Build the new season's pages in `equipes/` (year-stamped filename, empty `PLAYERS` list until rosters are set) and update the links in `athletisme.html`.

## Contact form

`contact.html` posts to Formspree (`formspree.io/f/mkovzpwe`), so it works on GitHub Pages without a server.

## Credits

Based on the Mentor template by BootstrapMade (https://bootstrapmade.com/license/).
