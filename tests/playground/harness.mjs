// Test harness for docs/playground.md: serve a built site, boot the playground
// in headless Chrome, and drive it the way a user does (type a statement, press
// Enter, read what is on screen). The page itself is not instrumented.
//
//   SITE_DIR     built site to serve (default: <repo>/site, from `make build`)
//   CHROME_PATH  Chrome or Chromium binary (default: /usr/bin/google-chrome)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE_DIR = process.env.SITE_DIR ?? path.join(REPO, 'site');
const CHROME_PATH = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

// Every request under /__slow/ is answered after SLOW_MS with a 3-row CSV, so a
// test can run a statement whose duration the server controls rather than CPU
// speed. DuckDB-Wasm sends a HEAD then a GET, but even one request outlasts the
// checks. Use a fresh name per statement so nothing is served from a cache.
export const SLOW_MS = 4000;
const SLOW_CSV = 'x\n1\n2\n3\n';

function serve() {
  return http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/__slow/')) {
      setTimeout(() => {
        res.writeHead(200, { 'content-type': 'text/csv', 'content-length': Buffer.byteLength(SLOW_CSV) });
        res.end(req.method === 'HEAD' ? undefined : SLOW_CSV);
      }, SLOW_MS);
      return;
    }
    let file = path.join(SITE_DIR, decodeURIComponent(pathname));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(0);
}

// chromeArgs: extra Chrome flags, e.g. --host-resolver-rules to make one host
// unreachable (this also covers requests made from the DuckDB worker).
export async function openPlayground({ chromeArgs = [] } = {}) {
  if (!fs.existsSync(path.join(SITE_DIR, 'playground', 'index.html'))) {
    throw new Error(`no built playground under ${SITE_DIR}; run \`make build\` or set SITE_DIR`);
  }
  const server = serve();
  const baseUrl = `http://localhost:${server.address().port}`;
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', ...chromeArgs] });
  const close = async () => { await browser.close(); server.close(); };
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto(`${baseUrl}/playground/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('mp-status').dataset.state === 'ready', { timeout: 180_000 });

    // What the user sees for the most recent statement.
    const view = () => page.evaluate(() => {
      const entries = document.querySelectorAll('#mp-term .mp-entry');
      const out = entries[entries.length - 1]?.querySelector('.mp-out');
      const running = document.querySelectorAll('#mp-term .mp-running');
      return {
        state: document.getElementById('mp-status').dataset.state,
        statusText: document.getElementById('mp-status-text').textContent,
        runningCount: running.length,
        runningText: running[0]?.textContent ?? null,
        hasTable: !!out?.querySelector('table'),
        cellText: out?.querySelector('td')?.textContent ?? null,
        errorText: out?.querySelector('.mp-error')?.textContent ?? null,
        warnings: [...(out?.querySelectorAll('.mp-warning') ?? [])].map(w => w.textContent),
      };
    });
    const submit = async sql => {
      await page.$eval('#mp-input', (el, v) => { el.value = v; el.dispatchEvent(new Event('input')); }, sql);
      await page.focus('#mp-input');
      await page.keyboard.press('Enter');
    };
    // Resolves once the latest statement has rendered a result or an error and
    // the prompt is usable again.
    const waitDone = async () => {
      await page.waitForFunction(() => {
        const entries = document.querySelectorAll('#mp-term .mp-entry');
        const out = entries[entries.length - 1]?.querySelector('.mp-out');
        return out && !document.getElementById('mp-input').disabled && out.querySelector('table, .mp-error');
      }, { timeout: 60_000, polling: 100 });
      return view();
    };
    const slowUrl = name => `${baseUrl}/__slow/${name}.csv`;
    return { page, view, submit, waitDone, slowUrl, pageErrors, close };
  } catch (err) {
    await close();
    throw err;
  }
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
