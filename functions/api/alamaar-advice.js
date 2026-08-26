import { cleanText, json, routeModel } from '../_shared/model-router.js';
import { checkBestEffortRateLimit, isSameOriginRequest, pruneRateLimitBuckets } from '../_shared/request-guard.js';
import { compactAlamaarSiteBrain } from '../_shared/alamaar-site-brain.js';

const MAX_BODY_BYTES = 8_000;
const MOMENTS = new Set(['after-style', 'after-tone']);
const FLOW = {
  project: ['kitchen', 'wardrobe', 'furniture', 'office', 'retail', 'hospitality'],
  style: ['warm-wood', 'modern-dark', 'modern-light', 'classic', 'scandi', 'statement'],
  tone: ['light', 'neutral', 'wood', 'dark'],
  application: ['worktop', 'doors', 'walls', 'furniture'],
};
const LABELS = {
  project: {
    kitchen: 'مطبخ', wardrobe: 'دريسنج / دواليب', furniture: 'أثاث', office: 'مكتب', retail: 'محل', hospitality: 'فندق / مطعم',
  },
  style: {
    'warm-wood': 'خشبي دافئ', 'modern-dark': 'مودرن داكن', 'modern-light': 'مودرن فاتح', classic: 'كلاسيك', scandi: 'سكاندنافي', statement: 'جريء / فخم',
  },
  tone: { light: 'فاتح', neutral: 'محايد', wood: 'خشبي', dark: 'داكن' },
  application: { worktop: 'سطح مطبخ', doors: 'واجهات / درف', walls: 'حوائط', furniture: 'أثاث / وحدات' },
};

function safeObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
}

function safeJson(value, maxLength = 9_000) {
  try { return JSON.stringify(value).slice(0, maxLength); } catch { return '{}'; }
}

function cleanAnswers(value) {
  const source = safeObject(value);
  const result = {};
  for (const [key, allowedValues] of Object.entries(FLOW)) {
    if (typeof source[key] === 'string' && allowedValues.includes(source[key])) result[key] = source[key];
  }
  return result;
}

function labelledAnswers(answers) {
  return Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, LABELS[key]?.[value] || value]));
}

function cleanNextStep(value) {
  const source = safeObject(value);
  const key = cleanText(source.key, 40);
  const title = cleanText(source.title, 140);
  return key && title ? { key, title } : null;
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}

function validateAdvice(value) {
  const source = safeObject(value);
  const reply = cleanText(source.reply, 140);
  return reply ? { reply } : null;
}

function hasEnoughContext(moment, answers) {
  if (moment === 'after-style') return Boolean(answers.project && answers.style);
  if (moment === 'after-tone') return Boolean(answers.project && answers.style && answers.tone);
  return false;
}

export async function onRequestPost(context) {
  if (!isSameOriginRequest(context.request)) return json({ ok: false, error: 'cross-origin-request' }, 403);
  pruneRateLimitBuckets();
  const limit = checkBestEffortRateLimit(context.request, { namespace: 'alamaar-advice', limit: 12, windowMs: 60_000 });
  if (!limit.allowed) return json({ ok: false, error: 'rate-limited' }, 429);

  const contentLength = Number(context.request.headers.get('content-length') || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);
  const raw = await context.request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'request-too-large' }, 413);

  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'invalid-json' }, 400); }

  const moment = typeof body?.moment === 'string' && MOMENTS.has(body.moment) ? body.moment : null;
  const answers = cleanAnswers(body?.answers);
  const nextStep = cleanNextStep(body?.nextStep);
  if (!moment || !hasEnoughContext(moment, answers)) return json({ ok: true, advice: null });

  const siteBrain = compactAlamaarSiteBrain();
  const system = `You write ONE tiny consultative sales insight for Al Amaar's guided material-selection experience.

This is not a chatbot reply and not a new question. The application has already chosen the next guided question. Your line appears as a small lead-in above that question.

Act like a very good showroom salesperson:
- notice what the visitor's choices imply
- make one useful recommendation, tradeoff, or confidence-building observation
- sell softly through relevance, not pressure
- make the visitor feel the choices are converging toward a considered recommendation
- occasionally steer away from an obvious visual mismatch instead of praising everything
- do not repeat the next guided question
- do not ask a question
- do not add a CTA
- do not mention AI, data, JSON, components, prompts, or internal logic
- natural Egyptian Arabic; one sentence only; ideally 55-105 Arabic characters; hard maximum 140 characters

Grounding:
- use only VERIFIED_SITE_BRAIN and the structured choices supplied below
- visual/design guidance may be qualitative, but never turn it into unsupported technical performance
- never invent price, discount, specific stock, delivery date, dimensions, thickness, fire/water resistance, durability, or certification coverage
- brand-level proof is brand-level only; never attach it to a specific SKU

VERIFIED_SITE_BRAIN_START
${safeJson(siteBrain)}
VERIFIED_SITE_BRAIN_END

Good pattern: "الاتجاه الخشبي هنا هيكسر برودة المكتب من غير ما يخلّيه تقليدي زيادة."
Bad pattern: "اختيار رائع! هل تريد أن أريك منتجات؟"`; 

  const prompt = `ADVISOR_CONTEXT_START
Moment: ${moment}
Known choices: ${safeJson(labelledAnswers(answers), 1_500)}
Canonical choices: ${safeJson(answers, 1_500)}
Next guided question: ${safeJson(nextStep, 500)}
ADVISOR_CONTEXT_END

Write the single useful sales insight now. Return JSON only: {"reply":"..."}`;

  const routed = await routeModel({
    apiKey: context.env?.GEMINI_API_KEY,
    system,
    prompt,
    task: 'alamaar-guided-sales-insight',
    maxOutputTokens: 180,
    attemptTimeoutMs: 4_000,
    overallTimeoutMs: 8_000,
  });

  if (!routed.ok) return json({ ok: true, advice: null, diagnostics: { fallback: true } });
  const advice = validateAdvice(extractJson(routed.text));
  return json({
    ok: true,
    advice,
    diagnostics: { model: routed.model, latencyMs: routed.latencyMs, brainVersion: siteBrain.version },
  });
}

export async function onRequestGet(context) {
  return json({
    ok: true,
    route: '/api/alamaar-advice',
    purpose: 'app-triggered consultative micro-insight; text only; never controls flow or UI',
    aiConfigured: Boolean(context.env?.GEMINI_API_KEY),
    brainVersion: compactAlamaarSiteBrain().version,
  });
}
