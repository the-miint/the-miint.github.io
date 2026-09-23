# the-miint.github.io

The umbrella website for [the MIINT project](https://github.com/the-miint) —
served at **https://the-miint.github.io/**.

Built with [MkDocs](https://www.mkdocs.org/) +
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

## How it works

This repo holds the **site shell**: the landing page, the Qiita overview, the
in-browser [Playground](https://the-miint.github.io/playground/) (DuckDB-Wasm
plus the miint extension, in `docs/playground.md`), the theme, and the brand.
It does **not** hold the duckdb-miint documentation.

Each project's docs are the **single source of truth in that project's own
repo**, beside the code they document. They are pulled in at build time, so the
site can never silently drift from the code:

```
the-miint.github.io          duckdb-miint
├── docs/                     └── docs/   ◀─── source of truth
│   ├── index.md                   │
│   ├── qiita/                     │ synced at build time
│   └── duckdb-miint/  ◀───────────┘  (scripts/sync-duckdb-miint-docs.sh)
```

`docs/duckdb-miint/` is **generated and gitignored** — never edit or commit it.
To change duckdb-miint's docs, open a PR against
[the-miint/duckdb-miint](https://github.com/the-miint/duckdb-miint); the change
appears here on the next build.

## Local development

One-time environment setup (mirrors the `duckdb-format` env convention):

```bash
conda create -n miint-site -c conda-forge python=3.12 pip -y
conda activate miint-site
pip install -r requirements.txt
```

Then:

```bash
make serve      # sync docs + live-reload preview at http://127.0.0.1:8000
make build      # strict production build into ./site
make sync       # just re-pull the duckdb-miint docs
make test       # build + playground browser tests
```

`make test` runs `tests/playground/` in headless Chrome and also needs Node.js
22.12+ (e.g. `conda install -c conda-forge nodejs` in the env) and Google Chrome
or Chromium (`CHROME_PATH=<binary>` if it isn't `/usr/bin/google-chrome`). The
tests fetch DuckDB-Wasm and the miint extension over the network, as the page
does. CI runs them in `.github/workflows/playground-tests.yml` whenever the
playground, its styles, or the tests change.

**Fast local preview against a local duckdb-miint checkout** (skips the network
clone — point at your working copy's `docs/`):

```bash
MIINT_DOCS_SRC=../duckdb-miint/docs make serve
```

Pin a specific branch/tag/sha of the docs with `MIINT_DOCS_REF=<ref>`.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push
to `main` (and on a `docs-updated` `repository_dispatch`, see below). It runs
`mkdocs build --strict` with the stricter checks under `validation:` in
`mkdocs.yml`, so a broken link or `#anchor`, a nav entry pointing at a missing
page, or a synced page missing from the nav fails the build loudly rather than
shipping. When a duckdb-miint doc change trips one of these, the live site stays
on its last good build until the nav here (or the doc upstream) is fixed.

**One-time GitHub setup** (after the repo exists on GitHub):

1. Settings → Pages → **Source: GitHub Actions**.
2. Push to `main` — the workflow deploys the site.

## Keeping the site fresh when duckdb-miint's docs change

Every build re-clones duckdb-miint and pulls its latest docs, so the site just
needs a rebuild to pick up upstream doc changes. Two mechanisms:

- **Active: nightly rebuild.** `deploy.yml` runs on a `schedule:` (09:17 UTC
  daily), so doc changes appear within ~24h with no cross-repo token.
- **Optional: real-time.** For immediate updates, add a step to duckdb-miint's
  CI that fires a `repository_dispatch` here the moment its docs change:

```yaml
# in the-miint/duckdb-miint, on push to its default branch when docs/** changes
- name: Rebuild the-miint.github.io
  run: |
    curl -fsS -X POST \
      -H "Authorization: Bearer ${{ secrets.SITE_DISPATCH_TOKEN }}" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/repos/the-miint/the-miint.github.io/dispatches \
      -d '{"event_type":"docs-updated"}'
```

`SITE_DISPATCH_TOKEN` is a fine-grained PAT with **Contents: read** and
**Metadata: read** on this repo. (Not yet wired up in duckdb-miint's CI.)

## Adding another project

The site is built to grow. To add a project (e.g. RYpe):

1. If its docs live in its own repo, copy `scripts/sync-duckdb-miint-docs.sh`
   to `scripts/sync-<project>-docs.sh` and point it at that repo; add the call
   to `make sync`, `make serve`, and the deploy workflow. Or, for a project
   with no docs of its own, author a `docs/<project>/` section here directly.
2. Add a nav section in `mkdocs.yml`.
3. Add a project card to `docs/index.md`.

## Brand

The palette and hero styling live in `docs/stylesheets/brand.css`, derived from
the organization logo. To rebrand, change the CSS custom properties in the
`:root` block and drop replacement art into `docs/assets/`.
