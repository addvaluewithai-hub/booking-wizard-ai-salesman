import { describe, expect, it, vi } from 'vitest';
import { createD1Storage, getStorage, storeModelDiagnosticBestEffort } from './storage.js';

function fakeD1() {
  const runs = [];
  const batches = [];
  return {
    runs,
    batches,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              runs.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
    async batch(statements) {
      batches.push(statements.length);
      for (const statement of statements) await statement.run();
      return statements.map(() => ({ success: true }));
    },
  };
}

describe('storage adapter', () => {
  it('returns null when the D1 binding is unavailable', () => {
    expect(getStorage({})).toBeNull();
    expect(createD1Storage(null)).toBeNull();
  });

  it('stores leads through the adapter contract', async () => {
    const db = fakeD1();
    const storage = createD1Storage(db);
    await storage.storeLead({
      id: 'lead-1', createdAt: '2026-08-19T00:00:00.000Z', niche: 'homepage',
      name: 'Demo', email: 'demo@example.com', phone: '', company: '', websiteUrl: '', contextJson: '{}',
    });
    expect(db.runs).toHaveLength(1);
    expect(db.runs[0].sql).toContain('INSERT INTO leads');
    expect(db.runs[0].values[0]).toBe('lead-1');
  });

  it('keeps base event persistence independent from additive attribution writes', async () => {
    const db = fakeD1();
    const storage = createD1Storage(db);
    await storage.storeEvents([{
      id: 'event-1', sessionId: 'session-1', at: 1, niche: 'hpl', type: 'product_view', page: '/hpl',
      entityId: 'HPL-1', stage: 'exploring', suppressionLevel: 0, experimentVariant: '', conversionKind: '', sourceInterventionId: '', assisted: false,
    }]);
    expect(db.batches[0]).toBe(1);
    expect(db.runs.some((entry) => entry.sql.includes('conversion_events'))).toBe(true);
    expect(db.runs.some((entry) => entry.sql.includes('INSERT INTO sessions'))).toBe(false);
  });

  it('stores only minimal session and conversion attribution metadata for measured conversions', async () => {
    const db = fakeD1();
    const storage = createD1Storage(db);
    await storage.storeEvents([{
      id: 'conversion-1', sessionId: 'session-1', at: 100, niche: 'homepage', type: 'conversion', page: '/',
      entityId: 'qualified_lead', stage: 'ready', suppressionLevel: 0, experimentVariant: 'treatment', conversionKind: 'qualified_lead', sourceInterventionId: 'intervention-1', assisted: true,
    }]);

    const sessionWrite = db.runs.find((entry) => entry.sql.includes('INSERT INTO sessions'));
    const attributionWrite = db.runs.find((entry) => entry.sql.includes('conversion_attribution'));
    expect(sessionWrite?.values).toEqual(['session-1', 100, 100, 'homepage', 'treatment']);
    expect(attributionWrite?.values).toEqual(['conversion-1', 'qualified_lead', 'intervention-1', 1]);
    expect(JSON.stringify(sessionWrite)).not.toContain('qualified_lead');
  });

  it('swallows optional model diagnostic storage failures', async () => {
    const db = fakeD1();
    db.prepare = vi.fn(() => ({ bind: () => ({ run: async () => { throw new Error('missing optional table'); } }) }));
    await expect(storeModelDiagnosticBestEffort({ DB: db }, { task: 'decision', succeeded: false })).resolves.toBe(false);
  });
});
