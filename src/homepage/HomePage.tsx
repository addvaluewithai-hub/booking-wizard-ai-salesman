import { useState } from 'react';
import { Badge, Button, Chip } from '../design-system';
import { SalesmanLayer } from '../salesman/presence/SalesmanLayer';
import { useSalesmanEngine } from '../salesman/runtime/useSalesmanEngine';
import './home.css';

const steps = [
  { id: 'signal', label: 'Signal', title: 'A meaningful behavior changes', detail: 'Revisit, comparison, abandonment, pricing/spec focus — not every cursor move.' },
  { id: 'memory', label: 'Memory', title: 'The session gets more specific', detail: 'Intent, shortlist, answers and previous intervention outcomes stay compact.' },
  { id: 'decision', label: 'Decision', title: 'Silence is a valid output', detail: 'Cooldowns and suppression sit above model creativity.' },
  { id: 'intervention', label: 'Intervention', title: 'One useful line earns the click', detail: 'Generated from current context instead of a fixed timer message.' },
  { id: 'experience', label: 'Experience', title: 'Trusted visual components take over', detail: 'Products, comparisons, dates, choices and conversion actions — no chat transcript.' },
  { id: 'conversion', label: 'Conversion', title: 'The action keeps the learned context', detail: 'Lead, sample, quote, booking or consultation carries forward what is already known.' },
];

export default function HomePage() {
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(2);
  const engine = useSalesmanEngine({
    niche: 'homepage',
    verifiedFacts: {
      product: 'AI Salesman',
      productArchitecture: ['ambient behavioral salesperson', 'structured visual Experience Box'],
      availableDemos: ['HPL decorative materials', 'yacht charter', 'law-firm intake'],
      persistence: 'Session memory in browser; server-side lead storage when D1 DB binding is configured.',
    },
  });

  const openExperience = (source: string) => {
    engine.emit({ type: 'experience_open', page: '/', entityId: source });
    setExperienceOpen(true);
  };

  const negativeResponses = engine.memory.salesman.interventionsIgnored + engine.memory.salesman.interventionsDismissed;

  return (
    <div className="home-site" data-theme="product">
      <header className="home-nav">
        <a className="home-brand" href="/" aria-label="AI Salesman home"><span>✦</span><strong>AI Salesman</strong></a>
        <nav aria-label="Product navigation"><a href="#how">How it works</a><a href="#memory">Memory</a><a href="#demos">Demos</a><a href="#integration">Integration</a></nav>
        <Button size="sm" variant="secondary" onClick={() => openExperience('header-pilot')}>Map my use case</Button>
      </header>

      <main>
        <section className="home-hero" data-sales-section="hero">
          <div className="home-hero__copy">
            <Badge tone="accent">A conversion layer that knows when not to speak</Badge>
            <h1>It observes.<br/>Remembers.<br/><em>Then decides.</em></h1>
            <p>A website salesperson that pays attention to meaningful buyer behavior, earns one contextual click, then opens an adaptive visual experience instead of a support-chat transcript.</p>
            <div className="home-hero__actions">
              <Button onClick={() => openExperience('hero-pilot')}>See it on your use case</Button>
              <a className="home-link-button" data-sales-cta="open-hpl-demo" href="/hpl">Enter the HPL live demo ↗</a>
            </div>
            <div className="home-proof-strip"><span>No generic greeting</span><span>Session memory</span><span>Deterministic facts</span><span>Silence by design</span></div>
          </div>

          <div className="home-live-preview" aria-label="Live website salesman preview" data-sales-section="live-preview">
            <div className="home-preview-browser">
              <div className="home-preview-browser__top"><i/><i/><i/><span>surface-studio.example / collection</span></div>
              <div className="home-preview-sitebar"><strong>Atelier Surface</strong><nav><span>Collection</span><span>Projects</span><span>Samples</span></nav></div>
              <div className="home-preview-grid">
                <article className="is-revisited"><div/><span>Smoked Oak</span><small>viewed ×3</small></article>
                <article><div/><span>Quiet Ash</span><small>viewed ×1</small></article>
                <article className="is-revisited"><div/><span>Espresso Walnut</span><small>viewed ×2</small></article>
              </div>
              <div className="home-preview-memory">
                <span>memory</span>
                <p><b>2</b> dark woods revisited</p><p><b>1</b> kitchen section viewed</p><p><b>0</b> samples requested</p>
              </div>
              <div className="home-preview-decision"><span className="presence-mark">✦</span><div><small>Decision · intervene</small><strong>You keep returning to the two darker woods. If this is for a kitchen, one question will separate them.</strong></div></div>
            </div>
          </div>
        </section>

        <section className="home-statement" data-sales-section="product-principle">
          <span>Observe → understand → remember → decide → engage → convert</span>
          <h2>A perceptive salesperson is valuable because of what they <em>notice</em> — and because they know when to leave you alone.</h2>
        </section>

        <section className="home-two-layers" id="how" data-sales-section="two-layers">
          <div className="home-section-heading"><Badge>Architecture 01</Badge><h2>Two layers. Different jobs.</h2><p>The ambient layer earns permission. The engaged layer turns that permission into a visual decision.</p></div>
          <div className="home-layer-grid">
            <article>
              <div className="home-layer-number">01</div><div className="home-layer-mark"><span>✦</span></div>
              <h3>Ambient Salesman</h3><p>Quietly reduces live behavior into session memory, then makes a structured <code>SILENT | INTERVENE</code> decision.</p>
              <ul><li>Meaningful signals only</li><li>Cooldown + ignore suppression</li><li>One contextual idea</li><li>No layout shift</li></ul>
            </article>
            <article>
              <div className="home-layer-number">02</div><div className="home-layer-window"><i/><i/><i/></div>
              <h3>Experience Box</h3><p>After engagement, the AI selects from trusted UI components while deterministic business data stays authoritative.</p>
              <ul><li>Visual questions</li><li>Products + comparison</li><li>Dates / slots / add-ons</li><li>Lead / sample / quote actions</li></ul>
            </article>
          </div>
        </section>

        <section className="home-timeline" data-sales-section="behavior-timeline">
          <div className="home-section-heading"><Badge>Behavior 02</Badge><h2>A model call is a decision point, not a heartbeat.</h2><p>Click through the chain. Ordinary browsing can remain silent for a long time.</p></div>
          <div className="home-timeline__layout">
            <div className="home-timeline__nav" role="tablist" aria-label="Behavior decision timeline">
              {steps.map((step, index) => <button key={step.id} className={activeStep === index ? 'is-active' : ''} onClick={() => setActiveStep(index)}><span>{String(index + 1).padStart(2,'0')}</span>{step.label}</button>)}
            </div>
            <div className="home-timeline__stage">
              <span>{steps[activeStep].label}</span><h3>{steps[activeStep].title}</h3><p>{steps[activeStep].detail}</p>
              <div className={`home-timeline-visual home-timeline-visual--${steps[activeStep].id}`}>
                <i/><i/><i/><i/><i/><i/>
              </div>
            </div>
          </div>
        </section>

        <section className="home-memory" id="memory" data-sales-section="memory-story">
          <div className="home-memory__copy"><Badge>Memory 03</Badge><h2>An ignored prompt is not a failed notification. It is new context.</h2><p>The next intervention needs a stronger reason. After repeated ignores/dismissals, proactive behavior can shut off for the session while manual help stays available.</p></div>
          <div className="home-memory__panel">
            <div><span>Earlier</span><strong>First intervention shown</strong><small>visitor continues browsing</small></div>
            <div className="is-muted"><span>Outcome</span><strong>Ignored</strong><small>suppression level increases</small></div>
            <div className="home-memory__rule"><span>New policy</span><strong>{negativeResponses >= 2 ? 'Strong signal required · current live suppression is elevated' : 'Do not paraphrase the same idea. Wait for stronger new context.'}</strong></div>
          </div>
        </section>

        <section className="home-demos" id="demos" data-sales-section="niche-demos">
          <div className="home-section-heading"><Badge>Demos 04</Badge><h2>One brain. Different sales problems.</h2><p>Each site looks like a customer website first. Niche data, safety rules and visual skin change; the behavioral engine does not.</p></div>
          <div className="home-demo-grid">
            <a href="/hpl" data-sales-cta="demo-hpl"><span>01 · Materials</span><h3>HPL / decorative surfaces</h3><p>Repeated finishes → project context → grounded comparison → sample / quote.</p><div className="home-demo-swatch"><i/><i/><i/></div><b>Live production vertical ↗</b></a>
            <a href="/yachts" data-sales-cta="demo-yachts"><span>02 · High-ticket booking</span><h3>Yacht charter</h3><p>Party size + vessel comparison + timing → better fit → booking path.</p><div className="home-demo-yacht"><i/></div><b>Dedicated demo ↗</b></a>
            <a href="/law-firms" data-sales-cta="demo-law"><span>03 · Professional services</span><h3>Law-firm intake</h3><p>Practice-area behavior → safe routing → configured team → consultation.</p><div className="home-demo-law"><i/><i/></div><b>Dedicated demo ↗</b></a>
          </div>
        </section>

        <section className="home-measure" data-sales-section="measurement">
          <div className="home-section-heading"><Badge>Measurement 05</Badge><h2>Optimize assisted conversion, not message count.</h2></div>
          <div className="home-metric-flow"><div><small>Intervention</small><strong>view → click</strong></div><span>→</span><div><small>Experience</small><strong>start → complete</strong></div><span>→</span><div><small>Business</small><strong>qualified action</strong></div></div>
          <p>Guardrails matter too: dismissals, repeated interruptions, page performance and layout stability belong next to conversion lift.</p>
        </section>

        <section className="home-integration" id="integration" data-sales-section="integration">
          <div className="home-integration__copy"><Badge>Integration 06</Badge><h2>The long-term interface is small. The intelligence is not in your markup.</h2><p>A client integration emits explicit semantic events and deterministic data. Secrets and model calls stay on server routes. This demo is proving that architecture before promising a no-code control plane.</p></div>
          <div className="home-code-card"><div><span>website.ts</span><i/><i/><i/></div><pre>{`salesman.observe({\n  entity: product.id,\n  event: "product_view"\n})\n\n// AI key: server only\n// facts: your data\n// UI: trusted registry`}</pre></div>
        </section>

        <section className="home-pilot" data-sales-section="pilot-cta">
          <span className="presence-mark">✦</span><Badge tone="accent">Pilot</Badge><h2>Give it one conversion problem worth paying attention to.</h2><p>Tell the same Experience Box what your site sells and what a conversion means. It will show the first sensible pilot shape before asking for your work email.</p>
          <Button onClick={() => openExperience('footer-pilot')}>Map my first use case</Button>
        </section>
      </main>

      <footer className="home-footer"><a className="home-brand" href="/"><span>✦</span><strong>AI Salesman</strong></a><p>Behavioral context → useful visual conversion.</p><div><a href="/hpl">HPL demo</a><a href="/playground">Internal playground</a></div></footer>

      <SalesmanLayer engine={engine} experienceOpen={experienceOpen} onExperienceOpenChange={setExperienceOpen} />
    </div>
  );
}
