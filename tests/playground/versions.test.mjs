// docs/playground.md: the status bar and the banner name the versions that run.
//
// WHY: the page printed EXT_VERSION, the DuckDB release whose miint build it
// fetches, as miint's version ("miint v1.5.5"), and showed DuckDB only by its
// platform. Someone reporting a problem copies these lines, so they must name
// miint's own version (miint_version()) and DuckDB's (version()), as the page
// itself reports them. These fail if either label names anything else.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { openPlayground } from './harness.mjs';

describe('version labels', { timeout: 240_000 }, () => {
  let pg;
  let miint;
  let duckdb;
  before(async () => {
    pg = await openPlayground();
    await pg.submit('SELECT miint_version() AS v;');
    miint = (await pg.waitDone()).cellText;
    await pg.submit('SELECT version() AS v;');
    duckdb = (await pg.waitDone()).cellText;
  });
  after(async () => { await pg?.close(); });

  it('reads both versions from the page', () => {
    assert.ok(miint, 'miint_version() returned a value');
    assert.ok(duckdb, 'version() returned a value');
  });

  it('the status bar names miint and DuckDB by their own versions', async () => {
    const { statusText } = await pg.view();
    assert.ok(statusText.includes(`miint ${miint}`), `status "${statusText}" should name miint ${miint}`);
    assert.ok(statusText.includes(`DuckDB ${duckdb}`), `status "${statusText}" should name DuckDB ${duckdb}`);
  });

  it('the banner names miint and DuckDB by their own versions', async () => {
    const banner = await pg.page.evaluate(() => document.querySelector('.mp-banner')?.textContent ?? '');
    assert.ok(banner.includes(`miint ${miint}`), `banner "${banner}" should name miint ${miint}`);
    assert.ok(banner.includes(`DuckDB ${duckdb}`), `banner "${banner}" should name DuckDB ${duckdb}`);
  });

  it('raised no uncaught page errors', () => {
    assert.deepEqual(pg.pageErrors, []);
  });
});
