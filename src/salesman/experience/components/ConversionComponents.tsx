import { useState, type FormEvent } from 'react';
import { Badge, Button, Field } from '../../../design-system';
import type { ExperienceComponent, ExperienceEntity, LeadField } from '../types';

type ConversionPayload = {
  type: string;
  entityIds?: string[];
  fields?: Record<string, string>;
  resourceId?: string;
};

export function ActionRequestBlock({
  component,
  entities,
  onConvert,
}: {
  component: Extract<ExperienceComponent, { type: 'sample_request' | 'quote_request' }>;
  entities: ExperienceEntity[];
  onConvert: (payload: ConversionPayload) => void;
}) {
  const [complete, setComplete] = useState(false);
  const ids = component.entityIds ?? [];
  const names = ids.map((id) => entities.find((entity) => entity.id === id)?.name ?? id);
  const type = component.type === 'sample_request' ? 'sample_request' : 'quote_request';

  if (complete) {
    return <section className="exp-success"><Badge tone="success">Ready</Badge><h3>Request context prepared.</h3><p>Your shortlist and answers stay attached, so a production form does not need to ask for the same project details again.</p></section>;
  }

  return (
    <section className="exp-conversion-card">
      <span>{component.type === 'sample_request' ? 'Next step · samples' : 'Next step · project quote'}</span>
      <h3>{component.title ?? (component.type === 'sample_request' ? 'Request these samples' : 'Request a project quote')}</h3>
      {names.length ? <p>{names.join(' · ')}</p> : <p>Your current project context will be attached to the request.</p>}
      <Button onClick={() => { onConvert({ type, entityIds: ids }); setComplete(true); }}>
        {component.type === 'sample_request' ? 'Prepare sample request' : 'Prepare quote request'}
      </Button>
    </section>
  );
}

const fieldMeta: Record<LeadField, { label: string; type?: string; autoComplete?: string; placeholder?: string }> = {
  name: { label: 'Name', autoComplete: 'name' },
  email: { label: 'Work email', type: 'email', autoComplete: 'email', placeholder: 'name@company.com' },
  phone: { label: 'Phone', type: 'tel', autoComplete: 'tel' },
  company: { label: 'Company', autoComplete: 'organization' },
  url: { label: 'Website', type: 'url', autoComplete: 'url', placeholder: 'https://yourcompany.com' },
};

export function LeadCaptureBlock({
  component,
  onSubmit,
}: {
  component: Extract<ExperienceComponent, { type: 'lead_capture' }>;
  onSubmit: (fields: Record<string, string>) => Promise<{ ok: boolean; stored?: boolean }>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'complete' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const email = values.email?.trim();
    if (component.fields.includes('email') && (!email || !/^\S+@\S+\.\S+$/.test(email))) {
      setError('Enter a valid work email.');
      return;
    }
    setStatus('submitting');
    setError('');
    const result = await onSubmit(Object.fromEntries(component.fields.map((field) => [field, values[field]?.trim() ?? ''])));
    setStatus(result.ok ? 'complete' : 'error');
    if (!result.ok) setError('Could not save this request right now. Your browsing experience is unaffected.');
  };

  if (status === 'complete') {
    return <section className="exp-success"><Badge tone="success">Request received</Badge><h3>Thanks — the useful context came first.</h3><p>The request includes the conversion goal and session context you already shared.</p></section>;
  }

  return (
    <form className="exp-lead-form" onSubmit={submit} data-sales-form="experience-lead">
      <div><span>Only now do we need contact details</span><h3>{component.title}</h3></div>
      <div className="exp-lead-form__fields">
        {component.fields.map((field) => {
          const meta = fieldMeta[field];
          return (
            <Field
              key={field}
              label={meta.label}
              type={meta.type}
              autoComplete={meta.autoComplete}
              placeholder={meta.placeholder}
              required={field === 'name' || field === 'email'}
              value={values[field] ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
            />
          );
        })}
      </div>
      {error ? <p className="exp-form-error" role="alert">{error}</p> : null}
      <Button type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? 'Saving…' : component.submitLabel ?? 'Submit'}</Button>
    </form>
  );
}

export function ConsultationBlock({
  component,
  onConvert,
}: {
  component: Extract<ExperienceComponent, { type: 'book_consultation' }>;
  onConvert: (payload: ConversionPayload) => void;
}) {
  return (
    <section className="exp-conversion-card">
      <span>Consultation handoff</span>
      <h3>{component.title ?? 'Continue to a consultation request'}</h3>
      <p>This step only routes the request; it does not create an attorney-client relationship or promise an outcome.</p>
      <Button onClick={() => onConvert({ type: 'consultation_request', resourceId: component.resourceId })}>Continue</Button>
    </section>
  );
}

export type { ConversionPayload };
