# Measurement and experiment queries

The measurement model is intentionally small enough to answer the product questions without creating a durable behavioral profile.

The core questions are:

1. Did treatment sessions convert more often than control sessions?
2. Did proactive treatment create more ignore/dismiss signals?
3. Which conversions were assisted by a clicked intervention?
4. Are model latency/fallback patterns getting worse?

Migration `0003_attribution_and_model_diagnostics.sql` must be applied before the experiment/attribution/diagnostic queries below are available.

## Experiment activation

`useSalesmanEngine()` accepts `controlGroupPercent`. The assignment is deterministic from the anonymous session ID. Control sessions suppress proactive scheduler calls while explicit visitor-requested help remains available.

Public demos default to `controlGroupPercent: 0` so a demo visitor is not randomly denied the feature. A real experiment should enable a deliberate control percentage in the host integration, normally starting small.

Factual rules, datasets, safety validators, and conversion UX must remain identical across variants. The experiment changes proactive intervention availability, not business truth.

## Conversion rate by variant

This query counts distinct anonymous sessions and whether each session recorded at least one semantic conversion event.

```sql
WITH converted AS (
  SELECT DISTINCT session_id
  FROM conversion_events
  WHERE event_type = 'conversion'
)
SELECT
  s.experiment_variant,
  COUNT(*) AS sessions,
  SUM(CASE WHEN c.session_id IS NOT NULL THEN 1 ELSE 0 END) AS converted_sessions,
  ROUND(
    100.0 * SUM(CASE WHEN c.session_id IS NOT NULL THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) AS conversion_rate_pct
FROM sessions s
LEFT JOIN converted c ON c.session_id = s.session_id
GROUP BY s.experiment_variant
ORDER BY s.experiment_variant;
```

Interpret this as directional experiment evidence, not causal certainty by itself. Sample size, traffic mix, seasonality, implementation changes, and concurrent campaigns still matter.

## Ignore/dismiss pressure by variant

```sql
SELECT
  s.experiment_variant,
  SUM(CASE WHEN e.event_type = 'salesman_impression' THEN 1 ELSE 0 END) AS impressions,
  SUM(CASE WHEN e.event_type = 'salesman_ignore' THEN 1 ELSE 0 END) AS ignores,
  SUM(CASE WHEN e.event_type = 'salesman_dismiss' THEN 1 ELSE 0 END) AS dismissals,
  ROUND(
    100.0 * SUM(CASE WHEN e.event_type IN ('salesman_ignore', 'salesman_dismiss') THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN e.event_type = 'salesman_impression' THEN 1 ELSE 0 END), 0),
    2
  ) AS negative_signal_rate_pct
FROM sessions s
LEFT JOIN conversion_events e ON e.session_id = s.session_id
GROUP BY s.experiment_variant
ORDER BY s.experiment_variant;
```

The control group should normally have zero proactive impressions. Explicit-help interactions can still exist by design, so investigate any unexpected control impressions rather than automatically treating them as corruption.

## Assisted versus direct conversions

```sql
SELECT
  a.conversion_kind,
  SUM(CASE WHEN a.assisted = 1 THEN 1 ELSE 0 END) AS assisted,
  SUM(CASE WHEN a.assisted = 0 THEN 1 ELSE 0 END) AS direct,
  COUNT(*) AS total
FROM conversion_attribution a
GROUP BY a.conversion_kind
ORDER BY total DESC;
```

A conversion is marked assisted only when a completed conversion has a recent clicked intervention ID in the same browser session. The source intervention ID is an opaque event identifier, not model reasoning.

## Intervention funnel

```sql
SELECT
  event_type,
  COUNT(*) AS events
FROM conversion_events
WHERE event_type IN (
  'salesman_impression',
  'salesman_click',
  'salesman_ignore',
  'salesman_dismiss',
  'experience_open',
  'experience_answer',
  'experience_complete',
  'conversion'
)
GROUP BY event_type
ORDER BY event_type;
```

For longitudinal analysis, add a bounded `occurred_at` window rather than querying all history by default.

## Model routing and latency

```sql
SELECT
  task,
  model,
  succeeded,
  COUNT(*) AS calls,
  ROUND(AVG(latency_ms), 0) AS avg_latency_ms,
  ROUND(AVG(fallback_count), 2) AS avg_fallback_count,
  MAX(latency_ms) AS max_latency_ms
FROM model_diagnostics
GROUP BY task, model, succeeded
ORDER BY task, calls DESC;
```

No raw prompt, hidden system text, visitor free text, or lead PII is stored in `model_diagnostics`.

## Privacy guardrails for analysis

- Prefer aggregate queries over per-session browsing.
- Do not join qualified lead PII into behavioral analysis unless a customer has a documented lawful purpose and retention policy.
- Keep anonymous events/minimal sessions within the retention target in `SECURITY_PRIVACY.md`.
- Do not infer or persist sensitive traits from behavior.
- Do not turn the anonymous session ID into a cross-session identity.
