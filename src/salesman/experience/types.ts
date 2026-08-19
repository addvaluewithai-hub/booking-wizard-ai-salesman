export type ExperienceOption = {
  id: string;
  label: string;
  description?: string;
};

export type LeadField = 'name' | 'email' | 'phone' | 'company' | 'url';

export type ExperienceContact = {
  label?: string;
  phoneE164?: string;
  whatsappE164?: string;
};

export type ExperienceComponent =
  | { type: 'single_select'; id: string; question: string; options: ExperienceOption[] }
  | { type: 'multi_select'; id: string; question: string; options: ExperienceOption[]; max?: number }
  | { type: 'yes_no'; id: string; question: string; yesLabel?: string; noLabel?: string }
  | { type: 'range'; id: string; question: string; min: number; max: number; step?: number; unit?: string }
  | { type: 'quantity'; id: string; question: string; min: number; max: number; step?: number }
  | { type: 'product_cards'; id: string; entityIds: string[]; reason?: string }
  | { type: 'comparison'; id: string; entityIds: string[] }
  | { type: 'recommendation_reason'; id: string; entityId: string; title?: string }
  | { type: 'image_choice'; id: string; question: string; entityIds: string[] }
  | { type: 'upload_image'; id: string; title: string; description?: string; accept?: string[]; maxBytes?: number }
  | { type: 'date_picker'; id: string; question: string; minDate?: string; maxDate?: string }
  | { type: 'time_slots'; id: string; question: string; slots: string[] }
  | { type: 'add_ons'; id: string; question: string; options: ExperienceOption[] }
  | { type: 'lead_capture'; id: string; title: string; fields: LeadField[]; submitLabel?: string }
  | { type: 'sample_request'; id: string; entityIds: string[]; title?: string }
  | { type: 'quote_request'; id: string; entityIds?: string[]; title?: string }
  | { type: 'book_consultation'; id: string; resourceId?: string; title?: string }
  | { type: 'call_or_whatsapp'; id: string; contactKey: string; title?: string; callLabel?: string; whatsappLabel?: string }
  | { type: 'faq'; id: string; title: string; body: string }
  | { type: 'summary'; id: string; title: string; items: Array<{ label: string; value: string }> };

export type ExperiencePlan = {
  title?: string;
  intro?: string;
  components: ExperienceComponent[];
  nextAction?: string;
};

export type ExperienceEntity = {
  id: string;
  name: string;
  subtitle?: string;
  image?: string;
  swatch?: string;
  attributes?: Record<string, string | number | boolean | string[]>;
};

export type ExperienceData = {
  entities: ExperienceEntity[];
  contacts?: Record<string, ExperienceContact>;
};

export type ExperienceAnswer = string | number | boolean | string[];

export type ExperienceUploadHandler = (file: File) => Promise<{ assetId: string }>;
