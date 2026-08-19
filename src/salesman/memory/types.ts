export type ConversionStage = 'unknown' | 'exploring' | 'considering' | 'high-intent' | 'converting';
export type PriceSensitivity = 'unknown' | 'low' | 'medium' | 'high';
export type SuppressionLevel = 0 | 1 | 2 | 3;

export type PageMemory = {
  path: string;
  visits: number;
  lastSeenAt: number;
};

export type EntityMemory = {
  views: number;
  totalDwellMs: number;
  lastSeenAt: number;
};

export type InterventionMemory = {
  id: string;
  at: number;
  message: string;
  reason?: string;
  outcome: 'shown' | 'clicked' | 'ignored' | 'dismissed';
};

export type SessionMemory = {
  sessionId: string;
  startedAt: number;
  updatedAt: number;
  locale: string;
  currentPage: string;
  pageHistory: PageMemory[];
  viewedEntities: Record<string, EntityMemory>;
  viewedSections: Record<string, number>;
  comparisonIds: string[];
  selectedFilters: Record<string, string[]>;
  inferred: {
    intent?: string;
    stage: ConversionStage;
    hesitation?: string;
    priceSensitivity: PriceSensitivity;
    confidence: number;
  };
  answers: Record<string, string | number | boolean | string[]>;
  formActive: boolean;
  experienceActive: boolean;
  lastMeaningfulSignalAt?: number;
  recentEventTypes: string[];
  salesman: {
    interventionsShown: number;
    interventionsClicked: number;
    interventionsIgnored: number;
    interventionsDismissed: number;
    lastMessage?: string;
    lastReason?: string;
    lastActionAt?: number;
    cooldownUntil?: number;
    suppressionLevel: SuppressionLevel;
    history: InterventionMemory[];
  };
};
