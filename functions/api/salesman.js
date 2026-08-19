import { cleanText, json, MODEL_CHAIN, routeModel } from '../_shared/model-router.js';

const MAX_BODY_BYTES = 24_000;

export async function onRequestPost(context) {
  const contentLength = Number(context.request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);

  const raw = await context.request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  const system = cleanText(body?.system, 6_000);
  const prompt = cleanText(body?.prompt, 12_000);
  if (!system || !prompt) return json({ ok: false, error: 'system-and-prompt-required' }, 400);

  const routed = await routeModel({
    apiKey: context.env?.GEMINI_API_KEY,
    system,
    prompt,
    task: 'legacy-copy',
    maxOutputTokens: 220,
  });

  if (!routed.ok) {
    return json({
      ok: false,
      error: routed.error,
      attempts: routed.attempts,
    }, routed.error === 'missing-api-key' ? 503 : 502);
  }

  return json({
    ok: true,
    model: routed.model,
    text: routed.text,
    attempts: routed.attempts,
  });
}

export async function onRequestGet(context) {
  return json({
    ok: true,
    route: '/api/salesman',
    models: MODEL_CHAIN,
    aiConfigured: Boolean(context.env?.GEMINI_API_KEY),
    note: 'Legacy copy endpoint. Ambient decisions use /api/decision.',
  });
}
