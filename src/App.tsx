import DesignSystemPlayground from './playground/DesignSystemPlayground';
import HomePage from './homepage/HomePage';
import HplPage from './niches/hpl/HplPage';
import YachtPage from './niches/yachts/YachtPage';
import LawFirmPage from './niches/law-firms/LawFirmPage';

function ProductHeader() {
  return (
    <header className="site-header">
      <a href="/" className="brand" aria-label="AI Salesman home"><span className="brand-mark" aria-hidden="true">✦</span><span>AI Salesman</span></a>
      <nav aria-label="Primary navigation"><a href="/#how">How it works</a><a href="/hpl">HPL</a><a href="/yachts">Yachts</a><a href="/law-firms">Law firms</a></nav>
      <a className="button button-small button-ghost" href="/hpl">Live HPL demo</a>
    </header>
  );
}

export default function App() {
  const pathname = window.location.pathname;
  if (pathname === '/playground') return <div className="app-shell"><ProductHeader /><DesignSystemPlayground /></div>;
  if (pathname.startsWith('/hpl')) return <HplPage />;
  if (pathname.startsWith('/yachts')) return <YachtPage />;
  if (pathname.startsWith('/law-firms')) return <LawFirmPage />;
  return <HomePage />;
}
