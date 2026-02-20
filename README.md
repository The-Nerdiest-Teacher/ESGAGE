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
  volleyball-garcons-senior.html   ← Team pages go here
  basketball-garcons-senior.html
  ...
```

## Adding a new sport league

1. Add the league ID to `scripts/scrape_hssaa.py` in the `LEAGUES` dictionary
2. Create a team page in `equipes/` using an existing page as a template
3. Update the `DATA_FILE` variable at the top of the script in the new page
4. Push to GitHub — the scraper will pick it up at the next run
