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

      // The measurement schema in migration 0003 is additive. Base event persistence
      // remains healthy if those tables are temporarily unavailable.
      const sessionRows = new Map();
      for (const event of events) {
        if (!event.sessionId || !event.experimentVariant) continue;
        const current = sessionRows.get(event.sessionId);
        sessionRows.set(event.sessionId, {
          sessionId: event.sessionId,
          firstSeenAt: current ? Math.min(current.firstSeenAt, event.at) : event.at,
          lastSeenAt: current ? Math.max(current.lastSeenAt, event.at) : event.at,
          niche: event.niche,
          experimentVariant: event.experimentVariant,
        });
      }
      if (sessionRows.size) {
        try {
          await db.batch([...sessionRows.values()].map((session) => db.prepare(`
            INSERT INTO sessions (session_id, first_seen_at, last_seen_at, niche, experiment_variant)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
              first_seen_at = MIN(sessions.first_seen_at, excluded.first_seen_at),
              last_seen_at = MAX(sessions.last_seen_at, excluded.last_seen_at),
              niche = excluded.niche,
              experiment_variant = excluded.experiment_variant
          `).bind(
            session.sessionId,
            session.firstSeenAt,
            session.lastSeenAt,
            session.niche,
            session.experimentVariant,
          )));
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
