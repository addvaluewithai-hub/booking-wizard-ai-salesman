CREATE TABLE IF NOT EXISTS conversion_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  niche TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page TEXT NOT NULL,
  entity_id TEXT,
  stage TEXT,
  suppression_level INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_session ON conversion_events(session_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type, occurred_at);
CREATE INDEX IF NOT EXISTS idx_conversion_events_niche ON conversion_events(niche, occurred_at);
