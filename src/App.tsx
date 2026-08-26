import { lazy, Suspense } from 'react';
import HomePage from './homepage/HomePage';

const DesignSystemPlayground = lazy(() => import('./playground/DesignSystemPlayground'));
const AlamaarWizardPage = lazy(() => import('./niches/alamaar/AlamaarWizardPage'));
const HplPage = lazy(() => import('./niches/hpl/HplPage'));
const YachtPage = lazy(() => import('./niches/yachts/YachtPage'));
const LawFirmPage = lazy(() => import('./niches/law-firms/LawFirmPage'));

function ProductHeader() {
  return (
    <header className="site-header">
      <a href="/" className="brand" aria-label="AI Salesman home"><span className="brand-mark" aria-hidden="true">✦</span><span>AI Salesman</span></a>
      <nav aria-label="Primary navigation"><a href="/#how">How it works</a><a href="/hpl">HPL</a><a href="/yachts">Yachts</a><a href="/law-firms">Law firms</a></nav>
      <a className="button button-small button-ghost" href="/hpl">Live HPL demo</a>
    </header>
  );
}

function RouteLoading() {
  return (
    <main className="app-shell" aria-busy="true" aria-live="polite">
      <div className="skeleton" style={{ minHeight: '45vh', margin: '1rem' }} aria-label="Loading experience" />
    </main>
  );
}

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === '/playground') {
    return (
      <Suspense fallback={<RouteLoading />}>
        <div className="app-shell"><ProductHeader /><DesignSystemPlayground /></div>
      </Suspense>
    );
  }

  if (pathname.startsWith('/alamaar')) {
    return <Suspense fallback={<RouteLoading />}><AlamaarWizardPage /></Suspense>;
  }

  if (pathname.startsWith('/hpl')) {
    return <Suspense fallback={<RouteLoading />}><HplPage /></Suspense>;
  }

  if (pathname.startsWith('/yachts')) {
    return <Suspense fallback={<RouteLoading />}><YachtPage /></Suspense>;
  }

  if (pathname.startsWith('/law-firms')) {
    return <Suspense fallback={<RouteLoading />}><LawFirmPage /></Suspense>;
  }

  return <HomePage />;
}
