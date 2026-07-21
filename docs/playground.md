---
hide:
  - toc
---

# Playground

Run SQL against the **duckdb-miint** extension right here — nothing is
installed and nothing is uploaded. DuckDB runs as WebAssembly inside your
browser, and the miint extension is fetched on demand straight from our
distribution server. Your queries and data never leave this page.

!!! warning "Preview build"
    This console loads an **unsigned** WebAssembly build of miint
    (`wasm_eh`) served from `ftp.microbio.me`. It is a preview of the
    extension for in-browser exploration, not a signed release. The
    extension is ~20 MB and downloads once when the page loads.

<style>
#miint-playground {
  --mp-border: var(--md-default-fg-color--lightest);
  margin: 1.2rem 0 2rem;
  font-size: 0.72rem;
}
#miint-playground .mp-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.7rem;
  border-radius: 0.2rem;
  margin-bottom: 0.7rem;
  border: 1px solid var(--mp-border);
  background: var(--md-code-bg-color);
}
#miint-playground .mp-status[data-state="ready"] { border-color: #2e7d32; }
#miint-playground .mp-status[data-state="error"] { border-color: #c62828; }
#miint-playground .mp-dot {
  width: 0.6rem; height: 0.6rem; border-radius: 50%;
  background: var(--md-default-fg-color--light); flex: 0 0 auto;
}
#miint-playground .mp-status[data-state="loading"] .mp-dot {
  animation: mp-pulse 1s ease-in-out infinite;
}
#miint-playground .mp-status[data-state="ready"] .mp-dot { background: #2e7d32; }
#miint-playground .mp-status[data-state="error"] .mp-dot { background: #c62828; }
@keyframes mp-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }

#miint-playground .mp-examples {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem;
  margin-bottom: 0.5rem;
}
#miint-playground .mp-examples__label { color: var(--md-default-fg-color--light); }
#miint-playground .mp-chip {
  cursor: pointer; border: 1px solid var(--mp-border);
  background: transparent; color: var(--md-default-fg-color);
  border-radius: 1rem; padding: 0.15rem 0.6rem; font-size: 0.68rem;
  font-family: var(--md-code-font-family, monospace);
}
#miint-playground .mp-chip:hover {
  border-color: var(--md-accent-fg-color); color: var(--md-accent-fg-color);
}

#miint-playground .mp-editor {
  width: 100%; box-sizing: border-box; resize: vertical; min-height: 6.5rem;
  padding: 0.7rem 0.8rem; border: 1px solid var(--mp-border); border-radius: 0.2rem;
  background: var(--md-code-bg-color); color: var(--md-code-fg-color);
  font-family: var(--md-code-font-family, monospace); font-size: 0.75rem;
  line-height: 1.5; tab-size: 2;
}
#miint-playground .mp-editor:focus {
  outline: none; border-color: var(--md-accent-fg-color);
}
#miint-playground .mp-toolbar {
  display: flex; align-items: center; gap: 0.8rem; margin: 0.6rem 0;
}
#miint-playground .mp-run {
  cursor: pointer; border: none; border-radius: 0.2rem;
  background: var(--md-primary-fg-color); color: var(--md-primary-bg-color, #fff);
  padding: 0.4rem 1.1rem; font-weight: 700; font-size: 0.72rem;
}
#miint-playground .mp-run:disabled { opacity: 0.45; cursor: not-allowed; }
#miint-playground .mp-hint { color: var(--md-default-fg-color--light); }
#miint-playground .mp-timing { margin-left: auto; color: var(--md-default-fg-color--light); }

#miint-playground .mp-result { overflow-x: auto; }
#miint-playground table.mp-table {
  border-collapse: collapse; width: 100%; font-size: 0.7rem;
  font-family: var(--md-code-font-family, monospace);
}
#miint-playground table.mp-table th,
#miint-playground table.mp-table td {
  border: 1px solid var(--mp-border); padding: 0.3rem 0.55rem;
  text-align: left; white-space: nowrap;
}
#miint-playground table.mp-table th { background: var(--md-default-fg-color--lightest); }
#miint-playground table.mp-table td.mp-null { color: var(--md-default-fg-color--light); font-style: italic; }
#miint-playground .mp-error {
  white-space: pre-wrap; color: #c62828;
  font-family: var(--md-code-font-family, monospace); font-size: 0.72rem;
  padding: 0.6rem 0.8rem; border: 1px solid #c62828; border-radius: 0.2rem;
  background: var(--md-code-bg-color);
}
#miint-playground .mp-note { color: var(--md-default-fg-color--light); margin-top: 0.4rem; }
</style>

<div id="miint-playground">
  <div class="mp-status" id="mp-status" data-state="loading">
    <span class="mp-dot"></span>
    <span id="mp-status-text">Starting DuckDB-Wasm…</span>
  </div>
  <div class="mp-examples" id="mp-examples" hidden>
    <span class="mp-examples__label">Try:</span>
  </div>
  <textarea id="mp-editor" class="mp-editor" spellcheck="false" disabled>SELECT miint_version() AS miint_build;</textarea>
  <div class="mp-toolbar">
    <button id="mp-run" class="mp-run" disabled>Run ▷</button>
    <span class="mp-hint">Ctrl / ⌘ + Enter</span>
    <span class="mp-timing" id="mp-timing"></span>
  </div>
  <div class="mp-result" id="mp-result" aria-live="polite"></div>
</div>

<script type="module">
import * as duckdb from 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev57.0/+esm';

// --- The runtime and the extension are an ABI-matched pair. ---------------
// The duckdb-wasm version above reports DuckDB v1.5.4 @ 08e34c447b, matching
// the duckdb/ submodule. We load the miint wasm_eh build from the "tagged"
// stream of the extension repo — it carries the wasm binary from the latest
// release tag, keyed by DuckDB version, so this URL stays stable across
// releases and always resolves to the newest tagged build.
const EXT_VERSION = 'v1.5.4';
const EXT_BASE = 'https://ftp.microbio.me/pub/miint/tagged';
const MAX_ROWS = 1000;

const els = {
  status: document.getElementById('mp-status'),
  statusText: document.getElementById('mp-status-text'),
  examples: document.getElementById('mp-examples'),
  editor: document.getElementById('mp-editor'),
  run: document.getElementById('mp-run'),
  timing: document.getElementById('mp-timing'),
  result: document.getElementById('mp-result'),
};

const EXAMPLES = [
  "SELECT miint_version() AS miint_build;",
  "SELECT version() AS duckdb_version;",
  "SELECT range AS n, range * range AS squared FROM range(1, 11);",
];

function setStatus(state, text) {
  els.status.dataset.state = state;
  els.statusText.textContent = text;
}

function fmt(v) {
  if (v === null || v === undefined) return { text: 'NULL', isNull: true };
  if (typeof v === 'bigint') return { text: v.toString() };
  if (v instanceof Uint8Array) return { text: `<blob ${v.length} bytes>` };
  if (typeof v === 'object') { try { return { text: JSON.stringify(v) }; } catch { return { text: String(v) }; } }
  return { text: String(v) };
}

function renderTable(table) {
  const fields = table.schema.fields.map(f => f.name);
  els.result.innerHTML = '';
  if (fields.length === 0) {
    els.result.innerHTML = '<p class="mp-note">Statement executed. No result set.</p>';
    return;
  }
  // Read only the first MAX_ROWS rows column-wise (getChildAt(ci).get(i)) rather
  // than table.toArray(), which would materialize a JS object for every row of
  // an arbitrarily large result before we trim to the display cap.
  const total = table.numRows;
  const shown = Math.min(total, MAX_ROWS);
  const cols = fields.map((_, ci) => table.getChildAt(ci));
  const t = document.createElement('table');
  t.className = 'mp-table';
  const thead = t.createTHead().insertRow();
  for (const f of fields) { const th = document.createElement('th'); th.textContent = f; thead.appendChild(th); }
  const tbody = t.createTBody();
  for (let i = 0; i < shown; i++) {
    const tr = tbody.insertRow();
    for (let ci = 0; ci < fields.length; ci++) {
      const td = tr.insertCell();
      const { text, isNull } = fmt(cols[ci].get(i));
      td.textContent = text;
      if (isNull) td.className = 'mp-null';
    }
  }
  els.result.appendChild(t);
  const note = document.createElement('p');
  note.className = 'mp-note';
  note.textContent = total > MAX_ROWS
    ? `${total.toLocaleString()} rows (showing first ${MAX_ROWS.toLocaleString()}).`
    : `${total.toLocaleString()} row${total === 1 ? '' : 's'}.`;
  els.result.appendChild(note);
}

function renderError(err) {
  const pre = document.createElement('div');
  pre.className = 'mp-error';
  pre.textContent = String(err && err.message ? err.message : err);
  els.result.innerHTML = '';
  els.result.appendChild(pre);
}

let conn = null;

async function runQuery() {
  if (!conn) return;
  const sql = els.editor.value.trim();
  if (!sql) return;
  els.run.disabled = true;
  els.timing.textContent = 'running…';
  const t0 = performance.now();
  try {
    const result = await conn.query(sql);
    els.timing.textContent = `${(performance.now() - t0).toFixed(0)} ms`;
    renderTable(result);
  } catch (err) {
    els.timing.textContent = '';
    renderError(err);
  } finally {
    els.run.disabled = false;
  }
}

async function boot() {
  try {
    setStatus('loading', 'Booting DuckDB-Wasm…');
    const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
    const workerUrl = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
    );
    const worker = new Worker(workerUrl);
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING), worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(workerUrl);
    // No castBigIntToDouble: keep BIGINT/HUGEINT exact as JS BigInt (fmt()
    // stringifies them losslessly) instead of coercing to Number and silently
    // corrupting integers above 2^53.
    await db.open({ allowUnsignedExtensions: true });
    conn = await db.connect();

    const platform = (await conn.query('PRAGMA platform')).toArray()[0].platform;
    if (platform !== 'wasm_eh') {
      setStatus('error', `Your browser selected the "${platform}" runtime, but miint is only published for "wasm_eh". Try a current Chrome, Firefox, Safari, or Edge.`);
      return;
    }

    setStatus('loading', `Loading miint ${EXT_VERSION} (~20 MB, first time only)…`);
    const extUrl = `${EXT_BASE}/${EXT_VERSION}/${platform}/miint.duckdb_extension.wasm`;
    await conn.query(`LOAD '${extUrl}'`);
    const build = (await conn.query('SELECT miint_version() AS v')).toArray()[0].v;

    setStatus('ready', `Ready — DuckDB ${platform}, miint ${EXT_VERSION} (build ${build}).`);
    els.editor.disabled = false;
    els.run.disabled = false;

    for (const ex of EXAMPLES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mp-chip';
      b.textContent = ex.length > 46 ? ex.slice(0, 44) + '…' : ex;
      b.title = ex;
      b.addEventListener('click', () => { els.editor.value = ex; els.editor.focus(); });
      els.examples.appendChild(b);
    }
    els.examples.hidden = false;

    els.run.addEventListener('click', runQuery);
    els.editor.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
    });
  } catch (err) {
    setStatus('error', `Failed to load: ${err && err.message ? err.message : err}`);
  }
}

boot();
</script>
