// docs/playground.md: while a statement runs, the page must say so.
//
// WHY: read_ena_sequences('ERR1074767') can take 40-90 s in the browser, and
// the page used to read "Ready" over an empty output the whole time, which
// looks exactly like a hang. These fail if, while a statement runs, the page
// stops saying so, the elapsed time stops advancing (a static label would not
// show the page is alive), or the indicator or status is left behind after
// the statement succeeds or fails.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { openPlayground, sleep, SLOW_MS } from './harness.mjs';

const elapsed = text => Number((text ?? '').match(/(\d+\.\d) s/)?.[1] ?? NaN);

describe('running indicator', { timeout: 240_000 }, () => {
  let pg;
  let readyText;
  before(async () => {
    pg = await openPlayground();
    readyText = (await pg.view()).statusText;
  });
  after(async () => { await pg?.close(); });

  it('shows a live, advancing timer while a slow statement runs', async () => {
    assert.ok(SLOW_MS > 2500, 'the slow statement must outlast both samples below');
    await pg.submit(`SELECT count(*) AS n FROM read_csv('${pg.slowUrl('running')}');`);
    await sleep(1000);
    const first = await pg.view();
    assert.equal(first.runningCount, 1, 'one running indicator in the transcript');
    assert.match(first.runningText ?? '', /running… \d+\.\d s/, 'indicator shows elapsed seconds');
    assert.equal(first.state, 'running', 'status bar state');
    assert.doesNotMatch(first.statusText, /^Ready/, 'status bar must not say Ready while running');
    await sleep(1500);
    const second = await pg.view();
    assert.ok(elapsed(second.runningText) > elapsed(first.runningText),
      `elapsed must advance (${first.runningText} -> ${second.runningText})`);
  });

  it('replaces the indicator with the result and restores Ready', async () => {
    const v = await pg.waitDone();
    assert.equal(v.cellText, '3', 'the slow statement returned its result');
    assert.equal(v.runningCount, 0, 'indicator removed');
    assert.equal(v.state, 'ready');
    assert.equal(v.statusText, readyText);
  });

  it('clears the indicator after an error too', async () => {
    await pg.submit('SELECT * FROM no_such_table;');
    const v = await pg.waitDone();
    assert.ok(v.errorText, 'error rendered');
    assert.equal(v.runningCount, 0, 'indicator removed');
    assert.equal(v.state, 'ready');
    assert.equal(v.statusText, readyText);
  });

  it('keeps working afterwards', async () => {
    await pg.submit('SELECT 42 AS x;');
    assert.equal((await pg.waitDone()).cellText, '42');
  });

  it('raised no uncaught page errors', () => {
    assert.deepEqual(pg.pageErrors, []);
  });
});
