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

  return json({
    ok: true,
    app: 'booking-wizard-ai-salesman',
    version: '0.1.0',
    ai: {
      configured: Boolean(env.GEMINI_API_KEY),
    },
    deployment: {
      branch: env.CF_PAGES_BRANCH ?? null,
      commit: env.CF_PAGES_COMMIT_SHA ?? null,
    },
  });
}
