import { json } from '../_shared/model-router.js';
import { checkBestEffortRateLimit, isSameOriginRequest, pruneRateLimitBuckets } from '../_shared/request-guard.js';
import { getStorage } from '../_shared/storage.js';

const ALLOWED_NICHES = new Set(['homepage', 'hpl', 'yachts', 'law-firms']);
const ALLOWED_TYPES = new Set([
  'page_view','section_view','product_view','product_revisit','compare_add','compare_remove','filter_change','price_view','spec_view',
  'cta_view','cta_click','form_start','form_abandon','booking_start','booking_abandon','salesman_impression','salesman_click','salesman_dismiss',
  'salesman_ignore','experience_open','experience_answer','experience_complete','experience_close','conversion','explicit_help',
]);
const MAX_BODY_BYTES = 24_000;

function clean(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function normalizeEvent(value) {
  if (!value || typeof value !== 'object') return null;
  const id = clean(value.id, 100);
  const sessionId = clean(value.sessionId, 100);
  const type = clean(value.type, 60);
  const niche = ALLOWED_NICHES.has(value.niche) ? value.niche : 'homepage';
  const page = clean(value.page, 180);
  const entityId = clean(value.entityId, 120);
  const stage = clean(value.stage, 40);
  const at = typeof value.at === 'number' && Number.isFinite(value.at) ? Math.round(value.at) : Date.now();
  const suppressionLevel = Number.isInteger(value.suppressionLevel) ? Math.max(0, Math.min(3, value.suppressionLevel)) : 0;
  const experimentVariant = value.experimentVariant === 'control' || value.experimentVariant === 'treatment' ? value.experimentVariant : '';
  const conversionKind = type === 'conversion' ? clean(value.conversionKind, 100) : '';
  const sourceInterventionId = type === 'conversion' ? clean(value.sourceInterventionId, 100) : '';
  const assisted = type === 'conversion' ? Boolean(value.assisted && sourceInterventionId) : false;
  if (!id || !sessionId || !page || !ALLOWED_TYPES.has(type)) return null;
  return { id, sessionId, type, niche, page, entityId, stage, at, suppressionLevel, experimentVariant, conversionKind, sourceInterventionId, assisted };
}

export async function onRequestPost(context) {
  if (!isSameOriginRequest(context.request)) return json({ ok: false, error: 'cross-origin-request' }, 403);
  pruneRateLimitBuckets();
  const limit = checkBestEffortRateLimit(context.request, { namespace: 'event', limit: 80, windowMs: 60_000 });
  if (!limit.allowed) return json({ ok: false, error: 'rate-limited' }, 429);

  const contentLength = Number(context.request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);
  const raw = await context.request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);

  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid-json' }, 400); }
  const events = Array.isArray(body?.events) ? body.events.slice(0, 20).map(normalizeEvent).filter(Boolean) : [];
  if (!events.length) return json({ ok: false, error: 'events-required' }, 400);

  const storage = getStorage(context.env);
  if (!storage) return json({ ok: true, stored: false, accepted: events.length });

  try {
    await storage.storeEvents(events);
    return json({ ok: true, stored: true, accepted: events.length });
  } catch {
    return json({ ok: false, error: 'event-storage-failed' }, 500);
  }
}

export async function onRequestGet() {
  return json({ ok: true, route: '/api/event', storage: 'Storage adapter backed by optional D1 DB binding', privacy: 'semantic events + session-scoped anonymous ID + experiment/attribution metadata only' });
}
