# GAGE Site — GitHub Setup Guide

## First-time setup

### 1. Create a GitHub repository
1. Go to https://github.com/new
2. Name it `gage-site` (or anything you like)
3. Set it to **Public**
4. Click **Create repository**

### 2. Push your site files
In your terminal (or GitHub Desktop):
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gage-site.git
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Under "Branch", select `main` and folder `/` (root)
3. Click **Save**
4. Your site will be live at `https://YOUR-USERNAME.github.io/gage-site/`

### 4. Enable the scraper workflow
The scraper runs automatically at midnight (Eastern time) every day.
To trigger it manually at any time:
1. Go to your repo → **Actions**
2. Click **Scrape HSSAA Data**
3. Click **Run workflow** → **Run workflow**

---

## How it works

```
Every night at midnight:
  GitHub Action runs scripts/scrape_hssaa.py
    → Fetches standings & scores from hssaa.ca for all 12 leagues
    → Saves data to assets/data/sports/*.json
    → Commits and pushes the updated JSON files

Team pages (equipes/*.html):
    → Load their JSON file on page load
    → Render standings and scores automatically
```

## File structure

```
.github/
  workflows/
    scrape-hssaa.yml        ← The automation schedule

scripts/
  scrape_hssaa.py           ← The scraper (edit league IDs here)

assets/
  data/
    sports/
      volleyball-garcons-senior.json   ← Auto-updated nightly
      basketball-garcons-senior.json
      soccer-filles-junior.json
      ... (12 files total)

equipes/
  volleyball-garcons-senior-2026-2027.html   ← Team pages go here, named sport-genre-niveau-SAISON.html
  basketball-filles-senior-2026-2027.html
  archive/
    index.html                               ← Links to archived seasons
    2025-2026/                                ← Past seasons' pages + frozen data snapshots
  ...
```

## Adding a new sport league

1. Add the league ID to `scripts/scrape_hssaa.py` in the `LEAGUES` dictionary
2. Create a team page in `equipes/` using an existing page as a template
3. Update the `DATA_FILE` variable at the top of the script in the new page
4. Push to GitHub — the scraper will pick it up at the next run

## Archiving a season / starting a new one

Data files in `assets/data/sports/*.json` are **not** season-stamped — the
scraper overwrites them in place every night. So before a new season's
scraping starts:

1. `git mv` each outgoing team page into `equipes/archive/<saison>/`, and
   add it to `equipes/archive/index.html`.
2. Copy (don't move, if the sport continues) the current `assets/data/
   sports/<sport>.json` into `assets/data/sports/archive/<saison>/
   <sport>-<saison>.json`, and update the archived page's `DATA_FILE`
   constant to point at that frozen copy instead of the live file.
3. Move any `-replays.json` file for that page into the same archive
   folder (the scraper never touches replay files, so this is safe).
4. Comment out any league with no team this year in `scripts/
   scrape_hssaa.py`'s `LEAGUES` dict — no point scraping it.
5. Re-check every `leagueid` in `LEAGUES` against hssaa.ca: HSSAA
   re-issues league IDs each season, so last year's IDs will silently
   point at stale or closed leagues.
6. Build the new season's page(s) in `equipes/` (year-stamped filename,
   empty `PLAYERS` array until rosters are set) and update the links in
   `athletisme.html`.
