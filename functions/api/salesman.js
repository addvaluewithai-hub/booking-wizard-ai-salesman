const MODEL_CHAIN = [
  'gemma-4-26b-a4b-it',
  'gemma-4-31b-it',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
];

const RETRYABLE_STATUSES = new Set([400, 404, 408, 409, 429, 500, 502, 503, 504]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

async function callModel({ apiKey, model, system, prompt }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 220,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  return {
    ok: response.ok && Boolean(text),
    status: response.status,
    text,
    payload,
  };
}

export async function onRequestPost(context) {
  const apiKey = context.env?.GEMINI_API_KEY;
  if (!apiKey) {
    return json({
      ok: false,
      error: 'GEMINI_API_KEY is not configured in the Cloudflare Pages environment.',
    }, 503);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON request body.' }, 400);
  }

  const system = cleanText(body?.system, 6000);
  const prompt = cleanText(body?.prompt, 12000);

  if (!system || !prompt) {
    return json({ ok: false, error: 'Both system and prompt are required.' }, 400);
  }

  const attempts = [];

  for (const model of MODEL_CHAIN) {
    try {
      const result = await callModel({ apiKey, model, system, prompt });
      attempts.push({ model, status: result.status, ok: result.ok });

      if (result.ok) {
        return json({
          ok: true,
          model,
          text: result.text,
          attempts,
        });
      }

      if (!RETRYABLE_STATUSES.has(result.status)) {
        return json({
          ok: false,
          error: 'Gemini API rejected the request.',
          model,
          status: result.status,
          attempts,
        }, result.status || 502);
      }
    } catch (error) {
      attempts.push({ model, status: 'network-error', ok: false });
    }
  }

  return json({
    ok: false,
    error: 'All configured free-quota models were unavailable. The UI should fall back gracefully and try again later.',
    attempts,
  }, 503);
}

export async function onRequestGet() {
  return json({
    ok: true,
    route: '/api/salesman',
    models: MODEL_CHAIN,
    note: 'POST only for generation. API key stays server-side.',
  });
}
