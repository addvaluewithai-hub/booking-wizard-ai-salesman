import { cleanText, json } from '../_shared/model-router.js';
import { checkBestEffortRateLimit, isSameOriginRequest, pruneRateLimitBuckets } from '../_shared/request-guard.js';
import { getStorage } from '../_shared/storage.js';

const MAX_BODY_BYTES = 18_000;
const ALLOWED_NICHES = new Set(['homepage', 'hpl', 'yachts', 'law-firms']);

function sanitizeFields(value) {
  const fields = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    name: cleanText(fields.name, 100),
    email: cleanText(fields.email, 180).toLowerCase(),
    phone: cleanText(fields.phone, 60),
    company: cleanText(fields.company, 140),
    url: cleanText(fields.url, 300),
  };
}
function validEmail(value) { return /^\S+@\S+\.\S+$/.test(value) && value.length <= 180; }
function validUrl(value) { if (!value) return true; try { const parsed = new URL(value); return parsed.protocol === 'https:' || parsed.protocol === 'http:'; } catch { return false; } }
function safeContext(value) { if (!value || typeof value !== 'object') return {}; const serialized = JSON.stringify(value); if (serialized.length > 8_000) return {}; return value; }

export async function onRequestPost(context) {
  if (!isSameOriginRequest(context.request)) return json({ ok: false, error: 'cross-origin-request' }, 403);
  pruneRateLimitBuckets();
  const limit = checkBestEffortRateLimit(context.request, { namespace: 'lead', limit: 8, windowMs: 60_000 });
  if (!limit.allowed) return json({ ok: false, error: 'rate-limited' }, 429);

  const contentLength = Number(context.request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);
  const raw = await context.request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);

  let body; try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid-json' }, 400); }
  if (body?.company_website) return json({ ok: true, stored: false });
  const niche = ALLOWED_NICHES.has(body?.niche) ? body.niche : 'homepage';
  const fields = sanitizeFields(body?.fields);
  const sessionContext = safeContext(body?.context);
  if (!fields.name || !validEmail(fields.email) || !validUrl(fields.url)) return json({ ok: false, error: 'invalid-lead-fields' }, 400);

  const storage = getStorage(context.env);
  if (!storage) return json({ ok: false, error: 'lead-storage-not-configured' }, 503);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  try {
    await storage.storeLead({
      id,
      createdAt,
      niche,
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      company: fields.company,
      websiteUrl: fields.url,
      contextJson: JSON.stringify(sessionContext),
    });
  } catch { return json({ ok: false, error: 'lead-storage-failed' }, 500); }
  return json({ ok: true, stored: true, id });
}

export async function onRequestGet() {
  return json({ ok: true, route: '/api/lead', storage: 'Storage adapter backed by Cloudflare D1 binding DB', note: 'POST only; field validation, same-origin and best-effort rate limiting enabled.' });
}
