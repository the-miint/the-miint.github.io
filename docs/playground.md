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
    extension is ~16 MB and downloads once when the page loads.

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

/* Terminal-style transcript: scrollback of prior commands + output, with the
   live prompt as the last element so it stays at the bottom like a real REPL. */
#miint-playground .mp-term {
  border: 1px solid var(--mp-border); border-radius: 0.2rem;
  background: var(--md-code-bg-color); color: var(--md-code-fg-color);
  font-family: var(--md-code-font-family, monospace); font-size: 0.75rem;
  line-height: 1.5; padding: 0.7rem 0.8rem;
  height: 24rem; overflow-y: auto; resize: vertical; cursor: text;
}
#miint-playground .mp-entry { margin-bottom: 0.55rem; }
#miint-playground .mp-echoline { white-space: pre-wrap; word-break: break-word; }
#miint-playground .mp-prompt {
  color: var(--md-accent-fg-color); font-weight: 700;
  user-select: none; margin-right: 0.5rem;
}
#miint-playground .mp-out { margin-top: 0.2rem; }
#miint-playground .mp-tablewrap { overflow-x: auto; margin: 0.15rem 0; }
#miint-playground .mp-banner {
  color: var(--md-default-fg-color--light); white-space: pre-wrap;
  margin-bottom: 0.55rem;
}
#miint-playground .mp-inputline { display: flex; align-items: flex-start; }
#miint-playground .mp-input {
  flex: 1 1 auto; background: transparent; border: none; outline: none;
  color: var(--md-code-fg-color); font-family: inherit; font-size: inherit;
  line-height: inherit; padding: 0; margin: 0; resize: none; overflow: hidden;
  min-height: 1.5em;
}
#miint-playground .mp-bar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.8rem; margin-top: 0.5rem;
}
#miint-playground .mp-hint { color: var(--md-default-fg-color--light); font-size: 0.68rem; }
#miint-playground .mp-hint code { font-size: 0.9em; padding: 0 0.2em; }
#miint-playground .mp-clear {
  cursor: pointer; border: 1px solid var(--mp-border); background: transparent;
  color: var(--md-default-fg-color--light); border-radius: 0.2rem;
  padding: 0.15rem 0.6rem; font-size: 0.68rem;
  font-family: var(--md-code-font-family, monospace);
}
#miint-playground .mp-clear:hover { border-color: var(--md-accent-fg-color); color: var(--md-accent-fg-color); }

#miint-playground table.mp-table {
  border-collapse: collapse; font-size: 0.7rem;
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
  font-family: var(--md-code-font-family, monospace);
}
#miint-playground .mp-note { color: var(--md-default-fg-color--light); margin-top: 0.25rem; }
</style>

<div id="miint-playground">
  <div class="mp-status" id="mp-status" data-state="loading">
    <span class="mp-dot"></span>
    <span id="mp-status-text">Starting DuckDB-Wasm…</span>
  </div>
  <div class="mp-examples" id="mp-examples" hidden>
    <span class="mp-examples__label">Try:</span>
  </div>
  <div class="mp-term" id="mp-term">
    <div class="mp-inputline" id="mp-inputline">
      <span class="mp-prompt" id="mp-prompt">miint=#</span>
      <textarea class="mp-input" id="mp-input" rows="1" spellcheck="false"
                autocomplete="off" autocapitalize="off" autocorrect="off"
                aria-label="SQL input" disabled></textarea>
    </div>
  </div>
  <div class="mp-bar">
    <span class="mp-hint">Enter runs (end with <code>;</code>) · Shift+Enter newline · ⌘/Ctrl+Enter force-run · ↑/↓ history</span>
    <button type="button" class="mp-clear" id="mp-clear">clear</button>
  </div>
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
const PROMPT = 'miint=#';   // statement start (psql-style)
const CONT = 'miint-#';     // continuation line (buffer has an unterminated statement)

const els = {
  status: document.getElementById('mp-status'),
  statusText: document.getElementById('mp-status-text'),
  examples: document.getElementById('mp-examples'),
  term: document.getElementById('mp-term'),
  inputLine: document.getElementById('mp-inputline'),
  input: document.getElementById('mp-input'),
  prompt: document.getElementById('mp-prompt'),
  clear: document.getElementById('mp-clear'),
};

const EXAMPLES = [
  "SELECT miint_version() AS miint_build;",
  "SELECT version() AS duckdb_version;",
  "SELECT range AS n, range * range AS squared FROM range(1, 11);",
];

let conn = null;
const history = [];
let histIdx = 0;   // points one past the last entry = "fresh line"

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

// --- terminal plumbing ----------------------------------------------------

function scrollBottom() { els.term.scrollTop = els.term.scrollHeight; }
function autoGrow() { els.input.style.height = 'auto'; els.input.style.height = Math.min(els.input.scrollHeight, 240) + 'px'; }
function needsMore(v) { const t = v.trim(); return t.length > 0 && !t.endsWith(';'); }
function updatePrompt() { els.prompt.textContent = needsMore(els.input.value) ? CONT : PROMPT; }
function caretEnd() { const n = els.input.value.length; els.input.selectionStart = els.input.selectionEnd = n; }
function onFirstLine() { return !els.input.value.slice(0, els.input.selectionStart).includes('\n'); }
function onLastLine() { return !els.input.value.slice(els.input.selectionStart).includes('\n'); }

// Insert a node into the scrollback, just above the live prompt line.
function appendToScrollback(node) { els.term.insertBefore(node, els.inputLine); scrollBottom(); }

// Echo a submitted command with psql-style prompts (=# first line, -# rest).
function echoNode(sql) {
  const wrap = document.createElement('div');
  wrap.className = 'mp-echo';
  sql.split('\n').forEach((line, i) => {
    const row = document.createElement('div');
    row.className = 'mp-echoline';
    const p = document.createElement('span');
    p.className = 'mp-prompt';
    p.textContent = i === 0 ? PROMPT : CONT;
    const code = document.createElement('span');
    code.textContent = line;
    row.append(p, code);
    wrap.appendChild(row);
  });
  return wrap;
}

function renderTableInto(out, table, ms) {
  const fields = table.schema.fields.map(f => f.name);
  if (fields.length === 0) {
    const n = document.createElement('div');
    n.className = 'mp-note';
    n.textContent = `OK · ${ms.toFixed(0)} ms`;
    out.appendChild(n);
    return;
  }
  // Read only the first MAX_ROWS rows column-wise (getChildAt(ci).get(i)) rather
  // than table.toArray(), which would materialize a JS object for every row of
  // an arbitrarily large result before we trim to the display cap.
  const total = table.numRows;
  const shown = Math.min(total, MAX_ROWS);
  const cols = fields.map((_, ci) => table.getChildAt(ci));
  const wrap = document.createElement('div');
  wrap.className = 'mp-tablewrap';
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
  wrap.appendChild(t);
  out.appendChild(wrap);
  const note = document.createElement('div');
  note.className = 'mp-note';
  const rowsMsg = total > MAX_ROWS
    ? `${total.toLocaleString()} rows (showing first ${MAX_ROWS.toLocaleString()})`
    : `${total.toLocaleString()} row${total === 1 ? '' : 's'}`;
  note.textContent = `${rowsMsg} · ${ms.toFixed(0)} ms`;
  out.appendChild(note);
}

function renderErrorInto(out, err) {
  const pre = document.createElement('div');
  pre.className = 'mp-error';
  pre.textContent = String(err && err.message ? err.message : err);
  out.appendChild(pre);
}

async function submit() {
  if (!conn) return;
  const raw = els.input.value;
  const sql = raw.trim();
  els.input.value = '';
  autoGrow();
  updatePrompt();
  if (!sql) return;                       // blank line: just a fresh prompt

  history.push(raw);
  histIdx = history.length;

  const entry = document.createElement('div');
  entry.className = 'mp-entry';
  entry.appendChild(echoNode(raw.replace(/\s+$/, '')));
  const out = document.createElement('div');
  out.className = 'mp-out';
  entry.appendChild(out);
  appendToScrollback(entry);

  els.input.disabled = true;
  const t0 = performance.now();
  try {
    const result = await conn.query(sql);
    renderTableInto(out, result, performance.now() - t0);
  } catch (err) {
    renderErrorInto(out, err);
  } finally {
    els.input.disabled = false;
    els.input.focus();
    scrollBottom();
  }
}

function onKeydown(e) {
  if (e.key === 'Enter') {
    if (e.shiftKey) return;                              // newline
    const force = e.ctrlKey || e.metaKey;
    if (force || els.input.value.trim().endsWith(';')) { // run on ; or force
      e.preventDefault();
      submit();
    }
    return;                                              // else: default newline (continuation)
  }
  if (e.key === 'ArrowUp' && history.length && onFirstLine()) {
    e.preventDefault();
    if (histIdx > 0) histIdx--;
    els.input.value = history[histIdx] ?? '';
    autoGrow(); updatePrompt(); caretEnd();
  } else if (e.key === 'ArrowDown' && history.length && onLastLine()) {
    e.preventDefault();
    if (histIdx < history.length) histIdx++;
    els.input.value = histIdx >= history.length ? '' : (history[histIdx] ?? '');
    autoGrow(); updatePrompt(); caretEnd();
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

    setStatus('loading', `Loading miint ${EXT_VERSION} (~16 MB, first time only)…`);
    const extUrl = `${EXT_BASE}/${EXT_VERSION}/${platform}/miint.duckdb_extension.wasm`;
    await conn.query(`LOAD '${extUrl}'`);
    const build = (await conn.query('SELECT miint_version() AS v')).toArray()[0].v;

    setStatus('ready', `Ready — DuckDB ${platform} · miint ${EXT_VERSION} (build ${build}).`);

    const banner = document.createElement('div');
    banner.className = 'mp-banner';
    banner.textContent =
      `miint ${EXT_VERSION} (build ${build}) on DuckDB ${platform} — everything runs in your browser.\n` +
      `Type SQL and press Enter (statements end with ;). Shift+Enter for a newline, ⌘/Ctrl+Enter to force-run, ↑/↓ for history.`;
    appendToScrollback(banner);

    for (const ex of EXAMPLES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mp-chip';
      b.textContent = ex.length > 46 ? ex.slice(0, 44) + '…' : ex;
      b.title = ex;
      b.addEventListener('click', () => { els.input.value = ex; autoGrow(); updatePrompt(); els.input.focus(); caretEnd(); });
      els.examples.appendChild(b);
    }
    els.examples.hidden = false;

    els.input.disabled = false;
    els.input.value = EXAMPLES[0];        // prefill so first Enter just works
    autoGrow();
    updatePrompt();

    els.input.addEventListener('keydown', onKeydown);
    els.input.addEventListener('input', () => { autoGrow(); updatePrompt(); });
    els.term.addEventListener('click', () => { if (!window.getSelection().toString()) els.input.focus(); });
    els.clear.addEventListener('click', () => {
      els.term.querySelectorAll('.mp-entry, .mp-banner').forEach(n => n.remove());
      els.input.focus();
    });

    els.input.focus();
    caretEnd();
  } catch (err) {
    setStatus('error', `Failed to load: ${err && err.message ? err.message : err}`);
  }
}

boot();
</script>
