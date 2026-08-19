const baseUrl = process.env.PREVIEW_BASE_URL;
const expectedCommit = process.env.EXPECTED_COMMIT;

if (!baseUrl) throw new Error('PREVIEW_BASE_URL is required');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForCurrentDeployment() {
  let lastError = 'preview not ready';
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/health`, {}, 8_000);
      if (response.ok) {
        const health = await response.json();
        const commitMatches = !expectedCommit || health?.deployment?.commit === expectedCommit;
        if (health?.ok && commitMatches) return health;
        lastError = `health ready but commit=${health?.deployment?.commit ?? 'unknown'}`;
      } else {
        lastError = `health returned ${response.status}`;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    console.log(`Preview wait ${attempt}/30: ${lastError}`);
    await sleep(5_000);
  }
  throw new Error(`Cloudflare preview did not become current: ${lastError}`);
}

async function expectHtml(path) {
  const response = await fetchWithTimeout(`${baseUrl}${path}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || !contentType.includes('text/html')) {
    throw new Error(`${path} failed: status=${response.status} content-type=${contentType}`);
  }
  const body = await response.text();
  if (!body.includes('id="root"')) throw new Error(`${path} did not return the app shell`);
  console.log(`OK ${path}`);
}

async function verifyDecisionGeneration() {
  const response = await fetchWithTimeout(`${baseUrl}/api/decision`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      niche: 'homepage',
      memory: {
        sessionId: 'preview-smoke',
        currentPage: '/',
        pageHistory: [{ path: '/', visits: 1 }],
        inferred: { stage: 'high-intent', confidence: 0.9 },
        salesman: { interventionsShown: 0, interventionsIgnored: 0, interventionsDismissed: 0, suppressionLevel: 0, history: [] },
      },
      signal: { type: 'explicit_help', page: '/' },
      verifiedFacts: { product: 'AI Salesman preview smoke check' },
      allowedActions: ['open_experience'],
    }),
  }, 15_000);

  if (!response.ok) throw new Error(`/api/decision returned ${response.status}`);
  const payload = await response.json();
  const decision = payload?.decision;
  if (!payload?.ok || !decision || !['silent', 'intervene'].includes(decision.action)) {
    throw new Error('/api/decision returned an invalid decision contract');
  }
  if (!decision?.diagnostics?.model) {
    throw new Error('/api/decision did not confirm a live model response');
  }
  console.log(`OK /api/decision via ${decision.diagnostics.model}`);
}

const health = await waitForCurrentDeployment();
console.log('Current preview health:', JSON.stringify(health));

if (!health?.readiness?.aiConfigured) throw new Error('GEMINI_API_KEY is not configured in this Cloudflare environment');
if (!health?.readiness?.d1Configured) throw new Error('D1 DB binding is not configured in this Cloudflare environment');
if (!health?.readiness?.d1SchemaProbeOk) throw new Error('D1 is bound but the schema readiness probe failed');
if (!health?.readiness?.leadStorageConfigured) throw new Error('D1 leads schema is missing; run migrations/0001_leads.sql');
if (!health?.readiness?.analyticsStorageConfigured) throw new Error('D1 conversion-events schema is missing; run migrations/0002_conversion_events.sql');
if (!health?.readiness?.experimentStorageConfigured || !health?.readiness?.attributionStorageConfigured || !health?.readiness?.modelDiagnosticsConfigured) {
  throw new Error('D1 extended measurement schema is missing; run migrations/0003_attribution_and_model_diagnostics.sql');
}

for (const path of ['/', '/hpl', '/yachts', '/law-firms', '/playground']) {
  await expectHtml(path);
}

await verifyDecisionGeneration();
console.log('Cloudflare runtime smoke test passed.');
