import { useMemo, useState } from 'react';
import { Badge, Button, Chip } from '../../design-system';
import { SalesmanLayer } from '../../salesman/presence/SalesmanLayer';
import { useSalesmanEngine } from '../../salesman/runtime/useSalesmanEngine';
import { YACHTS, YACHT_EXPERIENCE_ENTITIES, type Yacht } from './data';
import './yachts.css';

const occasions = ['sunset', 'birthday', 'family day', 'corporate'];

function YachtCard({ yacht, selected, onView, onCompare }: { yacht: Yacht; selected: boolean; onView: () => void; onCompare: () => void }) {
  return (
    <article className="yacht-card" data-sales-entity={yacht.id}>
      <button className="yacht-card__visual" style={{ background: yacht.accent }} onClick={onView} aria-label={`View ${yacht.name}`}>
        <span>{yacht.id}</span><small>{yacht.lengthM}m</small>
        <div className="yacht-card__silhouette"><i/><i/><i/></div>
      </button>
      <div className="yacht-card__body">
        <div><span>{yacht.type} · up to {yacht.capacity} guests</span><h3>{yacht.name}</h3><p><b>${yacht.hourlyPriceUsd}</b>/hr demo · {yacht.minimumHours}h min.</p></div>
        <button className={selected ? 'yacht-card__compare is-active' : 'yacht-card__compare'} onClick={onCompare} aria-pressed={selected}>{selected ? 'Compared' : 'Compare'}</button>
      </div>
    </article>
  );
}

export default function YachtPage() {
  const [partySize, setPartySize] = useState(6);
  const [occasion, setOccasion] = useState('sunset');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const engine = useSalesmanEngine({
    niche: 'yachts',
    verifiedFacts: { fleet: YACHT_EXPERIENCE_ENTITIES, dataPolicy: 'All prices, capacities and time slots are explicitly fictional demo data.' },
  });

  const bestFits = useMemo(() => [...YACHTS]
    .filter((yacht) => yacht.capacity >= partySize)
    .sort((a, b) => (a.capacity - partySize) - (b.capacity - partySize) || a.hourlyPriceUsd - b.hourlyPriceUsd), [partySize]);
  const detail = detailId ? YACHTS.find((yacht) => yacht.id === detailId) : undefined;

  const updateParty = (value: number) => {
    const next = Math.max(2, Math.min(16, value));
    setPartySize(next);
    engine.answer('party_size', next);
  };
  const updateOccasion = (value: string) => { setOccasion(value); engine.answer('occasion', value); };
  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      const removing = current.includes(id);
      engine.emit({ type: removing ? 'compare_remove' : 'compare_add', page: '/yachts', entityId: id });
      return removing ? current.filter((item) => item !== id) : [...current, id].slice(-2);
    });
  };
  const openExperience = (source: string) => { engine.emit({ type: 'experience_open', page: '/yachts', entityId: source }); setExperienceOpen(true); };

  return (
    <div className="yacht-site" data-theme="yacht">
      <header className="yacht-nav">
        <a href="/yachts" className="yacht-brand"><span>NC</span><div><strong>Northline Charter</strong><small>fictional fleet demo</small></div></a>
        <nav><a href="#fleet">Fleet</a><a href="#plan">Plan</a><a href="#how-it-works">About demo</a></nav>
        <Button size="sm" onClick={() => openExperience('nav-concierge')}>Ask the concierge</Button>
      </header>

      <main>
        <section className="yacht-hero" data-sales-section="yacht-hero">
          <div className="yacht-hero__backdrop"><div className="yacht-hero__boat"><i/><i/><i/><i/></div></div>
          <div className="yacht-hero__copy"><Badge tone="accent">Premium charter · fictional booking demo</Badge><h1>Choose the day.<br/>Not just the boat.</h1><p>A calm charter site where the guide notices group size, vessel comparison and price hesitation — then suggests a better fit without inventing scarcity.</p><div><a href="#fleet">Explore fleet ↓</a><button onClick={() => openExperience('hero-plan')}>Build my charter →</button></div></div>
        </section>

        <section className="yacht-plan" id="plan" data-sales-section="charter-planner">
          <div className="yacht-plan__intro"><span>Start with fit</span><h2>Six guests should not have to buy fourteen-guest space.</h2><p>These selectors update deterministic session context. They are not availability claims.</p></div>
          <div className="yacht-plan__controls">
            <div className="yacht-party"><span>Guests</span><div><button onClick={() => updateParty(partySize - 1)} disabled={partySize <= 2}>−</button><strong>{partySize}</strong><button onClick={() => updateParty(partySize + 1)} disabled={partySize >= 16}>+</button></div></div>
            <div className="yacht-occasion"><span>Occasion</span><div>{occasions.map((item) => <Chip key={item} selected={occasion === item} onClick={() => updateOccasion(item)}>{item}</Chip>)}</div></div>
            <div className="yacht-fit-result"><span>Closest capacity fit</span><strong>{bestFits[0]?.name ?? 'No configured vessel'}</strong><small>{bestFits[0] ? `up to ${bestFits[0].capacity} guests · $${bestFits[0].hourlyPriceUsd}/hr demo` : 'Try a smaller party size'}</small></div>
          </div>
        </section>

        <section className="yacht-fleet" id="fleet" data-sales-section="fleet">
          <div className="yacht-heading"><div><span>Fleet 01</span><h2>Compare space you will actually use.</h2></div><p>All pricing + slots shown are fictional demo records.</p></div>
          <div className="yacht-grid">{YACHTS.map((yacht) => <YachtCard key={yacht.id} yacht={yacht} selected={compareIds.includes(yacht.id)} onView={() => setDetailId(yacht.id)} onCompare={() => toggleCompare(yacht.id)} />)}</div>
        </section>

        <section className="yacht-price-story" data-sales-price data-sales-section="price-story">
          <div><Badge>Price context 02</Badge><h2>A better-fit recommendation can be a downsell.</h2><p>For {partySize} guests, the engine can see the configured capacity and demo price for every vessel. It should not recommend extra cabins just because the bigger boat costs more.</p></div>
          <div className="yacht-price-table">
            {bestFits.slice(0,4).map((yacht,index) => <div key={yacht.id} data-sales-entity={yacht.id}><span>{index === 0 ? 'closest fit' : `${yacht.capacity} guests max`}</span><strong>{yacht.name}</strong><b>${yacht.hourlyPriceUsd}<small>/hr demo</small></b></div>)}
          </div>
        </section>

        <section className="yacht-about" id="how-it-works" data-sales-section="yacht-demo-explanation"><div><Badge>What the guide uses</Badge><h2>Booking intelligence without fake urgency.</h2></div><ul><li><span>01</span><strong>Party size + selected occasion</strong><p>Explicit answers feed session memory immediately.</p></li><li><span>02</span><strong>Repeated vessel views + comparisons</strong><p>Meaningful browsing signals, never raw cursor surveillance.</p></li><li><span>03</span><strong>Configured demo facts only</strong><p>Capacity, price, amenities and slots come from the fictional fleet dataset.</p></li><li><span>04</span><strong>No “only one left” theater</strong><p>The experience never creates scarcity or hold timers that do not exist.</p></li></ul></section>
      </main>

      {detail ? <aside className="yacht-detail"><button onClick={() => setDetailId(null)} aria-label="Close vessel">×</button><div className="yacht-detail__visual" style={{ background: detail.accent }}><div className="yacht-detail__boat"><i/><i/><i/></div></div><div className="yacht-detail__copy"><Badge tone="accent">Fictional vessel</Badge><span>{detail.id}</span><h2>{detail.name}</h2><p>{detail.type} · {detail.lengthM}m · configured for up to {detail.capacity} guests.</p><dl><div><dt>Demo rate</dt><dd>${detail.hourlyPriceUsd}/hr · {detail.minimumHours}h min.</dd></div><div><dt>Cabins</dt><dd>{detail.cabins}</dd></div><div><dt>Amenities</dt><dd>{detail.amenities.join(', ')}</dd></div><div><dt>Demo slots</dt><dd>{detail.demoSlots.join(' · ')}</dd></div></dl><Button onClick={() => { toggleCompare(detail.id); setDetailId(null); openExperience('vessel-detail'); }}>Plan around this vessel</Button></div></aside> : null}

      {compareIds.length ? <div className="yacht-compare-tray"><div><span>Compare {compareIds.length}/2</span><strong>{compareIds.map((id) => YACHTS.find((yacht) => yacht.id === id)?.name).filter(Boolean).join(' · ')}</strong></div><Button size="sm" disabled={compareIds.length < 2} onClick={() => openExperience('vessel-compare')}>Compare fit</Button></div> : null}

      <SalesmanLayer engine={engine} entities={YACHT_EXPERIENCE_ENTITIES} experienceOpen={experienceOpen} onExperienceOpenChange={setExperienceOpen} />
    </div>
  );
}
