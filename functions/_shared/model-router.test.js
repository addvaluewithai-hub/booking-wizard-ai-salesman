import { afterEach, describe, expect, it, vi } from 'vitest';
import { MODEL_CHAIN, routeModel } from './model-router.js';

function providerResponse(status, text = '') {
  return new Response(JSON.stringify(text ? {
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { totalTokenCount: 12 },
  } : {}), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('model router', () => {
  it('falls through a first-model 429 to the next configured model', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(providerResponse(429))
      .mockResolvedValueOnce(providerResponse(200, '{"action":"silent"}'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await routeModel({
      apiKey: 'test-key',
      system: 'system',
      prompt: 'prompt',
      task: 'decision',
      attemptTimeoutMs: 1_000,
      overallTimeoutMs: 3_000,
    });

    expect(result.ok).toBe(true);
    expect(result.model).toBe(MODEL_CHAIN[1]);
    expect(result.fallbackCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns a safe failure after every configured model is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue(providerResponse(503));
    vi.stubGlobal('fetch', fetchMock);

    const result = await routeModel({
      apiKey: 'test-key',
      system: 'system',
      prompt: 'prompt',
      task: 'decision',
      attemptTimeoutMs: 1_000,
      overallTimeoutMs: 5_000,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('all-models-unavailable');
    expect(result.attempts).toHaveLength(MODEL_CHAIN.length);
  });
});
