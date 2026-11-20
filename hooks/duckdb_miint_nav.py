"""Build the duckdb-miint task sections of the nav from upstream's table of contents.

The synced docs/duckdb-miint/index.md is duckdb-miint's table_of_contents.md
(scripts/sync-duckdb-miint-docs.sh renames it). Its "## Heading" sections of
"- [Title](page.md)" items replace TOC_MARKER in mkdocs.yml's nav, so a page
upstream adds to its table of contents ships under upstream's heading and title
with no nav edit here.

Internals pages aren't in that table of contents. Those under internals/ that
mkdocs.yml doesn't list replace INTERNALS_MARKER, titled by their own H1.

A synced page in neither place stays out of the nav, and `--strict` fails on it.
"""

import re
from pathlib import Path

from mkdocs.exceptions import PluginError

SECTION = "duckdb-miint"
TOC_MARKER = "(duckdb-miint table of contents)"
INTERNALS_MARKER = "(unlisted duckdb-miint internals pages)"

HEADING = re.compile(r"^## +(.+?)\s*$")
ITEM = re.compile(r"^- \[([^\]]+)\]\(([^)\s]+)\)")
# A page of the synced docs, not a URL (it has a ":") or an anchor.
PAGE = re.compile(r"^[^:#]+\.md$")


def toc_sections(toc):
    """The table of contents' task sections, as nav entries.

    A task section holds only linked items, their indented continuation lines,
    and blank lines. Any other line, such as prose, makes it a prose section,
    which is skipped even if one of its list items starts with a link. Items
    that link elsewhere than a page here (a URL, an anchor) are left out.
    """
    sections, items = [], None
    for line in toc.splitlines():
        if heading := HEADING.match(line):
            items = []
            sections.append((heading[1], items))
        elif items is None or not line.strip() or line[0].isspace():
            continue
        elif item := ITEM.match(line):
            if PAGE.match(item[2]):
                items.append({item[1]: f"{SECTION}/{item[2]}"})
        else:
            items.append(None)  # prose: not a task section
    return [{title: items} for title, items in sections if items and None not in items]


def splice(nav, marker, entries):
    """Replace the marker entry in nav, at any depth, with entries."""
    for i, entry in enumerate(nav):
        if entry == marker:
            nav[i:i + 1] = entries
            return True
        if isinstance(entry, dict):
            if any(isinstance(v, list) and splice(v, marker, entries) for v in entry.values()):
                return True
    return False


def listed(nav):
    """Every page path the nav names."""
    for entry in nav:
        for value in entry.values() if isinstance(entry, dict) else [entry]:
            if isinstance(value, list):
                yield from listed(value)
            else:
                yield value


def on_config(config):
    docs = Path(config.docs_dir) / SECTION
    toc_path = docs / "index.md"
    if not toc_path.is_file():
        raise PluginError(f"{toc_path} not found: run `make sync` first")
    sections = toc_sections(toc_path.read_text(encoding="utf-8"))
    if not sections:
        raise PluginError(
            f"{toc_path} has no task sections ('## Heading' then '- [Title](page.md)' items): "
            f"has upstream's table_of_contents.md changed shape?")

    nav = config.nav or []
    if not splice(nav, TOC_MARKER, sections):
        raise PluginError(f"mkdocs.yml's nav has no '{TOC_MARKER}' entry")
    have = set(listed(nav))
    internals = sorted(f"{SECTION}/internals/{p.name}" for p in docs.glob("internals/*.md"))
    if not splice(nav, INTERNALS_MARKER, [p for p in internals if p not in have]):
        raise PluginError(f"mkdocs.yml's nav has no '{INTERNALS_MARKER}' entry")
    return config
