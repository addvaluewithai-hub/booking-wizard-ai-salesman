import type { ExperienceAnswer, ExperienceComponent, ExperienceData, ExperiencePlan, ExperienceUploadHandler } from './types';
import {
  DatePickerBlock,
  FAQBlock,
  MultiSelectBlock,
  QuantityBlock,
  RangeBlock,
  SingleSelectBlock,
  SummaryBlock,
  TimeSlotsBlock,
  YesNoBlock,
} from './components/BasicComponents';
import { ComparisonBlock, ImageChoiceBlock, ProductCardsBlock, RecommendationReasonBlock } from './components/EntityComponents';
import { ActionRequestBlock, ConsultationBlock, LeadCaptureBlock, type ConversionPayload } from './components/ConversionComponents';
import { CallOrWhatsAppBlock, UploadImageBlock } from './components/IntegrationComponents';

export const EXPERIENCE_COMPONENT_REGISTRY = {
  single_select: 'choice',
  multi_select: 'choice',
  yes_no: 'choice',
  range: 'choice',
  quantity: 'choice',
  product_cards: 'entity',
  comparison: 'entity',
  recommendation_reason: 'entity',
  image_choice: 'entity',
  upload_image: 'integration',
  date_picker: 'booking',
  time_slots: 'booking',
  add_ons: 'booking',
  lead_capture: 'conversion',
  sample_request: 'conversion',
  quote_request: 'conversion',
  book_consultation: 'conversion',
  call_or_whatsapp: 'conversion',
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
  onUploadAsset?: ExperienceUploadHandler;
};

export function ExperienceRenderer({ plan, data, answers, onAnswer, onConvert, onLeadSubmit, onUploadAsset }: RendererProps) {
  const render = (component: ExperienceComponent) => {
    const answer = answers[component.id];
    switch (component.type) {
      case 'single_select': return <SingleSelectBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'multi_select': return <MultiSelectBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'yes_no': return <YesNoBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'add_ons': return <MultiSelectBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'range': return <RangeBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'quantity': return <QuantityBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'date_picker': return <DatePickerBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'time_slots': return <TimeSlotsBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'product_cards': return <ProductCardsBlock component={component} entities={data.entities} />;
      case 'comparison': return <ComparisonBlock component={component} entities={data.entities} />;
      case 'recommendation_reason': return <RecommendationReasonBlock component={component} entities={data.entities} />;
      case 'image_choice': return <ImageChoiceBlock component={component} entities={data.entities} value={answer} onAnswer={(value) => onAnswer(component.id, value)} />;
      case 'upload_image': return <UploadImageBlock component={component} value={answer} onAnswer={(value) => onAnswer(component.id, value)} onUploadAsset={onUploadAsset} />;
      case 'sample_request': return <ActionRequestBlock component={component} entities={data.entities} onConvert={onConvert} />;
      case 'quote_request': return <ActionRequestBlock component={component} entities={data.entities} onConvert={onConvert} />;
      case 'lead_capture': return <LeadCaptureBlock component={component} onSubmit={onLeadSubmit} />;
      case 'book_consultation': return <ConsultationBlock component={component} onConvert={onConvert} />;
      case 'call_or_whatsapp': return <CallOrWhatsAppBlock component={component} contact={data.contacts?.[component.contactKey]} />;
      case 'faq': return <FAQBlock component={component} />;
      case 'summary': return <SummaryBlock component={component} />;
    }
  };

  return <div className="exp-renderer">{plan.components.map((component) => <div key={component.id}>{render(component)}</div>)}</div>;
}
