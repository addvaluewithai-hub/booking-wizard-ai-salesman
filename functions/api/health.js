function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function probeD1(db) {
  if (!db?.prepare) {
    return {
      configured: false,
      leadSchemaReady: false,
      analyticsSchemaReady: false,
      schemaProbeOk: false,
    };
  }

  try {
    const result = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('leads', 'conversion_events')")
      .all();
    const names = new Set((result?.results ?? []).map((row) => row?.name));

    return {
      configured: true,
      leadSchemaReady: names.has('leads'),
      analyticsSchemaReady: names.has('conversion_events'),
      schemaProbeOk: true,
    };
  } catch {
    return {
      configured: true,
      leadSchemaReady: false,
      analyticsSchemaReady: false,
      schemaProbeOk: false,
    };
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
    },
    deployment: {
      branch: env.CF_PAGES_BRANCH ?? null,
      commit: env.CF_PAGES_COMMIT_SHA ?? null,
    },
  });
}
