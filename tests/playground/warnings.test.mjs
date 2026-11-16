// docs/playground.md: miint's warnings must be shown with the statement that
// raised them.
//
// WHY: miint reports skipped work as a warning, not an error: the statement
// succeeds with fewer rows than the user may expect. Outside a browser the
// warning prints to stderr; here stderr is the devtools console, so the user
// saw only the shorter result (the-miint/duckdb-miint#279: a skipped ENA run
// looked like a run with no reads). These fail if a warning is not shown under
// the statement that raised it, if a clean statement shows warnings, or if old
// warnings are shown again (miint_warnings() is session-scoped and only grows).
//
// The warning is absquant_fit_models' dropped-sample warning: a sample whose
// mass_syndna_input_ng is NULL gets no model, and the statement returns the
// rest. It needs no network. read_ena_sequences no longer serves: since
// duckdb-miint v1.1.0 a scan whose only run fails raises, so its skip path
// needs a scan where some runs download and others fail, which a test cannot
// arrange by blocking a host.
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { openPlayground } from './harness.mjs';

// Sample A gets a model; sample B, with no input mass, is dropped with a warning.
const FIT = [
  "CREATE TABLE wc AS SELECT s AS sample_id, f AS feature_id, v::DOUBLE AS value FROM (VALUES",
  "('A','p1',100),('A','p2',1000),('A','p3',10000),('A','p4',100000),",
  "('B','p1',100),('B','p2',1000),('B','p3',10000),('B','p4',100000)) t(s, f, v);",
  "CREATE TABLE wp AS SELECT f AS feature_id, c::DOUBLE AS syndna_indiv_ng_ul FROM (VALUES",
  "('p1',0.001),('p2',0.01),('p3',0.1),('p4',1.0)) t(f, c);",
  "CREATE TABLE ws AS SELECT s AS sample_id, m::DOUBLE AS mass_syndna_input_ng FROM (VALUES",
  "('A',0.25),('B',NULL)) t(s, m);",
  "SELECT string_agg(sample_id, ',') AS fitted FROM absquant_fit_models('wc', 'wp', 'ws', 1.0);",
].join(' ');

describe('miint warnings', { timeout: 240_000 }, () => {
  let pg;
  before(async () => {
    pg = await openPlayground();
  });
  after(async () => { await pg?.close(); });

  it('shows none for a clean statement', async () => {
    await pg.submit('SELECT 1 AS one;');
    const v = await pg.waitDone();
    assert.equal(v.cellText, '1');
    assert.deepEqual(v.warnings, []);
  });

  it('shows a dropped sample under the statement that dropped it', async () => {
    await pg.submit(FIT);
    const v = await pg.waitDone();
    assert.equal(v.errorText, null, 'the statement succeeds');
    assert.equal(v.cellText, 'A', 'with a model for A only: B is missing from the result');
    assert.ok(v.warnings.some(w => /dropped 1 sample/.test(w) && /\bB\b/.test(w)),
      `a warning names the dropped sample (got ${JSON.stringify(v.warnings)})`);
  });

  it('does not repeat earlier warnings on the next statement', async () => {
    await pg.submit('SELECT 42 AS x;');
    const v = await pg.waitDone();
    assert.equal(v.cellText, '42');
    assert.deepEqual(v.warnings, []);
  });

  it('raised no uncaught page errors', () => {
    assert.deepEqual(pg.pageErrors, []);
  });
});
