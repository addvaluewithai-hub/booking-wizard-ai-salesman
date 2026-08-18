import { useState } from 'react';
import {
  ArrowUpRightIcon,
  Badge,
  Button,
  ChoiceCard,
  Chip,
  Field,
  Sheet,
  Skeleton,
  SparkIcon,
  Surface,
} from '../design-system';
import './playground.css';

type ThemeName = 'product' | 'hpl' | 'yacht' | 'law';

const themes: Array<{ id: ThemeName; label: string; note: string }> = [
  { id: 'product', label: 'Product home', note: 'Ink + warm neutral' },
  { id: 'hpl', label: 'HPL', note: 'Walnut + sand' },
  { id: 'yacht', label: 'Yacht', note: 'Midnight + restrained gold' },
  { id: 'law', label: 'Law', note: 'Deep ink + parchment' },
];

export default function DesignSystemPlayground() {
  const [selected, setSelected] = useState('Product discovery');
  const [chips, setChips] = useState<string[]>(['Warm']);
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleChip = (chip: string) => {
    setChips((current) => current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]);
  };

  return (
    <main className="playground" data-theme="product">
      <section className="playground-hero">
        <div>
          <Badge tone="accent">Internal playground</Badge>
          <h1>Production design foundation.</h1>
          <p>Reusable primitives, theme skins, RTL behavior, focus states and motion rules before the product UI gets more complex.</p>
        </div>
        <Button trailingIcon={<ArrowUpRightIcon size={18} />} onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
      </section>

      <section className="playground-section">
        <div className="playground-section__heading">
          <span>01</span>
          <div>
            <h2>Theme contract</h2>
            <p>The same primitives inherit a niche skin without changing component behavior.</p>
          </div>
        </div>
        <div className="theme-grid">
          {themes.map((theme) => (
            <Surface key={theme.id} className="theme-sample" data-theme={theme.id} tone="raised">
              <div className="theme-sample__mark" aria-hidden="true"><SparkIcon size={18} /></div>
              <div>
                <strong>{theme.label}</strong>
                <span>{theme.note}</span>
              </div>
              <Button size="sm">Continue</Button>
            </Surface>
          ))}
        </div>
      </section>

      <section className="playground-section playground-two-column">
        <div>
          <div className="playground-section__heading compact">
            <span>02</span>
            <div>
              <h2>Choices + fields</h2>
              <p>44px+ targets, visible selection, semantic state and grounded form feedback.</p>
            </div>
          </div>
          <div className="choice-demo">
            {['Product discovery', 'Bookings', 'Qualified leads'].map((option) => (
              <ChoiceCard
                key={option}
                title={option}
                description={option === 'Product discovery' ? 'Help visitors narrow a complex catalog.' : 'Guide the next best conversion step.'}
                selected={selected === option}
                onClick={() => setSelected(option)}
              />
            ))}
          </div>
        </div>
        <Surface tone="soft" className="form-demo">
          <Badge>Visitor context</Badge>
          <div className="chip-row" aria-label="Example preferences">
            {['Warm', 'Dark', 'Easy care'].map((chip) => (
              <Chip key={chip} selected={chips.includes(chip)} onClick={() => toggleChip(chip)}>{chip}</Chip>
            ))}
          </div>
          <Field label="Website URL" placeholder="https://example.com" hint="Optional until the visitor has received value." />
          <Field label="Work email" placeholder="name@company.com" error="Example inline validation state" />
          <div className="button-row">
            <Button variant="secondary">Back</Button>
            <Button>Use this context</Button>
          </div>
        </Surface>
      </section>

      <section className="playground-section">
        <div className="playground-section__heading">
          <span>03</span>
          <div>
            <h2>Loading language</h2>
            <p>Quiet skeletons preserve geometry while model or data work happens.</p>
          </div>
        </div>
        <Surface className="skeleton-demo" tone="soft">
          <Skeleton width="38%" height="14px" />
          <Skeleton width="82%" height="28px" />
          <Skeleton width="64%" height="14px" />
          <div className="skeleton-demo__cards">
            <Skeleton height="92px" />
            <Skeleton height="92px" />
          </div>
        </Surface>
      </section>

      <section className="playground-section">
        <div className="playground-section__heading">
          <span>04</span>
          <div>
            <h2>RTL readiness</h2>
            <p>Logical layout and text alignment should flip without bespoke component markup.</p>
          </div>
        </div>
        <div dir="rtl" data-theme="hpl" className="rtl-demo">
          <ChoiceCard title="اختيار المواد" description="مثال لاختبار اتجاه الواجهة ومسافات العناصر." selected meta="HPL" />
        </div>
      </section>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Experience surface"
        description="Desktop side sheet becomes a mobile bottom sheet with the same component contract. Escape closes it and focus returns to the trigger."
        footer={<Button onClick={() => setSheetOpen(false)}>Done</Button>}
      >
        <div className="sheet-demo-copy">
          <Badge tone="success">Ready for orchestration</Badge>
          <h3>Structured UI, not a chat transcript.</h3>
          <p>Future Experience Box plans can compose these trusted components while product facts and business rules remain deterministic.</p>
        </div>
      </Sheet>
    </main>
  );
}
