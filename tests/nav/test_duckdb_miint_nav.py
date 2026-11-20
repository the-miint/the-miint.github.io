"""Tests for hooks/duckdb_miint_nav.py.

Each nav drift that froze the live site (sample_classifier, scikit_bio,
gene_prediction, sra-reader) was a page upstream added that the hand-written
nav here didn't list yet, and `mkdocs build --strict` refused to deploy. These
tests build a small site with the real hook and the same strict validation the
deploy uses, so they check what the deploy does: whether it ships.

Run from the repo root: python -m unittest discover -s tests/nav
"""

import importlib.util
import tempfile
import textwrap
import unittest
from pathlib import Path

from mkdocs.commands.build import build
from mkdocs.config import load_config
from mkdocs.exceptions import Abort

HOOK = Path(__file__).resolve().parents[2] / "hooks" / "duckdb_miint_nav.py"
_spec = importlib.util.spec_from_file_location("duckdb_miint_nav", HOOK)
hook = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(hook)

# Shaped like upstream's table_of_contents.md: prose links, task sections of
# linked items (one wrapped onto a second line), and a prose section whose
# list happens to start with a page link, as upstream's massql() item does.
TOC = """\
# MIINT Documentation

Start with [installation](installation.md), or choose a task below.

## Genomes

- [Gene prediction](gene_prediction.md) - Call prokaryotic genes,
  single-genome or metagenomic.

## Other

- [Utilities](utilities.md) - Sequence helpers.
- [Upstream docs](https://example.org/guide.md) - not a page here.

## Passing relations by name

Functions take a table by name. Two exceptions:

- [`gene_prediction()`](gene_prediction.md) reads its input directly.
- A CTE cannot be passed by name.
"""


class Site:
    """A minimal site using the real hook, validated as the deploy does."""

    def __init__(self, tmp, toc=TOC, pages=(), internals_listed=("architecture.md",), markers=True):
        root = Path(tmp)
        docs = root / "docs" / "duckdb-miint"
        (docs / "internals").mkdir(parents=True)
        (docs / "index.md").write_text(toc)
        for page in ("installation.md", "gene_prediction.md", "utilities.md",
                     "internals/architecture.md", *pages):
            (docs / page).write_text(f"# {Path(page).stem}\n")

        internals = [f"          - duckdb-miint/internals/{p}" for p in internals_listed]
        toc_marker = [f"      - {hook.TOC_MARKER}"] if markers else []
        internals_marker = [f"          - {hook.INTERNALS_MARKER}"] if markers else []
        (root / "mkdocs.yml").write_text("\n".join([
            "site_name: test",
            "theme: {name: mkdocs}",
            f"hooks: ['{HOOK}']",
            "validation: {nav: {omitted_files: warn}, links: {anchors: warn}}",
            "nav:",
            "  - duckdb-miint:",
            "      - duckdb-miint/index.md",
            "      - Installation: duckdb-miint/installation.md",
            *toc_marker,
            "      - Internals:",
            *internals,
            *internals_marker,
        ]) + "\n")
        self.config = load_config(str(root / "mkdocs.yml"), strict=True)

    def build(self):
        build(self.config)
        return self.config.nav[0]["duckdb-miint"]


class DuckdbMiintNavTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def test_page_upstream_adds_to_its_toc_ships_with_upstreams_heading_and_title(self):
        # The gene_prediction outage: the page is in upstream's table of
        # contents and nowhere in mkdocs.yml, and the strict build still passes.
        nav = Site(self.tmp.name).build()
        self.assertEqual(nav, [
            "duckdb-miint/index.md",
            {"Installation": "duckdb-miint/installation.md"},
            {"Genomes": [{"Gene prediction": "duckdb-miint/gene_prediction.md"}]},
            {"Other": [{"Utilities": "duckdb-miint/utilities.md"}]},
            {"Internals": ["duckdb-miint/internals/architecture.md"]},
        ])

    def test_internals_page_not_listed_here_is_appended_to_internals(self):
        # The sra-reader outage: internals pages are not in upstream's table of
        # contents, so a new one goes at the end of Internals, titled by its H1.
        nav = Site(self.tmp.name, pages=["internals/sra-reader.md"]).build()
        self.assertEqual(nav[-1], {"Internals": [
            "duckdb-miint/internals/architecture.md",
            "duckdb-miint/internals/sra-reader.md",
        ]})

    def test_page_in_neither_toc_nor_internals_still_fails_the_strict_build(self):
        # Nothing says where such a page belongs, so it must not ship unseen.
        site = Site(self.tmp.name, pages=["stray.md"])
        with self.assertLogs("mkdocs", "WARNING") as logs, self.assertRaises(Abort):
            site.build()
        self.assertIn("duckdb-miint/stray.md", "\n".join(logs.output))

    def test_toc_without_task_sections_fails_loudly(self):
        # If upstream reshapes its table of contents, say so, rather than
        # dropping every task page from the nav.
        site = Site(self.tmp.name, toc="# MIINT Documentation\n\nSee [utilities](utilities.md).\n")
        with self.assertLogs("mkdocs", "WARNING") as logs, self.assertRaises(Abort):
            site.build()
        self.assertIn("no task sections", "\n".join(logs.output))

    def test_nav_without_the_markers_fails_loudly(self):
        site = Site(self.tmp.name, markers=False)
        with self.assertLogs("mkdocs", "WARNING") as logs, self.assertRaises(Abort):
            site.build()
        self.assertIn(hook.TOC_MARKER, "\n".join(logs.output))


if __name__ == "__main__":
    unittest.main()
