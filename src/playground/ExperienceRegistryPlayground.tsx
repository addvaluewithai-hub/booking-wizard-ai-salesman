import { useState } from 'react';
import { Badge, Surface } from '../design-system';
import { ExperienceRenderer, EXPERIENCE_COMPONENT_REGISTRY } from '../salesman/experience/ExperienceRenderer';
import type { ExperienceAnswer, ExperienceData, ExperiencePlan } from '../salesman/experience/types';

const data: ExperienceData = {
  entities: [
    {
      id: 'DEMO-WALNUT-01',
      name: 'Smoked Walnut',
      subtitle: 'Warm, dark fictional HPL demo finish',
      swatch: 'linear-gradient(135deg,#6f5440,#30251f)',
      attributes: { tone: 'dark warm', finish: 'matte', applications: ['cabinetry', 'wall panels'] },
    },
    {
      id: 'DEMO-OAK-02',
      name: 'Natural Oak',
      subtitle: 'Medium, warm fictional HPL demo finish',
      swatch: 'linear-gradient(135deg,#c19a6b,#7d6047)',
      attributes: { tone: 'medium warm', finish: 'soft grain', applications: ['cabinetry', 'retail'] },
    },
  ],
  contacts: {
    demo_sales: { label: 'Demo sales desk', phoneE164: '+15550101000', whatsappE164: '+15550101000' },
  },
};

const plan: ExperiencePlan = {
  title: 'Trusted component registry',
  intro: 'Every renderer component appears below with deterministic playground data.',
  components: [
    { type: 'single_select', id: 'single', question: 'Primary project type?', options: [{ id: 'residential', label: 'Residential' }, { id: 'commercial', label: 'Commercial' }] },
    { type: 'multi_select', id: 'multi', question: 'Useful priorities?', options: [{ id: 'warm', label: 'Warm' }, { id: 'easy-care', label: 'Easy care' }, { id: 'dark', label: 'Dark' }], max: 2 },
    { type: 'yes_no', id: 'yes-no', question: 'Do you already have a shortlist?' },
    { type: 'range', id: 'range', question: 'Approximate room size', min: 10, max: 100, step: 5, unit: 'm²' },
    { type: 'quantity', id: 'quantity', question: 'How many samples?', min: 1, max: 5 },
    { type: 'product_cards', id: 'products', entityIds: ['DEMO-WALNUT-01', 'DEMO-OAK-02'], reason: 'Grounded from the playground dataset.' },
    { type: 'comparison', id: 'compare', entityIds: ['DEMO-WALNUT-01', 'DEMO-OAK-02'] },
    { type: 'recommendation_reason', id: 'reason', entityId: 'DEMO-WALNUT-01', title: 'Why Smoked Walnut is in this shortlist' },
    { type: 'image_choice', id: 'image-choice', question: 'Which visual direction is closer?', entityIds: ['DEMO-WALNUT-01', 'DEMO-OAK-02'] },
    { type: 'upload_image', id: 'upload', title: 'Add a reference image', description: 'Playground adapter returns an opaque demo asset ID; no file is persisted.', accept: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 5_000_000 },
    { type: 'date_picker', id: 'date', question: 'Preferred date?' },
    { type: 'time_slots', id: 'time', question: 'Preferred time?', slots: ['10:00', '13:30', '16:00'] },
    { type: 'add_ons', id: 'addons', question: 'Optional additions?', options: [{ id: 'delivery', label: 'Delivery' }, { id: 'consult', label: 'Specification review' }] },
    { type: 'lead_capture', id: 'lead', title: 'Example qualified lead capture', fields: ['name', 'email'], submitLabel: 'Test success state' },
    { type: 'sample_request', id: 'sample', entityIds: ['DEMO-WALNUT-01'], title: 'Prepare sample request' },
    { type: 'quote_request', id: 'quote', entityIds: ['DEMO-WALNUT-01', 'DEMO-OAK-02'], title: 'Prepare quote request' },
    { type: 'book_consultation', id: 'consultation', resourceId: 'demo-team', title: 'Route to a consultation' },
    { type: 'call_or_whatsapp', id: 'contact', contactKey: 'demo_sales', title: 'Configured contact actions' },
    { type: 'faq', id: 'faq', title: 'Does the model render arbitrary UI?', body: 'No. Plans select from this trusted registry and deterministic renderer.' },
    { type: 'summary', id: 'summary', title: 'Example summary', items: [{ label: 'Niche', value: 'HPL demo' }, { label: 'Storage', value: 'Opaque IDs only for uploads' }] },
  ],
};

export default function ExperienceRegistryPlayground() {
  const [answers, setAnswers] = useState<Record<string, ExperienceAnswer>>({});
  const [lastAction, setLastAction] = useState('No conversion action fired yet.');

  return (
    <Surface className="registry-playground" tone="soft">
      <div className="registry-playground__meta">
        <Badge tone="accent">{Object.keys(EXPERIENCE_COMPONENT_REGISTRY).length} trusted component types</Badge>
        <span>{lastAction}</span>
      </div>
      <ExperienceRenderer
        plan={plan}
        data={data}
        answers={answers}
        onAnswer={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
        onConvert={(payload) => setLastAction(`Action: ${payload.type}`)}
        onLeadSubmit={async () => ({ ok: true, stored: true })}
        onUploadAsset={async () => ({ assetId: `playground-asset-${Date.now()}` })}
      />
    </Surface>
  );
}
