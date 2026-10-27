"""
Copies the school's shared Outlook calendar into assets/data/events.json,
which the Calendrier page and the home page "À venir" read.

Run by .github/workflows/calendrier.yml. The calendar's published ICS link
is in the CALENDAR_ICS_URL setting of that workflow.

Bilingual events (typed in Outlook):
  - Title: "Soirée des parents | Parents' night"  (French | English)
  - Description: French text, then a line starting with "EN:" and the English.
Without " | " or "EN:", the English page shows the French text.
"""

import datetime as dt
import json
import os
import re
import sys
import urllib.request
from zoneinfo import ZoneInfo

import icalendar
import recurring_ical_events

ZONE = ZoneInfo("America/Toronto")
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "data", "events.json")
MAX_DESCRIPTION = 1200


def school_year_start(today):
    """August 1 of the current school year, so the whole year can be browsed."""
    year = today.year if today.month >= 8 else today.year - 1
    return dt.date(year, 8, 1)


def split_lang(text, separator):
    """'Français | English' -> ('Français', 'English'); no separator -> (text, '')."""
    parts = re.split(separator, text, maxsplit=1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return text.strip(), ""


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

        title, title_en = split_lang(str(item.get("SUMMARY", "")), r"\s+\|\s+")
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

        description, description_en = split_lang(
            clean_description(str(item.get("DESCRIPTION", ""))), r"(?im)^\s*(?:EN|English)\s*:\s*"
        )

        event = {
            "title": title,
            "start": when(begin, all_day),
            "end": when(finish, all_day),  # all-day: the day after the last day, as in Outlook
            "allDay": all_day,
        }
        if title_en:
            event["title_en"] = title_en
        location = str(item.get("LOCATION", "")).strip()
        if location:
            event["location"] = location
        if description:
            event["description"] = description
        if description_en:
            event["description_en"] = description_en
        events.append(event)

    events.sort(key=lambda e: (e["start"], e["title"]))
    return events


def main():
    url = os.environ.get("CALENDAR_ICS_URL", "").strip()
    if not url:
        print("CALENDAR_ICS_URL is empty: nothing to do.")
        return
    if url.startswith("webcal://"):
        url = "https://" + url[len("webcal://"):]

    request = urllib.request.Request(url, headers={"User-Agent": "esgage.ca calendar sync"})
    with urllib.request.urlopen(request, timeout=60) as response:
        ics = response.read()
    if b"BEGIN:VCALENDAR" not in ics:
        sys.exit("The link did not return a calendar (.ics). events.json was left as is.")

    events = convert(ics, dt.datetime.now(ZONE).date())
    data = {"events": events}

    path = os.path.normpath(OUT)
    try:
        with open(path, encoding="utf-8") as f:
            if json.load(f) == data:
                print("No change (%d events)." % len(events))
                return
    except (OSError, ValueError):
        pass

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print("Wrote %d events to %s" % (len(events), path))


if __name__ == "__main__":
    main()
