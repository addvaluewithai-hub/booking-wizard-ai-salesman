import { useEffect, useMemo, useState } from 'react';
import DesignSystemPlayground from './playground/DesignSystemPlayground';
import { useSalesmanEngine } from './salesman/runtime/useSalesmanEngine';

type Niche = 'hpl' | 'yachts' | 'law-firms';

const nicheCopy: Record<Niche, { eyebrow: string; title: string; body: string; cta: string }> = {
  hpl: {
    eyebrow: 'HPL / decorative materials',
    title: 'A digital showroom advisor that notices hesitation before the customer asks.',
    body: 'The salesman observes browsing behavior. When the visitor engages, the experience box switches to visual choices, comparisons, project-fit questions, sample requests and quote actions.',
    cta: 'Try HPL experience',
  },
  yachts: {
    eyebrow: 'Yacht charter',
    title: 'A booking concierge that knows when a bigger yacht is not the better sale.',
    body: 'It can notice party size, pricing hesitation, preferred times and occasion signals, then offer a better-fit charter or booking path without behaving like a generic chatbot.',
    cta: 'Preview yacht story',
  },
  'law-firms': {
    eyebrow: 'Law firms',
    title: 'A calm intake guide that helps prospects reach the right next step.',
    body: 'The experience routes visitors by practice area and consultation intent while staying within safe intake boundaries. It does not give legal advice or promise outcomes.',
    cta: 'Preview legal story',
  },
};

function pathToNiche(pathname: string): Niche | null {
  if (pathname.startsWith('/hpl')) return 'hpl';
  if (pathname.startsWith('/yachts')) return 'yachts';
  if (pathname.startsWith('/law-firms')) return 'law-firms';
  return null;
}

function Logo() {
  return (
    <a href="/" className="brand" aria-label="AI Salesman home">
      <span className="brand-mark" aria-hidden="true">✦</span>
      <span>AI Salesman</span>
    </a>
  );
}

function Header() {
  return (
    <header className="site-header">
      <Logo />
      <nav aria-label="Primary navigation">
        <a href="/#how">How it works</a>
        <a href="/hpl">HPL</a>
        <a href="/yachts">Yachts</a>
        <a href="/law-firms">Law firms</a>
      </nav>
      <a className="button button-small button-ghost" href="/#demo">See it live</a>
    </header>
  );
}

type ExperienceBoxProps = {
  onClose: () => void;
  onAnswer: (id: string, value: string) => void;
  onComplete: (conversionType?: string) => void;
};

function ExperienceBox({ onClose, onAnswer, onComplete }: ExperienceBoxProps) {
  const [step, setStep] = useState(0);
  const [siteType, setSiteType] = useState('');
  const [goal, setGoal] = useState('');
  const [complete, setComplete] = useState(false);

  const steps = [
    {
      id: 'site_type',
      title: 'What kind of site are you building for?',
      options: ['Product catalog', 'Booking business', 'Professional service', 'Something else'],
      value: siteType,
      setValue: setSiteType,
    },
    {
      id: 'conversion_goal',
      title: 'What should the salesman help improve?',
      options: ['More leads', 'More bookings', 'Product discovery', 'Fewer abandoned visits'],
      value: goal,
      setValue: setGoal,
    },
  ];

  const select = (id: string, option: string, setter: (value: string) => void) => {
    setter(option);
    onAnswer(id, option);
  };

  const finish = () => {
    onComplete('pilot_interest');
    setComplete(true);
  };

  return (
    <div className="experience-shell" role="dialog" aria-modal="true" aria-label="Interactive AI Salesman experience">
      <button className="icon-button" onClick={onClose} aria-label="Close experience">×</button>
      {complete ? (
        <>
          <p className="experience-kicker">Captured in session memory</p>
          <h2>That is enough context to tailor the next step.</h2>
          <p className="muted">The production lead flow will persist contact details server-side only after value has been demonstrated.</p>
          <button className="button button-primary" onClick={onClose}>Return to the site</button>
        </>
      ) : step < steps.length ? (
        <>
          <p className="experience-kicker">Interactive experience</p>
          <h2>{steps[step].title}</h2>
          <div className="choice-grid">
            {steps[step].options.map((option) => (
              <button
                key={option}
                className={steps[step].value === option ? 'choice active' : 'choice'}
                onClick={() => select(steps[step].id, option, steps[step].setValue)}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            className="button button-primary"
            disabled={!steps[step].value}
            onClick={() => setStep((current) => current + 1)}
          >
            Continue
          </button>
        </>
      ) : (
        <>
          <p className="experience-kicker">Now the box knows something useful</p>
          <h2>Your experience should behave differently for {siteType.toLowerCase()}.</h2>
          <p className="muted">Based on your goal ({goal.toLowerCase()}), the system can choose a visual next step without asking you to repeat context it already learned.</p>
          <div className="result-card">
            <span>Recommended action</span>
            <strong>{goal === 'Product discovery' ? 'Adaptive product matcher' : 'Contextual conversion flow'}</strong>
          </div>
          <button className="button button-primary" onClick={finish}>Save this pilot direction</button>
        </>
      )}
    </div>
  );
}

function AmbientSalesman() {
  const engine = useSalesmanEngine();
  const [open, setOpen] = useState(false);

  const engage = () => {
    engine.engage();
    setOpen(true);
  };

  const close = () => {
    engine.closeExperience();
    setOpen(false);
  };

  return (
    <>
      {!open && engine.intervention ? (
        <div className="ambient-salesman" role="status" aria-live="polite">
          <button className="ambient-salesman__message" onClick={engage} aria-label="Open contextual salesman experience">
            <span className="presence-mark" aria-hidden="true">✦</span>
            <span>
              <small>Noticed something</small>
              <strong>{engine.intervention.decision.message}</strong>
            </span>
            <span className="ambient-arrow" aria-hidden="true">↗</span>
          </button>
          <button className="ambient-salesman__dismiss" onClick={engine.dismiss} aria-label="Dismiss suggestion">×</button>
        </div>
      ) : null}
      {!open && !engine.intervention ? (
        <button className="manual-salesman" onClick={engine.askForHelp} data-sales-help aria-label="Ask the site salesman for help">
          <span className="presence-mark" aria-hidden="true">✦</span>
          <span>Ask</span>
        </button>
      ) : null}
      {open ? <ExperienceBox onClose={close} onAnswer={engine.answer} onComplete={engine.completeExperience} /> : null}
    </>
  );
}

function Home() {
  const [activeNiche, setActiveNiche] = useState<Niche>('hpl');
  const copy = nicheCopy[activeNiche];

  return (
    <>
      <main>
        <section className="hero" data-sales-section="hero">
          <div className="hero-copy">
            <p className="eyebrow">Not a chatbot. A live website salesman.</p>
            <h1>It watches. Remembers. Knows when to speak.</h1>
            <p className="hero-text">An AI conversion layer that observes buyer behavior in real time, decides whether intervention is useful, then opens a visual experience instead of a boring chat transcript.</p>
            <div className="hero-actions">
              <a className="button button-primary" data-sales-cta="watch-behavior" href="#demo">Watch the behavior</a>
              <a className="button button-ghost" data-sales-cta="open-hpl-demo" href="/hpl">Open HPL demo</a>
            </div>
            <div className="trust-row" aria-label="Product principles">
              <span>Context aware</span><span>Session memory</span><span>Adaptive UI</span><span>Non-pushy by design</span>
            </div>
          </div>
          <div className="hero-stage" aria-label="AI Salesman behavior preview">
            <div className="browser-frame">
              <div className="browser-top"><span/><span/><span/><em>yourwebsite.com/products</em></div>
              <div className="demo-grid">
                <div className="demo-card tall"><span>01</span><strong>Warm oak</strong></div>
                <div className="demo-card"><span>02</span><strong>Soft grey</strong></div>
                <div className="demo-card"><span>03</span><strong>Dark walnut</strong></div>
              </div>
              <div className="demo-presence">
                <span className="presence-mark">✦</span>
                <p>You came back to the darker finishes twice. Want the one I would choose for a small kitchen?</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how" data-sales-section="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">Two layers. One continuous relationship.</p>
            <h2>The salesman earns the click. The experience box earns the conversion.</h2>
          </div>
          <div className="principle-grid">
            <article><span>01</span><h3>Observe</h3><p>Page views, product revisits, comparisons, dwell, pricing checks, form starts and ignored interventions become structured signals.</p></article>
            <article><span>02</span><h3>Decide</h3><p>The model gets a compact live memory and chooses silence or one contextual intervention. No fixed timer copy.</p></article>
            <article><span>03</span><h3>Engage visually</h3><p>After the click, components take over: cards, comparisons, calendars, chips, uploads, quote actions and booking controls.</p></article>
          </div>
        </section>

        <section className="section showcase" id="demo" data-sales-section="niche-examples">
          <div className="showcase-nav" role="tablist" aria-label="Niche examples">
            {(Object.keys(nicheCopy) as Niche[]).map((niche) => (
              <button
                key={niche}
                className={activeNiche === niche ? 'tab active' : 'tab'}
                data-sales-cta={`niche-tab-${niche}`}
                onClick={() => setActiveNiche(niche)}
              >
                {niche === 'law-firms' ? 'Law firms' : niche.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="showcase-content">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
            <p>{copy.body}</p>
            <a href={`/${activeNiche}`} data-sales-cta={`open-${activeNiche}`} className="button button-primary">{copy.cta}</a>
          </div>
        </section>
      </main>
      <AmbientSalesman />
    </>
  );
}

function NichePage({ niche }: { niche: Niche }) {
  const copy = nicheCopy[niche];
  const bullets = useMemo(() => {
    if (niche === 'hpl') return ['Product revisits', 'Material comparisons', 'Project/application context', 'Sample + quote intent'];
    if (niche === 'yachts') return ['Party size', 'Yacht comparisons', 'Price hesitation', 'Date + occasion intent'];
    return ['Practice-area browsing', 'Consultation intent', 'Lawyer profile views', 'Safe intake routing'];
  }, [niche]);

  return (
    <main>
      <section className={`niche-hero niche-${niche}`} data-sales-section={`${niche}-hero`}>
        <a className="back-link" href="/">← Back to product</a>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="hero-text">{copy.body}</p>
        <div className="signal-row">{bullets.map((bullet) => <span key={bullet}>{bullet}</span>)}</div>
      </section>
      <section className="section two-column" data-sales-section={`${niche}-behavior`}>
        <div>
          <p className="eyebrow">Ambient salesman</p>
          <h2>Before the visitor clicks, the AI is mostly quiet.</h2>
          <p>It watches meaningful behavior, maintains memory, respects ignored interventions and waits for a moment where a useful sentence can move the decision forward.</p>
        </div>
        <div className="logic-stack">
          <div><small>Visitor signal</small><strong>{bullets[0]}</strong></div>
          <div><small>Memory update</small><strong>Intent becomes more specific</strong></div>
          <div><small>Decision</small><strong>SILENT or INTERVENE</strong></div>
          <div><small>After click</small><strong>Open structured experience components</strong></div>
        </div>
      </section>
      <AmbientSalesman />
    </main>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handle = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, []);

  const niche = pathToNiche(pathname);
  const isPlayground = pathname === '/playground';

  return (
    <div className="app-shell">
      <Header />
      {isPlayground ? <DesignSystemPlayground /> : niche ? <NichePage niche={niche} /> : <Home />}
      <footer>
        <Logo />
        <p>Adaptive website experiences driven by live buyer behavior.</p>
      </footer>
    </div>
  );
}
