function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

const REQUIRED_TABLES = [
  'leads',
  'conversion_events',
  'session_experiments',
  'conversion_attribution',
  'model_diagnostics',
];

async function probeD1(db) {
  const empty = {
    configured: false,
    leadSchemaReady: false,
    analyticsSchemaReady: false,
    experimentSchemaReady: false,
    attributionSchemaReady: false,
    modelDiagnosticsSchemaReady: false,
    extendedMeasurementReady: false,
    schemaProbeOk: false,
  };
  if (!db?.prepare) return empty;

  try {
    const placeholders = REQUIRED_TABLES.map(() => '?').join(', ');
    const result = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`)
      .bind(...REQUIRED_TABLES)
      .all();
    const names = new Set((result?.results ?? []).map((row) => row?.name));
    const experimentSchemaReady = names.has('session_experiments');
    const attributionSchemaReady = names.has('conversion_attribution');
    const modelDiagnosticsSchemaReady = names.has('model_diagnostics');

    return {
      configured: true,
      leadSchemaReady: names.has('leads'),
      analyticsSchemaReady: names.has('conversion_events'),
      experimentSchemaReady,
      attributionSchemaReady,
      modelDiagnosticsSchemaReady,
      extendedMeasurementReady: experimentSchemaReady && attributionSchemaReady && modelDiagnosticsSchemaReady,
      schemaProbeOk: true,
    };
  } catch {
    return { ...empty, configured: true };
  }
}

export async function onRequestGet(context) {
  const env = context.env ?? {};
  const d1 = await probeD1(env.DB);

  return json({
    ok: true,
    app: 'booking-wizard-ai-salesman',
    version: '0.1.0',
    readiness: {
      aiConfigured: Boolean(env.GEMINI_API_KEY),
      d1Configured: d1.configured,
      d1SchemaProbeOk: d1.schemaProbeOk,
      leadStorageConfigured: d1.leadSchemaReady,
      analyticsStorageConfigured: d1.analyticsSchemaReady,
      experimentStorageConfigured: d1.experimentSchemaReady,
      attributionStorageConfigured: d1.attributionSchemaReady,
      modelDiagnosticsConfigured: d1.modelDiagnosticsSchemaReady,
      extendedMeasurementConfigured: d1.extendedMeasurementReady,
    },
    deployment: {
      branch: env.CF_PAGES_BRANCH ?? null,
      commit: env.CF_PAGES_COMMIT_SHA ?? null,
    },
  });
}
