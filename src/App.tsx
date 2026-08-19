import DesignSystemPlayground from './playground/DesignSystemPlayground';
import HomePage from './homepage/HomePage';
import HplPage from './niches/hpl/HplPage';
import { SalesmanLayer } from './salesman/presence/SalesmanLayer';
import { useSalesmanEngine } from './salesman/runtime/useSalesmanEngine';
import { useState } from 'react';

type RemainingNiche = 'yachts' | 'law-firms';

const remainingCopy: Record<RemainingNiche, { eyebrow: string; title: string; body: string; signals: string[] }> = {
  yachts: {
    eyebrow: 'Yacht charter · dedicated demo',
    title: 'The same brain, applied to a high-ticket booking decision.',
    body: 'The full vessel catalog, party-size fit, time-slot and booking experience is the next vertical slice. The shared observer, memory, decision and Experience Box engine is already live here.',
    signals: ['Party size', 'Vessel comparison', 'Price hesitation', 'Date + occasion'],
  },
  'law-firms': {
    eyebrow: 'Law-firm intake · dedicated demo',
    title: 'A restrained intake guide — never a pretend lawyer.',
    body: 'The shared engine is live with law-specific safety policy. The dedicated configured practice/team routing surface is the next vertical slice.',
    signals: ['Practice areas', 'Lawyer profiles', 'Consultation intent', 'Safe routing'],
  },
};

function ProductHeader() {
  return (
    <header className="site-header">
      <a href="/" className="brand" aria-label="AI Salesman home"><span className="brand-mark" aria-hidden="true">✦</span><span>AI Salesman</span></a>
      <nav aria-label="Primary navigation"><a href="/#how">How it works</a><a href="/hpl">HPL</a><a href="/yachts">Yachts</a><a href="/law-firms">Law firms</a></nav>
      <a className="button button-small button-ghost" href="/hpl">Live HPL demo</a>
    </header>
  );
}

function RemainingNichePage({ niche }: { niche: RemainingNiche }) {
  const [experienceOpen, setExperienceOpen] = useState(false);
  const copy = remainingCopy[niche];
  const engine = useSalesmanEngine({ niche });
  return (
    <div className="app-shell">
      <ProductHeader />
      <main>
        <section className={`niche-hero niche-${niche}`} data-sales-section={`${niche}-hero`}>
          <a className="back-link" href="/">← Back to product</a>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="hero-text">{copy.body}</p>
          <div className="signal-row">{copy.signals.map((signal) => <span key={signal}>{signal}</span>)}</div>
        </section>
      </main>
      <SalesmanLayer engine={engine} experienceOpen={experienceOpen} onExperienceOpenChange={setExperienceOpen} />
    </div>
  );
}

export default function App() {
  const pathname = window.location.pathname;
  if (pathname === '/playground') return <div className="app-shell"><ProductHeader /><DesignSystemPlayground /></div>;
  if (pathname.startsWith('/hpl')) return <HplPage />;
  if (pathname.startsWith('/yachts')) return <RemainingNichePage niche="yachts" />;
  if (pathname.startsWith('/law-firms')) return <RemainingNichePage niche="law-firms" />;
  return <HomePage />;
}
