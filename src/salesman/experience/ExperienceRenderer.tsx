import type { ExperienceAnswer, ExperienceComponent, ExperienceData, ExperiencePlan } from './types';
import {
  DatePickerBlock,
  FAQBlock,
  MultiSelectBlock,
  QuantityBlock,
  RangeBlock,
  SingleSelectBlock,
  SummaryBlock,
  TimeSlotsBlock,
} from './components/BasicComponents';
import { ComparisonBlock, ProductCardsBlock } from './components/EntityComponents';
import { ActionRequestBlock, ConsultationBlock, LeadCaptureBlock, type ConversionPayload } from './components/ConversionComponents';

export const EXPERIENCE_COMPONENT_REGISTRY = {
  single_select: 'choice',
  multi_select: 'choice',
  range: 'choice',
  quantity: 'choice',
  product_cards: 'entity',
  comparison: 'entity',
  date_picker: 'booking',
  time_slots: 'booking',
  add_ons: 'booking',
  lead_capture: 'conversion',
  sample_request: 'conversion',
  quote_request: 'conversion',
  book_consultation: 'conversion',
  faq: 'reassurance',
  summary: 'reassurance',
} as const satisfies Record<ExperienceComponent['type'], string>;

type RendererProps = {
  plan: ExperiencePlan;
  data: ExperienceData;
  answers: Record<string, ExperienceAnswer>;
  onAnswer: (id: string, value: ExperienceAnswer) => void;
  onConvert: (payload: ConversionPayload) => void;
  onLeadSubmit: (fields: Record<string, string>) => Promise<{ ok: boolean; stored?: boolean }>;
};

export function ExperienceRenderer({ plan, data, answers, onAnswer, onConvert, onLeadSubmit }: RendererProps) {
  const render = (component: ExperienceComponent) => {
    const answer = answers[component.id];
    switch (component.type) {
      case 'single_select': return <SingleSelectBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'multi_select': return <MultiSelectBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'add_ons': return <MultiSelectBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'range': return <RangeBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'quantity': return <QuantityBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'date_picker': return <DatePickerBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'time_slots': return <TimeSlotsBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'product_cards': return <ProductCardsBlock component={component} entities={data.entities} />;
      case 'comparison': return <ComparisonBlock component={component} entities={data.entities} />;
      case 'sample_request': return <ActionRequestBlock component={component} entities={data.entities} onConvert={onConvert} />;
      case 'quote_request': return <ActionRequestBlock component={component} entities={data.entities} onConvert={onConvert} />;
      case 'lead_capture': return <LeadCaptureBlock component={component} onSubmit={onLeadSubmit} />;
      case 'book_consultation': return <ConsultationBlock component={component} onConvert={onConvert} />;
      case 'faq': return <FAQBlock component={component} />;
      case 'summary': return <SummaryBlock component={component} />;
    }
  };

  return <div className="exp-renderer">{plan.components.map((component) => <div key={component.id}>{render(component)}</div>)}</div>;
}
