"""
HSSAA Data Scraper — Playwright edition
Uses a real headless Chromium browser to bypass 403 blocks.
Runs nightly via GitHub Actions.
"""

import json
import os
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

BASE_URL = "https://www.hssaa.ca"
OUTPUT_DIR = "assets/data/sports"

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


def parse_standings(html):
    soup = BeautifulSoup(html, "html.parser")
    standings = []
    tables = soup.find_all("table")
    for table in tables:
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
        if "School" not in " ".join(headers) and "GP" not in " ".join(headers):
            continue
        tier_data = {"tier": tier or "Classement", "rows": []}
        for row in rows[1:]:
            cells = [td.get_text(strip=True) for td in row.find_all("td")]
            if cells and len(cells) >= 3:
                tier_data["rows"].append(cells)
        if tier_data["rows"]:
            standings.append(tier_data)
    return standings


def parse_scores(html):
    soup = BeautifulSoup(html, "html.parser")
    games = []
    rows = soup.find_all("tr")
    for row in rows:
        cells = [td.get_text(strip=True) for td in row.find_all("td")]
        if cells and len(cells) >= 3:
            games.append(cells)
    return games


async def fetch_page(browser, url):
    page = await browser.new_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(1500)
        content = await page.content()
        return content
    except Exception as e:
        print(f"  Failed to fetch {url}: {e}")
        return None
    finally:
        await page.close()


async def scrape_all():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"HSSAA scraper starting — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        for key, config in LEAGUES.items():
            leagueid = config["leagueid"]
            schoolid = config["schoolid"]
            label    = config["label"]
            print(f"Scraping: {label} (leagueid={leagueid})")

            standings_html = await fetch_page(browser, f"{BASE_URL}/displayStandings.php?leagueid={leagueid}")
            scores_html    = await fetch_page(browser, f"{BASE_URL}/viewScores.php?leagueid={leagueid}&schoolid={schoolid}")

            standings = parse_standings(standings_html) if standings_html else []
            scores    = parse_scores(scores_html)       if scores_html    else []

            data = {
                "label":     label,
                "leagueid":  leagueid,
                "schoolid":  schoolid,
                "updated":   datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
                "standings": standings,
                "scores":    scores,
            }

            out_path = os.path.join(OUTPUT_DIR, f"{key}.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"  ✓ {len(standings)} standing table(s), {len(scores)} score row(s) → {out_path}")

        await browser.close()

    print("\nAll done.")


if __name__ == "__main__":
    asyncio.run(scrape_all())
