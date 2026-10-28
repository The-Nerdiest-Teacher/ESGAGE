"""
Builds assets/data/recherche.json, the list the site search (magnifier in the menu) looks in.

Run by .github/workflows/recherche.yml every time a page changes on main,
so nothing needs to be done by hand. To run it on a computer: python .github/scripts/recherche.py

What gets searched:
  - every page (French pages, en/ pages, equipes/ team pages), cut into sections at each <h2> and <h3>
  - team pages twice: in French, and in English using their data-en="..." text (?lang=en links)
  - staff names, titles and departments from assets/data/staff.json (English titles from EN_TERMS in staff.js)
  - news from assets/data/news.json
Pages with <meta name="robots" content="noindex"> (404, offline, archives, game images) are left out.
Text built by a page's script (schedules, scores, rosters) isn't read: only the HTML.
"""

import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets/data/recherche.json"
LOADING = re.compile(r"\b(Chargement|Loading)\s*(\.\.\.|…)", re.I)
SUFFIX = re.compile(r"\s*[|–—-]\s*(É|E)cole secondaire Gaétan-Gervais\s*$")

# Inside these tags the text is not page content (menus, scripts, buttons, drawings)
SKIP = {"script", "style", "noscript", "svg", "template", "iframe", "header", "footer",
        "nav", "button", "select", "option", "textarea", "form"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "param", "source", "track", "wbr"}
# Tags that sit inside a word or sentence; any other tag separates words ("SBI3U" "Biologie")
INLINE = {"a", "abbr", "b", "em", "i", "mark", "small", "strong", "sub", "sup", "u"}
HEADINGS = ("h1", "h2", "h3")
MAX_SECTION = 8000  # characters kept per section


class PageParser(HTMLParser):
    def __init__(self, english):
        super().__init__(convert_charrefs=True)
        self.english = english   # read data-en="..." instead of the French text (team pages)
        self.stack = []          # [tag, skips text, id, already gave its id to an h2]
        self.title = ""
        self.description = ""
        self.noindex = False
        self.in_title = False
        self.sections = []       # [heading, anchor, [text parts]]
        self.heading = None      # text parts of the <h1>/<h2> being read
        self.heading_anchor = ""
        self.new_section("", "")

    def new_section(self, heading, anchor):
        self.sections.append([heading, anchor, []])

    def skipping(self):
        return any(item[1] for item in self.stack)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            name = (a.get("name") or "").lower()
            if name == "description":
                self.description = a.get("data-en") if self.english and a.get("data-en") else a.get("content", "")
            if name == "robots" and "noindex" in (a.get("content") or ""):
                self.noindex = True
            return
        if tag == "title":
            self.in_title = True
            if self.english and a.get("data-en"):
                self.title = a["data-en"]
                self.in_title = False
            return
        if tag in VOID:
            if tag == "br":
                self.text(" ")
            return
        hidden = tag in SKIP or a.get("aria-hidden") == "true" or "hidden" in a
        en_text = self.english and a.get("data-en")
        if tag in HEADINGS and not self.skipping():
            self.heading = []
            anchor = a.get("id", "")
            if not anchor:
                # The closest wrapper with an id (e.g. <section id="horaire">) if this is its first title
                for item in reversed(self.stack):
                    if item[2]:
                        if not item[3]:
                            anchor = item[2]
                            item[3] = True
                        break
            self.heading_anchor = anchor
        # A part of a page that has no title of its own can be given one for the search:
        # <div id="panel-maths" data-search-title="Cours de mathématiques"> (cours.html)
        if a.get("data-search-title") and not hidden and not self.skipping():
            self.new_section(a["data-search-title"], a.get("id", ""))
        if en_text and not hidden and not self.skipping():
            self.text(" " + a["data-en"] + " ")
        self.stack.append([tag, hidden or bool(en_text), a.get("id", ""), False])
        if tag not in INLINE:
            self.text(" ")

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
            return
        if tag in VOID:
            return
        # Close up to the matching tag (forgives unclosed tags)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break
        if tag in HEADINGS and self.heading is not None:
            heading = clean("".join(self.heading))
            self.heading = None
            # The <h1> is the page title, already kept; each <h2> and <h3> starts a section
            if tag != "h1" and heading:
                self.new_section(heading, self.heading_anchor)
        if tag not in INLINE:
            self.text(" ")

    def handle_data(self, data):
        if self.in_title:
            self.title += data
            return
        if self.skipping():
            return
        self.text(data)

    def text(self, data):
        if self.heading is not None:
            self.heading.append(data)
        else:
            self.sections[-1][2].append(data)


def clean(text):
    return re.sub(r"\s+", " ", text).strip()


def short(text):
    if len(text) <= MAX_SECTION:
        return text
    return text[:MAX_SECTION].rsplit(" ", 1)[0] + " …"


def read_page(path, url, lang, english=False):
    parser = PageParser(english)
    parser.feed(path.read_text(encoding="utf-8"))
    if parser.noindex:
        return None
    title = SUFFIX.sub("", clean(parser.title))
    if path.name == "index.html":
        title = "Home" if lang == "en" else "Accueil"
    sections = []
    for heading, anchor, parts in parser.sections:
        text = clean(LOADING.sub(" ", "".join(parts)))
        if heading or text:
            sections.append({"h": heading, "a": anchor, "t": short(text)})
    return {"u": url, "l": lang, "ti": title, "d": clean(parser.description), "s": sections}


def staff_entries():
    staff = json.loads((ROOT / "assets/data/staff.json").read_text(encoding="utf-8"))
    js = (ROOT / "assets/js/staff.js").read_text(encoding="utf-8")
    block = re.search(r"EN_TERMS\s*=\s*\{(.*?)\};", js, re.S)
    en_terms = dict(re.findall(r'"([^"]+)"\s*:\s*"([^"]+)"', block.group(1))) if block else {}
    entries = []
    for person in staff:
        name = person.get("name", "").strip()
        if not name or "doe" in name.lower():
            continue  # placeholders
        email = person.get("email", "").lower()
        if "example." in email:
            email = ""
        for lang, url, label in (("fr", "/personnel.html", "Personnel"), ("en", "/en/personnel.html", "Staff")):
            words = [person.get("role", ""), person.get("department", "")]
            if lang == "en":
                words = [en_terms.get(w, w) for w in words]
            words = [w for w in dict.fromkeys(words) if w]
            entries.append({"u": url, "l": lang, "ti": name, "k": "staff", "p": label,
                            "d": " · ".join(words), "e": email, "s": []})
    return entries


def news_entries():
    path = ROOT / "assets/data/news.json"
    if not path.exists():
        return []
    entries = []
    for item in json.loads(path.read_text(encoding="utf-8")):
        if item.get("titre"):
            entries.append({"u": "/nouvelles.html", "l": "fr", "ti": item["titre"], "p": "Nouvelles",
                            "d": item.get("resume", ""), "s": []})
        if item.get("titre_en"):
            entries.append({"u": "/en/nouvelles.html", "l": "en", "ti": item["titre_en"], "p": "News",
                            "d": item.get("resume_en", ""), "s": []})
    return entries


def main():
    pages = []
    for path in sorted(ROOT.glob("*.html")):
        pages.append(read_page(path, "/" + path.name, "fr"))
    for path in sorted((ROOT / "en").glob("*.html")):
        pages.append(read_page(path, "/en/" + path.name, "en"))
    for path in sorted((ROOT / "equipes").glob("*.html")):
        url = "/equipes/" + path.name
        pages.append(read_page(path, url, "fr"))
        pages.append(read_page(path, url + "?lang=en", "en", english=True))
    pages = [p for p in pages if p]
    for page in pages:
        if page["u"].startswith("/equipes/"):
            page["k"] = "team"
    pages += staff_entries() + news_entries()

    OUT.write_text(json.dumps(pages, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(pages)} entries, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
