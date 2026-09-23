# the-miint.github.io — site build. Run inside the `miint-site` conda env
# (see README.md). Set MIINT_DOCS_SRC=<path> to sync from a local duckdb-miint
# checkout instead of cloning; MIINT_DOCS_REF=<ref> to pin a docs branch/tag.
# `make test` also needs Node 22.12+ and Chrome (CHROME_PATH to override).

.PHONY: help sync serve build test clean

help:
	@echo "make sync    - pull duckdb-miint docs into docs/duckdb-miint/ (gitignored)"
	@echo "make serve   - sync + live-reload preview at http://127.0.0.1:8000"
	@echo "make build   - sync + strict production build into ./site"
	@echo "make test    - build + playground browser tests (tests/playground/)"
	@echo "make clean    - remove synced docs and built site"

sync:
	bash scripts/sync-duckdb-miint-docs.sh

serve: sync
	mkdocs serve

build: sync
	mkdocs build --strict

test: build
	npm --prefix tests/playground install --no-audit --no-fund
	npm --prefix tests/playground test

clean:
	rm -rf site docs/duckdb-miint
