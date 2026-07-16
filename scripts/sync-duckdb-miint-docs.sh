#!/usr/bin/env bash
# Pull the canonical duckdb-miint docs into docs/duckdb-miint/ at build time.
#
# The duckdb-miint docs are the SINGLE SOURCE OF TRUTH and live beside the code
# they document in the-miint/duckdb-miint. This script copies them in as a
# BUILD ARTIFACT — the destination is .gitignored and never committed, so the
# umbrella site always reflects upstream and the two can never silently drift.
#
#   Default:            shallow-clone the-miint/duckdb-miint and copy its docs/.
#   MIINT_DOCS_SRC=DIR  copy from a local docs/ instead (fast local preview).
#   MIINT_DOCS_REF=REF  branch/tag/sha to clone (default: the repo default branch).
set -euo pipefail

REPO="https://github.com/the-miint/duckdb-miint.git"
DEST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/docs/duckdb-miint"
REF="${MIINT_DOCS_REF:-}"

rm -rf "$DEST"
mkdir -p "$DEST"

if [[ -n "${MIINT_DOCS_SRC:-}" ]]; then
    echo "sync: copying duckdb-miint docs from local \$MIINT_DOCS_SRC=$MIINT_DOCS_SRC"
    SRC="$MIINT_DOCS_SRC"
else
    TMP="$(mktemp -d)"
    trap 'rm -rf "$TMP"' EXIT
    echo "sync: cloning duckdb-miint docs from $REPO ${REF:+(ref $REF)}"
    git clone --quiet --depth 1 ${REF:+--branch "$REF"} --filter=blob:none --sparse "$REPO" "$TMP"
    git -C "$TMP" sparse-checkout set docs >/dev/null
    SRC="$TMP/docs"
fi

# Copy everything except the DuckDB extension-template boilerplate, which is
# generic "bump the submodule" instructions, not miint documentation.
cp -R "$SRC"/. "$DEST"/
rm -f "$DEST/UPDATING.md"

# --- Build-time transforms (applied to the artifact only, never committed) ---

# 1. Use the section overview as the section's index page, so it lives at the
#    clean URL /duckdb-miint/ instead of /duckdb-miint/table_of_contents/.
if [[ -f "$DEST/table_of_contents.md" ]]; then
    mv "$DEST/table_of_contents.md" "$DEST/index.md"
    # Repoint intra-doc links that named the old filename.
    grep -rlZ "](table_of_contents.md" "$DEST" 2>/dev/null \
        | xargs -0 -r sed -i 's#](table_of_contents\.md#](index.md#g'
fi

# 2. A handful of docs reference repo-root files that live OUTSIDE docs/ (e.g.
#    THIRD_PARTY_LICENSES.md). Point those at the file on GitHub so the link
#    resolves and --strict stays meaningful. HEAD tracks the default branch.
GH_BLOB="https://github.com/the-miint/duckdb-miint/blob/HEAD"
grep -rlZ "](../THIRD_PARTY_LICENSES.md" "$DEST" 2>/dev/null \
    | xargs -0 -r sed -i "s#](\.\./THIRD_PARTY_LICENSES\.md#]($GH_BLOB/THIRD_PARTY_LICENSES.md#g"

echo "sync: duckdb-miint docs -> $DEST"
find "$DEST" -name '*.md' | wc -l | xargs echo "sync: markdown files:"
