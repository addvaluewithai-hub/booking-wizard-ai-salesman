CREATE TABLE IF NOT EXISTS session_experiments (
  session_id TEXT PRIMARY KEY,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'treatment')),
  assigned_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS conversion_attribution (
  conversion_event_id TEXT PRIMARY KEY,
  conversion_kind TEXT NOT NULL,
  source_intervention_id TEXT,
  assisted INTEGER NOT NULL DEFAULT 0 CHECK (assisted IN (0, 1)),
  FOREIGN KEY (conversion_event_id) REFERENCES conversion_events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversion_attribution_assisted
  ON conversion_attribution(assisted, conversion_kind);

CREATE TABLE IF NOT EXISTS model_diagnostics (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  occurred_at INTEGER NOT NULL,
  task TEXT NOT NULL,
  model TEXT,
  fallback_count INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  succeeded INTEGER NOT NULL DEFAULT 0 CHECK (succeeded IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_model_diagnostics_task_time
  ON model_diagnostics(task, occurred_at);
CREATE INDEX IF NOT EXISTS idx_model_diagnostics_model_time
  ON model_diagnostics(model, occurred_at);
