import { Badge, Surface } from '../design-system';
import { deriveSessionMetrics } from '../analytics/metrics';
import type { ExperimentVariant } from '../analytics/experiment';
import type { SessionMemory } from '../salesman/memory/types';

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function SessionMetricsPanel({ memory, variant }: { memory: SessionMemory; variant: ExperimentVariant }) {
  const metrics = deriveSessionMetrics(memory, variant);
  const rows = [
    ['Variant', metrics.variant],
    ['Stage', metrics.stage],
    ['Interventions', String(metrics.interventionsShown)],
    ['Clicks', String(metrics.interventionsClicked)],
    ['Ignored', String(metrics.interventionsIgnored)],
    ['Dismissed', String(metrics.interventionsDismissed)],
    ['Click-through', percent(metrics.clickThroughRate)],
    ['Negative signals', percent(metrics.negativeSignalRate)],
    ['Suppression', String(metrics.suppressionLevel)],
  ];

  return (
    <Surface tone="soft" className="session-metrics-panel">
      <div className="session-metrics-panel__heading">
        <Badge tone="accent">Test-session metrics</Badge>
        <span>No cross-session profile</span>
      </div>
      <dl>
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <p>Persistent lift analysis joins anonymous session variant, semantic conversion events and optional assisted-attribution rows in D1. This panel stays scoped to the current browser session.</p>
    </Surface>
  );
}
