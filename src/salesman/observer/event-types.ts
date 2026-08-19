export type VisitorEventType =
  | 'page_view'
  | 'section_view'
  | 'product_view'
  | 'product_revisit'
  | 'compare_add'
  | 'compare_remove'
  | 'filter_change'
  | 'price_view'
  | 'spec_view'
  | 'cta_view'
  | 'cta_click'
  | 'form_start'
  | 'form_abandon'
  | 'booking_start'
  | 'booking_abandon'
  | 'salesman_impression'
  | 'salesman_click'
  | 'salesman_dismiss'
  | 'salesman_ignore'
  | 'experience_open'
  | 'experience_answer'
  | 'experience_complete'
  | 'experience_close'
  | 'conversion'
  | 'explicit_help';

export type VisitorEventMetadataValue = string | number | boolean | string[] | null;

export type VisitorEvent = {
  id: string;
  at: number;
  type: VisitorEventType;
  page: string;
  entityId?: string;
  metadata?: Record<string, VisitorEventMetadataValue>;
};

export type VisitorEventInput = Omit<VisitorEvent, 'id' | 'at'> & {
  id?: string;
  at?: number;
};

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createVisitorEvent(input: VisitorEventInput): VisitorEvent {
  return {
    ...input,
    id: input.id ?? randomId(),
    at: input.at ?? Date.now(),
  };
}

export function isMeaningfulEventType(type: VisitorEventType): boolean {
  return !['cta_view', 'section_view'].includes(type);
}
