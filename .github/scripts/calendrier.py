"""
Copies the school's shared Outlook calendar into assets/data/events.json,
which the Calendrier page and the home page "À venir" read.

Run by .github/workflows/calendrier.yml. The calendar's published ICS link
is in the CALENDAR_ICS_URL setting of that workflow.
Events are typed in French only; the English pages show them as is.

Games are added automatically from the team pages' data (read only):
  - assets/data/sports/*.json (HSSAA schedule from Nick's browser extension)
  - the MATCHS list in equipes/*-<season>.html pages (e.g. 7e/8e volleyball)
Home and away games are both added; "home" says which (home = played at Gaétan-Gervais).
A game already typed in Outlook (same day, same sport and opponent) is not added twice.

Calendars people can subscribe to (Calendrier page, "S'abonner") are written too:
  - assets/data/calendriers/gage.ics: the whole calendar (Outlook events and games)
  - assets/data/calendriers/matchs.ics: all games
  - assets/data/calendriers/<team>.ics: one team's games, e.g. volleyball-garcons-senior.ics
  - assets/data/matchs-domicile.ics: home games only (the first one, kept at its old link)
"""

import datetime as dt
import json
import os
import re
import sys
import http.cookiejar
import time as timer
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

import icalendar
import recurring_ical_events

ZONE = ZoneInfo("America/Toronto")
ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "assets", "data", "events.json")
# Home games as a calendar Outlook can subscribe to (https://esgage.ca/assets/data/matchs-domicile.ics)
GAMES_ICS = os.path.join(ROOT, "assets", "data", "matchs-domicile.ics")
# The other calendars to subscribe to (whole calendar, all games, one per team)
FEEDS = os.path.join(ROOT, "assets", "data", "calendriers")
SITE = "https://esgage.ca"
# Game times seen in the HSSAA data. Once a game is played, its time is replaced by
# the score, so the time is remembered here to keep showing it on the calendar.
GAME_TIMES = os.path.join(ROOT, "assets", "data", "matchs-heures.json")
MAX_DESCRIPTION = 1200


def school_year_start(today):
    """August 1 of the current school year, so the whole year can be browsed."""
    year = today.year if today.month >= 8 else today.year - 1
    return dt.date(year, 8, 1)


def clean_description(text):
    text = (text or "").replace("\r\n", "\n").strip()
    # Drop the Teams/Outlook meeting block (starts with a long line of underscores)
    text = re.split(r"\n?_{10,}", text)[0].strip()
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:MAX_DESCRIPTION].strip()


def when(value, all_day):
    """All-day -> 'YYYY-MM-DD'; timed -> 'YYYY-MM-DDTHH:MM' in Toronto time."""
    if all_day:
        return value.isoformat() if not isinstance(value, dt.datetime) else value.date().isoformat()
    if value.tzinfo is None:
        value = value.replace(tzinfo=ZONE)
    return value.astimezone(ZONE).strftime("%Y-%m-%dT%H:%M")


def convert(ics_bytes, today):
    calendar = icalendar.Calendar.from_ical(ics_bytes)
    start = school_year_start(today)
    end = today + dt.timedelta(days=400)
    events = []

    for item in recurring_ical_events.of(calendar).between(start, end):
        if str(item.get("STATUS", "")).upper() == "CANCELLED":
            continue
        if str(item.get("CLASS", "PUBLIC")).upper() in ("PRIVATE", "CONFIDENTIAL"):
            continue

        title = str(item.get("SUMMARY", "")).strip()
        if not title:
            continue

        begin = item.decoded("DTSTART")
        all_day = not isinstance(begin, dt.datetime)
        if "DTEND" in item:
            finish = item.decoded("DTEND")
        elif "DURATION" in item:
            finish = begin + item.decoded("DURATION")
        else:
            finish = begin + dt.timedelta(days=1) if all_day else begin

        description = clean_description(str(item.get("DESCRIPTION", "")))

        event = {
            "title": title,
            "start": when(begin, all_day),
            "end": when(finish, all_day),  # all-day: the day after the last day, as in Outlook
            "allDay": all_day,
        }
        location = str(item.get("LOCATION", "")).strip()
        if location:
            event["location"] = location
        if description:
            event["description"] = description
        events.append(event)

    events.sort(key=lambda e: (e["start"], e["title"]))
    return events


# ── Games from the team pages ────────────────────────────────────────────

SPORT_NAMES = {"volleyball": "Volleyball", "basketball": "Basketball", "soccer": "Soccer"}
SPORT_WORDS = {"volleyball": r"volley|vb", "basketball": r"basket|bb", "soccer": r"soccer"}
GENDERS = {"filles": "filles", "garcons": "garçons"}
# 7e/8e games all start at 15 h 30 (Nick, 2026-10-27), unless a game has its own heure
DEFAULT_TIMES = {"78": "15:30"}
LEVELS = {"junior": "junior", "senior": "senior", "78": "7e/8e"}
MY_SCHOOL = re.compile(r"ga[eé]tan|gervais|\bgage\b", re.I)
FRENCH_MONTHS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet",
                 "aout", "septembre", "octobre", "novembre", "decembre"]
GENERIC_WORDS = {"high", "school", "secondary", "collegiate", "college", "catholic", "christian",
                 "ecole", "secondaire", "academy", "the", "and", "des", "les"}


def plain(text):
    """Lower case, no accents: 'Garçons Sénior' -> 'garcons senior'."""
    import unicodedata
    text = unicodedata.normalize("NFD", str(text).lower())
    return "".join(c for c in text if unicodedata.category(c) != "Mn").replace("’", "'")


def team_from_name(name):
    """'volleyball-garcons-senior' -> ('volleyball', 'garcons', 'senior') or None."""
    parts = name.split("-")
    if len(parts) < 3 or parts[0] not in SPORT_NAMES or parts[1] not in GENDERS or parts[2] not in LEVELS:
        return None
    return parts[0], parts[1], parts[2]


def team_label(team):
    sport, gender, level = team
    return "%s %s %s" % (SPORT_NAMES[sport], GENDERS[gender], LEVELS[level])


def team_page(team, today):
    """The current season's page for this team, if there is one."""
    year = today.year if today.month >= 8 else today.year - 1
    page = "equipes/%s-%d-%d.html" % ("-".join(team), year, year + 1)
    return page if os.path.exists(os.path.join(ROOT, page)) else None


def game_event(team, day, time, visitor, home, location, today):
    """A game as a calendar event; "home" is True when it is played at Gaétan-Gervais."""
    if MY_SCHOOL.search(home):
        opponent = visitor
    elif MY_SCHOOL.search(visitor):
        opponent = home
    else:
        return None  # not one of our games
    at_home = bool(MY_SCHOOL.search(location or home))
    event = {
        "title": "%s vs %s" % (team_label(team), opponent),
        "start": day.isoformat() + ("T" + time if time else ""),
        "allDay": not time,
        "game": True,
        "home": at_home,
        "team": "-".join(team),
        "opponent": opponent,
    }
    event["end"] = (day + dt.timedelta(days=1)).isoformat() if not time else event["start"]
    # Away: the place given in the HSSAA data, else the home team's school
    event["location"] = "Gaétan-Gervais" if at_home else (location or home)
    page = team_page(team, today)
    if page:
        event["url"] = "/" + page
    return event


def hssaa_games(today, known_times):
    """Games in assets/data/sports/*.json (written by the browser extension)."""
    games = []
    folder = os.path.join(ROOT, "assets", "data", "sports")
    for name in sorted(os.listdir(folder)):
        team = team_from_name(name[:-5]) if name.endswith(".json") else None
        if not team:
            continue
        try:
            with open(os.path.join(folder, name), encoding="utf-8") as f:
                rows = json.load(f).get("scores") or []
        except (OSError, ValueError) as error:
            print("Skipped %s: %s" % (name, error))
            continue
        day = None
        for i, row in enumerate(rows):
            if not row or not row[0] or row[0] == "Visitor" or re.match(r"(Location|Notes):", row[0]):
                continue
            if row[0] == "__DATE__":
                try:
                    day = dt.datetime.strptime(row[1].strip(), "%A, %B %d, %Y").date()
                except (IndexError, ValueError):
                    day = None
                continue
            if day is None or len(row) < 3:
                continue
            time = ""
            for cell in row[1:]:
                match = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)?$", (cell or "").strip(), re.I)
                if match:
                    hour = int(match.group(1)) % 12 if match.group(3) else int(match.group(1))
                    if (match.group(3) or "").upper() == "PM":
                        hour += 12
                    time = "%02d:%s" % (hour, match.group(2))
                    break
            cells = [c.strip() for c in row if (c or "").strip()]
            visitor, home = cells[0], cells[-1]
            key = "%s|%s|%s|%s" % (name[:-5], day.isoformat(), visitor, home)
            if time:
                known_times[key] = time
            else:
                time = known_times.get(key, "")
            location = ""
            if i + 1 < len(rows) and rows[i + 1] and str(rows[i + 1][0]).startswith("Location:"):
                location = rows[i + 1][0].split(":", 1)[1].strip()
            games.append(game_event(team, day, time, visitor, home, location, today))
    return games


def french_date(text):
    """'Mardi 13 octobre 2026' -> date(2026, 10, 13)."""
    match = re.search(r"(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})", plain(text))
    if not match or match.group(2) not in FRENCH_MONTHS:
        return None
    return dt.date(int(match.group(3)), FRENCH_MONTHS.index(match.group(2)) + 1, int(match.group(1)))


def page_games(today):
    """Games typed in a team page's MATCHS list (teams without HSSAA data)."""
    games = []
    folder = os.path.join(ROOT, "equipes")
    for name in sorted(os.listdir(folder)):
        match = re.match(r"(.+)-\d{4}-\d{4}\.html$", name)
        team = team_from_name(match.group(1)) if match else None
        if not team:
            continue
        with open(os.path.join(folder, name), encoding="utf-8") as f:
            html = f.read()
        block = re.search(r"var MATCHS\s*=\s*\[(.*?)\n\s*\];", html, re.S)
        if not block:
            continue
        for item in re.findall(r"\{[^{}]*\}", block.group(1)):
            fields = dict(re.findall(r"(\w+)\s*:\s*\"([^\"]*)\"", item))
            day = french_date(fields.get("date", ""))
            if not day or not fields.get("visiteur") or not fields.get("domicile"):
                continue
            time = DEFAULT_TIMES.get(team[2], "")
            heure = re.match(r"(\d{1,2})\s*[h:]\s*(\d{2})?", fields.get("heure", ""))
            if heure:
                time = "%02d:%s" % (int(heure.group(1)), heure.group(2) or "00")
            games.append(game_event(team, day, time, fields["visiteur"], fields["domicile"], "", today))
    return games


def same_game(game, event):
    """True when an Outlook event looks like this game (same day, sport, opponent)."""
    if event.get("game") or event["start"][:10] > game["start"][:10] or event["end"][:10] < game["start"][:10]:
        return False
    title = plain(event["title"])
    sport = plain(game["title"]).split()[0]
    if not re.search(r"\b(%s)" % SPORT_WORDS[sport], title):
        return False
    label = plain(game["title"])
    for words in (("filles", "garcons", "gars"), ("junior", "senior", "7e", "78")):
        said = [w for w in words if re.search(r"\b%s\b" % w, title)]
        if said and not any(w in label for w in said):
            return False
    names = [w for w in re.findall(r"[a-z]{3,}", plain(game["opponent"])) if w not in GENERIC_WORDS]
    return not names or any(re.search(r"\b%s" % w, title) for w in names)


def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def add_uids(events):
    """A lasting id for each event in the .ics calendars (date + name)."""
    seen = set()
    for e in events:
        uid = base = re.sub(r"[^a-z0-9]+", "-", plain("%s-%s" % (e["start"][:10], e["title"]))).strip("-")
        n = 2
        while uid in seen:
            uid, n = "%s-%d" % (base, n), n + 1
        seen.add(uid)
        e["uid"] = uid


def add_games(events, today):
    """Adds the games to the Outlook events; returns (events, all games)."""
    known_times = load_json(GAME_TIMES, {})
    games = [g for g in hssaa_games(today, known_times) + page_games(today) if g]
    text = json.dumps(dict(sorted(known_times.items())), ensure_ascii=False, indent=1) + "\n"
    if write_if_changed(GAME_TIMES, text):
        print("Updated the remembered game times.")
    added = 0
    for game in games:
        if any(same_game(game, e) for e in events):
            continue
        events.append(game)
        added += 1
    away = sum(1 for g in games if not g["home"])
    print("Games from the team pages: %d found (%d home, %d away), %d added (others are already in Outlook)."
          % (len(games), len(games) - away, away, added))
    for game in games:
        game.pop("opponent", None)
    events.sort(key=lambda e: (e["start"], e["title"]))
    games.sort(key=lambda e: (e["start"], e["title"]))
    return events, games


def ics_text(text):
    return str(text).replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def ics_calendar(name, events, marks=True):
    """Events as an .ics calendar to subscribe to. With marks, game names start with 🏠 (home) or 🚌 (away)."""
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//esgage.ca//Calendrier//FR",
             "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:" + ics_text(name),
             "X-WR-TIMEZONE:America/Toronto", "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
             "BEGIN:VTIMEZONE", "TZID:America/Toronto",
             "BEGIN:DAYLIGHT", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0400", "TZNAME:EDT",
             "DTSTART:19700308T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
             "BEGIN:STANDARD", "TZOFFSETFROM:-0400", "TZOFFSETTO:-0500", "TZNAME:EST",
             "DTSTART:19701101T020000", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
             "END:VTIMEZONE"]
    add_uids(events)
    for e in events:
        title = e["title"]
        notes = []
        if e.get("game"):
            if marks:
                title = ("🏠 " if e["home"] else "🚌 ") + title
            notes.append("Match à domicile" if e["home"] else "Match à l'extérieur")
        lines += ["BEGIN:VEVENT", "UID:%s@esgage.ca" % e["uid"], "DTSTAMP:20260801T000000Z",
                  "SUMMARY:" + ics_text(title)]
        if e.get("location"):
            lines.append("LOCATION:" + ics_text(e["location"]))
        if e["allDay"]:
            lines += ["DTSTART;VALUE=DATE:" + e["start"].replace("-", ""),
                      "DTEND;VALUE=DATE:" + e["end"].replace("-", "")]
        else:
            start = dt.datetime.strptime(e["start"], "%Y-%m-%dT%H:%M")
            lines.append("DTSTART;TZID=America/Toronto:" + start.strftime("%Y%m%dT%H%M00"))
            # Games last about 1 h 30; Outlook events keep their own end
            finish = start + dt.timedelta(hours=1, minutes=30) if e.get("game") else None
            if not finish and e.get("end", "") > e["start"]:
                finish = dt.datetime.strptime(e["end"], "%Y-%m-%dT%H:%M")
            if finish:
                lines.append("DTEND;TZID=America/Toronto:" + finish.strftime("%Y%m%dT%H%M00"))
        if e.get("url"):
            lines.append("URL:" + SITE + e["url"])
            notes.append("Page de l'équipe : " + SITE + e["url"])
        if e.get("description"):
            notes.append(e["description"])
        if notes:
            lines.append("DESCRIPTION:" + ics_text("\n".join(notes)))
        lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    # Lines longer than 75 bytes are folded, as the .ics format asks
    folded = []
    for line in lines:
        raw = line.encode("utf-8")
        while len(raw) > 75:
            cut = 75
            while (raw[cut] & 0xC0) == 0x80:
                cut -= 1
            folded.append(raw[:cut].decode("utf-8"))
            raw = b" " + raw[cut:]
        folded.append(raw.decode("utf-8"))
    return "\r\n".join(folded) + "\r\n"


def write_calendars(events, games):
    """Writes the .ics calendars; returns the teams that have one, for the Calendrier page."""
    os.makedirs(FEEDS, exist_ok=True)
    teams = sorted({g["team"] for g in games}, key=lambda t: team_label(team_from_name(t)))
    calendars = [(GAMES_ICS, "Matchs à domicile – GAGE", [g for g in games if g["home"]], False),
                 (os.path.join(FEEDS, "gage.ics"), "GAGE – Calendrier", events, True),
                 (os.path.join(FEEDS, "matchs.ics"), "GAGE – Matchs", games, True)]
    for team in teams:
        calendars.append((os.path.join(FEEDS, team + ".ics"), "GAGE – " + team_label(team_from_name(team)),
                          [g for g in games if g["team"] == team], True))
    for path, name, items, marks in calendars:
        if write_if_changed(path, ics_calendar(name, [dict(e) for e in items], marks)):
            print("Wrote %s (%d events)" % (os.path.relpath(path, ROOT), len(items)))
    return [{"id": t, "name": team_label(team_from_name(t))} for t in teams]


def write_if_changed(path, text):
    try:
        with open(path, encoding="utf-8", newline="") as f:
            if f.read() == text:
                return False
    except OSError:
        pass
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)
    return True


def download(url):
    """The .ics file, or None. Outlook redirects with cookies, so they are kept between hops."""
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    headers = {"User-Agent": "Mozilla/5.0 (esgage.ca calendar sync)", "Accept": "text/calendar, */*"}
    for attempt in range(3):
        try:
            with opener.open(urllib.request.Request(url, headers=headers), timeout=60) as response:
                ics = response.read()
            if b"BEGIN:VCALENDAR" in ics:
                return ics
            print("The link did not return a calendar (.ics).")
        except (urllib.error.URLError, OSError) as error:
            print("Download failed (try %d): %s" % (attempt + 1, error))
        timer.sleep(10)
    return None


def main():
    url = os.environ.get("CALENDAR_ICS_URL", "").strip()
    if not url:
        print("CALENDAR_ICS_URL is empty: nothing to do.")
        return
    if url.startswith("webcal://"):
        url = "https://" + url[len("webcal://"):]

    today = dt.datetime.now(ZONE).date()
    ics = download(url)
    if ics:
        print("Outlook sent %d event entries." % ics.count(b"BEGIN:VEVENT"))
        outlook = convert(ics, today)
    else:
        # Outlook didn't answer: keep its events from last time, still update the games
        print("::warning::Outlook calendar could not be downloaded; keeping its events from last time.")
        outlook = [e for e in load_json(OUT, {}).get("events", []) if not e.get("game")]
    events, games = add_games(outlook, today)
    teams = write_calendars(events, games)

    text = json.dumps({"events": events, "teams": teams}, ensure_ascii=False, indent=1) + "\n"
    if write_if_changed(OUT, text):
        print("Wrote %d events to %s" % (len(events), OUT))
    else:
        print("No change (%d events)." % len(events))


if __name__ == "__main__":
    main()
