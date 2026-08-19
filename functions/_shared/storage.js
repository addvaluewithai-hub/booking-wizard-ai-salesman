function isD1Database(value) {
  return Boolean(value?.prepare && value?.batch);
}

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function createD1Storage(db) {
  if (!isD1Database(db)) return null;

  return {
    kind: 'cloudflare-d1',

    async storeLead(lead) {
      return db.prepare(`
        INSERT INTO leads (id, created_at, niche, name, email, phone, company, website_url, context_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        lead.id,
        lead.createdAt,
        lead.niche,
        lead.name,
        lead.email,
        lead.phone || null,
        lead.company || null,
        lead.websiteUrl || null,
        lead.contextJson,
      ).run();
    },

    async storeEvents(events) {
      const baseStatements = events.map((event) => db.prepare(`
        INSERT OR IGNORE INTO conversion_events
          (id, session_id, occurred_at, niche, event_type, page, entity_id, stage, suppression_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        event.id,
        event.sessionId,
        event.at,
        event.niche,
        event.type,
        event.page,
        event.entityId || null,
        event.stage || null,
        event.suppressionLevel,
      ));
      await db.batch(baseStatements);

      // Attribution tables are additive. If migration 0003 has not been applied yet,
      // base event persistence remains healthy and these enhancements simply no-op.
      const variants = new Map(events.map((event) => [event.sessionId, event.experimentVariant]).filter(([, variant]) => variant));
      if (variants.size) {
        try {
          await db.batch([...variants.entries()].map(([sessionId, variant]) => db.prepare(`
            INSERT OR IGNORE INTO session_experiments (session_id, variant, assigned_at)
            VALUES (?, ?, ?)
          `).bind(sessionId, variant, Date.now())));
        } catch { /* optional additive schema */ }
      }

      const conversions = events.filter((event) => event.type === 'conversion' && event.conversionKind);
      if (conversions.length) {
        try {
          await db.batch(conversions.map((event) => db.prepare(`
            INSERT OR REPLACE INTO conversion_attribution
              (conversion_event_id, conversion_kind, source_intervention_id, assisted)
            VALUES (?, ?, ?, ?)
          `).bind(event.id, event.conversionKind, event.sourceInterventionId || null, event.assisted ? 1 : 0)));
        } catch { /* optional additive schema */ }
      }

      return { accepted: events.length };
    },

    async storeModelDiagnostic(diagnostic) {
      return db.prepare(`
        INSERT INTO model_diagnostics
          (id, session_id, occurred_at, task, model, fallback_count, latency_ms, succeeded)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        diagnostic.id,
        diagnostic.sessionId || null,
        diagnostic.occurredAt,
        diagnostic.task,
        diagnostic.model || null,
        diagnostic.fallbackCount,
        diagnostic.latencyMs ?? null,
        diagnostic.succeeded ? 1 : 0,
      ).run();
    },
  };
}

export function getStorage(env) {
  return createD1Storage(env?.DB);
}

export async function storeModelDiagnosticBestEffort(env, diagnostic) {
  const storage = getStorage(env);
  if (!storage) return false;
  try {
    await storage.storeModelDiagnostic({
      id: diagnostic.id || crypto.randomUUID(),
      sessionId: clean(diagnostic.sessionId, 100) || null,
      occurredAt: Number.isFinite(diagnostic.occurredAt) ? Math.round(diagnostic.occurredAt) : Date.now(),
      task: clean(diagnostic.task, 40) || 'unknown',
      model: clean(diagnostic.model, 100) || null,
      fallbackCount: Number.isInteger(diagnostic.fallbackCount) ? Math.max(0, Math.min(8, diagnostic.fallbackCount)) : 0,
      latencyMs: Number.isFinite(diagnostic.latencyMs) ? Math.max(0, Math.round(diagnostic.latencyMs)) : null,
      succeeded: Boolean(diagnostic.succeeded),
    });
    return true;
  } catch {
    return false;
  }
}
