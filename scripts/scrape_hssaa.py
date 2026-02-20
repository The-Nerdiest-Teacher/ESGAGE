"""
HSSAA Data Scraper
Fetches standings and scores for each league and saves them as JSON files.
Runs nightly via GitHub Actions.
"""

import json
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime

BASE_URL = "https://www.hssaa.ca"
OUTPUT_DIR = "assets/data/sports"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# ── League configuration ────────────────────────────────────────────────────
# Format: "filename-key": { leagueid, label, schoolid for scores }
# schoolid 12 = É.S. Gaétan-Gervais (used to highlight our school)
LEAGUES = {
    "basketball-filles-junior":  {"leagueid": 21, "label": "Basketball — Filles Junior",  "schoolid": 12},
    "basketball-filles-senior":  {"leagueid": 22, "label": "Basketball — Filles Senior",  "schoolid": 12},
    "basketball-garcons-junior": {"leagueid": 1,  "label": "Basketball — Garçons Junior", "schoolid": 12},
    "basketball-garcons-senior": {"leagueid": 2,  "label": "Basketball — Garçons Senior", "schoolid": 12},
    "volleyball-filles-junior":  {"leagueid": 3,  "label": "Volleyball — Filles Junior",  "schoolid": 12},
    "volleyball-filles-senior":  {"leagueid": 4,  "label": "Volleyball — Filles Senior",  "schoolid": 12},
    "volleyball-garcons-junior": {"leagueid": 25, "label": "Volleyball — Garçons Junior", "schoolid": 12},
    "volleyball-garcons-senior": {"leagueid": 26, "label": "Volleyball — Garçons Senior", "schoolid": 12},
    "soccer-filles-junior":      {"leagueid": 27, "label": "Soccer — Filles Junior",      "schoolid": 12},
    "soccer-filles-senior":      {"leagueid": 28, "label": "Soccer — Filles Senior",      "schoolid": 12},
    "soccer-garcons-junior":     {"leagueid": 29, "label": "Soccer — Garçons Junior",     "schoolid": 12},
    "soccer-garcons-senior":     {"leagueid": 30, "label": "Soccer — Garçons Senior",     "schoolid": 12},
}


def fetch(url):
    """Fetch a URL with retries."""
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            r.raise_for_status()
            return r.text
        except Exception as e:
            print(f"  Attempt {attempt + 1} failed for {url}: {e}")
    return None


def parse_standings(leagueid):
    """Parse the standings table for a given league."""
    url = f"{BASE_URL}/displayStandings.php?leagueid={leagueid}"
    html = fetch(url)
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    standings = []

    # Find all tables — HSSAA may have Tier 1 and Tier 2
    tables = soup.find_all("table")
    for table in tables:
        # Try to find a tier heading above the table
        tier = None
        prev = table.find_previous_sibling()
        while prev:
            text = prev.get_text(strip=True)
            if text:
                tier = text
                break
            prev = prev.find_previous_sibling()

        rows = table.find_all("tr")
        if len(rows) < 2:
            continue

        headers = [th.get_text(strip=True) for th in rows[0].find_all(["th", "td"])]
        if not headers or "School" not in " ".join(headers) and "GP" not in " ".join(headers):
            continue

        tier_data = {"tier": tier or "Classement", "rows": []}
        for row in rows[1:]:
            cells = [td.get_text(strip=True) for td in row.find_all("td")]
            if not cells or len(cells) < 3:
                continue
            tier_data["rows"].append(cells)

        if tier_data["rows"]:
            standings.append(tier_data)

    return standings


def parse_scores(leagueid, schoolid):
    """Parse the scores/schedule for a given league filtered by school."""
    url = f"{BASE_URL}/viewScores.php?leagueid={leagueid}&schoolid={schoolid}"
    html = fetch(url)
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    games = []

    rows = soup.find_all("tr")
    for row in rows:
        cells = [td.get_text(strip=True) for td in row.find_all("td")]
        if not cells or len(cells) < 3:
            continue
        games.append(cells)

    return games


def scrape_league(key, config):
    """Scrape standings and scores for one league and save to JSON."""
    leagueid  = config["leagueid"]
    schoolid  = config["schoolid"]
    label     = config["label"]

    print(f"Scraping: {label} (leagueid={leagueid})")

    standings = parse_standings(leagueid)
    scores    = parse_scores(leagueid, schoolid)

    data = {
        "label":     label,
        "leagueid":  leagueid,
        "schoolid":  schoolid,
        "updated":   datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "standings": standings,
        "scores":    scores,
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, f"{key}.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  ✓ Saved to {out_path} ({len(standings)} standing tables, {len(scores)} score rows)")


def main():
    print(f"HSSAA scraper starting — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n")
    for key, config in LEAGUES.items():
        scrape_league(key, config)
    print("\nAll done.")


if __name__ == "__main__":
    main()
