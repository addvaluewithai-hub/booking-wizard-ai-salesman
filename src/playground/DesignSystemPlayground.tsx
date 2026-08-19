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
import { summarizeMemoryForModel } from '../salesman/memory/summarize';
import { useSalesmanEngine } from '../salesman/runtime/useSalesmanEngine';
import ExperienceRegistryPlayground from './ExperienceRegistryPlayground';
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
  const engine = useSalesmanEngine({
    niche: 'hpl',
    verifiedFacts: {
      products: [
        { id: 'DEMO-WALNUT-01', applications: ['kitchen cabinetry'], tone: 'dark warm' },
        { id: 'DEMO-OAK-02', applications: ['kitchen cabinetry'], tone: 'medium warm' },
      ],
      note: 'Playground facts are fictional demo data.',
    },
  });

  const toggleChip = (chip: string) => {
    setChips((current) => current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]);
  };

  const simulateComparison = () => {
    const page = '/hpl';
    engine.emit({ type: 'product_view', page, entityId: 'DEMO-WALNUT-01' });
    engine.emit({ type: 'product_view', page, entityId: 'DEMO-OAK-02' });
    engine.emit({ type: 'product_revisit', page, entityId: 'DEMO-WALNUT-01' });
    engine.emit({ type: 'compare_add', page, entityId: 'DEMO-WALNUT-01' });
    engine.emit({ type: 'compare_add', page, entityId: 'DEMO-OAK-02' });
    engine.emit({ type: 'section_view', page, entityId: 'kitchen' });
  };

  const simulateAbandonment = () => {
    engine.emit({ type: 'form_start', page: '/hpl', entityId: 'sample-request' });
    engine.emit({ type: 'form_abandon', page: '/hpl', entityId: 'sample-request' });
  };

  const summary = summarizeMemoryForModel(engine.memory);

  return (
    <main className="playground" data-theme="product">
      <section className="playground-hero">
        <div>
          <Badge tone="accent">Internal playground</Badge>
          <h1>Production system + live salesman brain.</h1>
          <p>Reusable UI primitives share the same test surface as behavioral memory, deterministic guardrails and model decisions.</p>
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
            <h2>Behavior fixtures</h2>
            <p>Fire realistic high-value signals and inspect the compact memory the model receives. Normal page reading alone should not trigger a call.</p>
          </div>
        </div>
        <div className="brain-grid">
          <Surface tone="raised" className="fixture-panel">
            <Badge tone="accent">HPL fixture controls</Badge>
            <h3>Create meaningful moments</h3>
            <p>These controls emit the same typed events used by the website integrations.</p>
            <div className="fixture-actions">
              <Button onClick={simulateComparison}>Repeated comparison</Button>
              <Button variant="secondary" onClick={simulateAbandonment}>Abandoned sample form</Button>
              <Button variant="ghost" onClick={engine.askForHelp}>Explicit help</Button>
            </div>
            {engine.intervention ? (
              <div className="debug-intervention" role="status">
                <span>INTERVENE</span>
                <strong>{engine.intervention.decision.message}</strong>
                <small>{engine.intervention.decision.internalReason}</small>
                <div className="fixture-actions">
                  <Button size="sm" onClick={engine.engage}>Engage</Button>
                  <Button size="sm" variant="ghost" onClick={engine.dismiss}>Dismiss</Button>
                </div>
              </div>
            ) : (
              <div className="debug-silent">No active intervention — silence is the default state.</div>
            )}
          </Surface>
          <Surface tone="soft" className="memory-panel">
            <div className="memory-panel__heading">
              <Badge>Compact model memory</Badge>
              <span>{engine.memory.salesman.suppressionLevel > 0 ? `suppression ${engine.memory.salesman.suppressionLevel}` : 'normal restraint'}</span>
            </div>
            <pre>{JSON.stringify(summary, null, 2)}</pre>
          </Surface>
        </div>
      </section>

      <section className="playground-section">
        <div className="playground-section__heading">
          <span>04</span>
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
          <span>05</span>
          <div>
            <h2>RTL readiness</h2>
            <p>Logical layout and text alignment should flip without bespoke component markup.</p>
          </div>
        </div>
        <div dir="rtl" data-theme="hpl" className="rtl-demo">
          <ChoiceCard title="اختيار المواد" description="مثال لاختبار اتجاه الواجهة ومسافات العناصر." selected meta="HPL" />
        </div>
      </section>

      <section className="playground-section">
        <div className="playground-section__heading">
          <span>06</span>
          <div>
            <h2>Experience registry coverage</h2>
            <p>Every trusted component type renders here with fictional deterministic data. Upload uses a local fake adapter that returns only an opaque asset reference.</p>
          </div>
        </div>
        <ExperienceRegistryPlayground />
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
          <p>Experience plans compose trusted components while product facts and business rules remain deterministic.</p>
        </div>
      </Sheet>
    </main>
  );
}
