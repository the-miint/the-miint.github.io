// docs/playground.md: miint's warnings must be shown with the statement that
// raised them.
//
// WHY: miint reports skipped work as a warning, not an error. When an ENA run's
// download fails, read_ena_sequences retries once, skips the run, and the
// statement succeeds with 0 rows (the-miint/duckdb-miint#279). Outside a
// browser the warning prints to stderr; here stderr is the devtools console,
// so the user saw an empty table that looked like "this run has no reads".
// These fail if the skip is not shown under that statement, if a clean
// statement shows warnings, or if old warnings are shown again
// (miint_warnings() is session-scoped and only grows).
//
// Only the FASTQ host is made unresolvable, so the download fails at once and
// the skip path runs deterministically. The ENA metadata lookup is real: every
// warning in the playground's miint build needs a remote service (ENA, NCBI,
// BLAST) or a large fixture. If that lookup fails, these tests are skipped
// with the reason rather than failed. Switch to a network-free warning (e.g.
// absquant_fit_models' dropped-sample warning) once the playground's build has one.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { openPlayground } from './harness.mjs';

const ACC = 'ERR1074767';

describe('miint warnings', { timeout: 240_000 }, () => {
  let pg;
  let enaUnreachable = null;
  before(async () => {
    pg = await openPlayground({ chromeArgs: ['--host-resolver-rules=MAP ftp.sra.ebi.ac.uk ~NOTFOUND'] });
  });
  after(async () => { await pg?.close(); });

  it('shows none for a clean statement', async () => {
    await pg.submit('SELECT 1 AS one;');
    const v = await pg.waitDone();
    assert.equal(v.cellText, '1');
    assert.deepEqual(v.warnings, []);
  });

  it('shows a skipped ENA run under the statement that skipped it', async t => {
    await pg.submit(`SELECT count(*) AS n FROM read_ena_sequences('${ACC}');`);
    const v = await pg.waitDone();
    if (/ebi\.ac\.uk\/ena\/portal\/api/.test(v.errorText ?? '')) {
      enaUnreachable = v.errorText.split('\n')[0];
      t.skip(`ENA's Portal API is unreachable, so the skip path cannot run: ${enaUnreachable}`);
      return;
    }
    assert.equal(v.errorText, null, 'the statement succeeds');
    assert.equal(v.cellText, '0', 'with 0 rows: the case that used to look like an empty run');
    assert.ok(v.warnings.some(w => /skipped/i.test(w) && w.includes(ACC)),
      `a warning names the skipped run (got ${JSON.stringify(v.warnings)})`);
  });

  it('does not repeat earlier warnings on the next statement', async t => {
    if (enaUnreachable) return t.skip('no warnings were raised to repeat');
    await pg.submit('SELECT 42 AS x;');
    const v = await pg.waitDone();
    assert.equal(v.cellText, '42');
    assert.deepEqual(v.warnings, []);
  });

  it('raised no uncaught page errors', () => {
    assert.deepEqual(pg.pageErrors, []);
  });
});
