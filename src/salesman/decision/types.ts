export type SalesmanDecision = {
  action: 'silent' | 'intervene';
  message?: string;
  internalReason: string;
  confidence: number;
  cooldownSeconds: number;
  experienceHint?: string;
  diagnostics?: {
    model?: string;
    fallbackCount?: number;
    latencyMs?: number;
  };
};

export const SILENT_DECISION: SalesmanDecision = {
  action: 'silent',
  internalReason: 'Deterministic fallback: remain silent.',
  confidence: 1,
  cooldownSeconds: 45,
};
