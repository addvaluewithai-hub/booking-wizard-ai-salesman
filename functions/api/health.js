function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  const env = context.env ?? {};
  const d1Configured = Boolean(env.DB?.prepare);

  return json({
    ok: true,
    app: 'booking-wizard-ai-salesman',
    version: '0.1.0',
    readiness: {
      aiConfigured: Boolean(env.GEMINI_API_KEY),
      d1Configured,
      leadStorageConfigured: d1Configured,
      analyticsStorageConfigured: d1Configured,
    },
    deployment: {
      branch: env.CF_PAGES_BRANCH ?? null,
      commit: env.CF_PAGES_COMMIT_SHA ?? null,
    },
  });
}
