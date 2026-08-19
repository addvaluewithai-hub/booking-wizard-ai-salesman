import { useState, type ChangeEvent } from 'react';
import { Badge, Button } from '../../../design-system';
import type { ExperienceAnswer, ExperienceComponent, ExperienceContact, ExperienceUploadHandler } from '../types';

const DEFAULT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024;

function validE164(value: string | undefined) {
  return typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value);
}

export function UploadImageBlock({ component, value, onAnswer, onUploadAsset }: {
  component: Extract<ExperienceComponent, { type: 'upload_image' }>;
  value?: ExperienceAnswer;
  onAnswer: (value: ExperienceAnswer) => void;
  onUploadAsset?: ExperienceUploadHandler;
}) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState('');
  const acceptedTypes = component.accept?.length ? component.accept : DEFAULT_IMAGE_TYPES;
  const maxBytes = component.maxBytes ?? DEFAULT_MAX_BYTES;

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadAsset) return;
    if (!acceptedTypes.includes(file.type)) {
      setStatus('error');
      setError('Choose a supported image format.');
      return;
    }
    if (file.size > maxBytes) {
      setStatus('error');
      setError(`Image must be under ${Math.ceil(maxBytes / 1024 / 1024)} MB.`);
      return;
    }
    setStatus('uploading');
    setError('');
    try {
      const result = await onUploadAsset(file);
      if (!result?.assetId) throw new Error('missing asset id');
      onAnswer(result.assetId.slice(0, 180));
      setStatus('idle');
    } catch {
      setStatus('error');
      setError('Upload could not be completed. No local filename was saved to session memory.');
    }
  };

  return (
    <section className="exp-upload-card">
      <span>Optional visual context</span>
      <h3>{component.title}</h3>
      {component.description ? <p>{component.description}</p> : null}
      {typeof value === 'string' && value ? <Badge tone="success">Image attached as an opaque asset reference</Badge> : null}
      {onUploadAsset ? (
        <label className="exp-upload-control">
          <input type="file" accept={acceptedTypes.join(',')} onChange={upload} disabled={status === 'uploading'} />
          <Button type="button" variant="secondary" disabled={status === 'uploading'}>{status === 'uploading' ? 'Uploading…' : 'Choose image'}</Button>
          <small>Only the returned asset ID enters session memory; the file object and local filename do not.</small>
        </label>
      ) : (
        <p className="exp-integration-note">Upload adapter not connected in this host. The Experience Box can expose the contract without pretending the file was stored.</p>
      )}
      {error ? <p className="exp-form-error" role="alert">{error}</p> : null}
    </section>
  );
}

export function CallOrWhatsAppBlock({ component, contact }: {
  component: Extract<ExperienceComponent, { type: 'call_or_whatsapp' }>;
  contact?: ExperienceContact;
}) {
  const phone = validE164(contact?.phoneE164) ? contact?.phoneE164 : undefined;
  const whatsapp = validE164(contact?.whatsappE164) ? contact?.whatsappE164 : undefined;
  if (!phone && !whatsapp) return null;

  return (
    <section className="exp-contact-card">
      <span>Configured contact handoff</span>
      <h3>{component.title ?? contact?.label ?? 'Contact the team'}</h3>
      <p>Contact destinations come from verified host configuration, never model-generated links.</p>
      <div className="exp-contact-actions">
        {phone ? <a className="exp-contact-action" href={`tel:${phone}`}>{component.callLabel ?? `Call ${contact?.label ?? 'team'}`}</a> : null}
        {whatsapp ? <a className="exp-contact-action" href={`https://wa.me/${whatsapp.slice(1)}`}>{component.whatsappLabel ?? 'WhatsApp'}</a> : null}
      </div>
    </section>
  );
}
