import { useMemo, useState } from 'react';
import { Badge, Button, Chip } from '../../design-system';
import { SalesmanLayer } from '../../salesman/presence/SalesmanLayer';
import { useSalesmanEngine } from '../../salesman/runtime/useSalesmanEngine';
import { HPL_EXPERIENCE_ENTITIES, HPL_PRODUCTS, type HplDepth, type HplFamily, type HplProduct, type HplWarmth } from './data';
import './hpl.css';

type Filters = { family?: HplFamily; depth?: HplDepth; warmth?: HplWarmth };

function ProductCard({ product, compared, onCompare, onOpen }: { product: HplProduct; compared: boolean; onCompare: () => void; onOpen: () => void }) {
  return (
    <article className="hpl-product" data-sales-entity={product.id}>
      <button className="hpl-product__visual" style={{ background: product.swatch }} onClick={onOpen} aria-label={`View ${product.name}`}>
        <span>{product.id}</span>
        <span>{product.depth}</span>
      </button>
      <div className="hpl-product__body">
        <div><span>{product.family} · {product.finish}</span><h3>{product.name}</h3></div>
        <button className={compared ? 'hpl-compare is-active' : 'hpl-compare'} onClick={onCompare} aria-pressed={compared}>
          {compared ? 'In compare' : 'Compare'}
        </button>
      </div>
    </article>
  );
}

function ProductDetail({ product, onClose, onUse }: { product: HplProduct; onClose: () => void; onUse: () => void }) {
  return (
    <aside className="hpl-detail" aria-label={`${product.name} details`}>
      <button className="hpl-detail__close" onClick={onClose} aria-label="Close product details">×</button>
      <div className="hpl-detail__swatch" style={{ background: product.swatch }} />
      <div className="hpl-detail__copy">
        <Badge tone="accent">Fictional demo material</Badge>
        <span className="hpl-detail__sku">{product.id}</span>
        <h2>{product.name}</h2>
        <p>{product.visualCharacter}. This demo record only exposes the properties listed below; no hidden technical specifications are implied.</p>
        <dl data-sales-spec>
          <div><dt>Visual family</dt><dd>{product.family}</dd></div>
          <div><dt>Tone</dt><dd>{product.depth} · {product.warmth}</dd></div>
          <div><dt>Finish</dt><dd>{product.finish}</dd></div>
          <div><dt>Demo applications</dt><dd>{product.applications.join(', ')}</dd></div>
          <div><dt>Cleaning field</dt><dd>{product.cleaning}</dd></div>
          <div><dt>Samples</dt><dd>{product.sampleEligible ? 'Demo eligible' : 'Not configured'}</dd></div>
        </dl>
        <Button onClick={onUse}>Use this in the material matcher</Button>
      </div>
    </aside>
  );
}

export default function HplPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const engine = useSalesmanEngine({
    niche: 'hpl',
    verifiedFacts: { catalog: HPL_EXPERIENCE_ENTITIES, catalogNotice: 'All entities are fictional demo HPL materials.' },
  });

  const products = useMemo(() => HPL_PRODUCTS.filter((product) => (
    (!filters.family || product.family === filters.family) &&
    (!filters.depth || product.depth === filters.depth) &&
    (!filters.warmth || product.warmth === filters.warmth)
  )), [filters]);

  const selectedProduct = selectedId ? HPL_PRODUCTS.find((product) => product.id === selectedId) : undefined;
  const compared = compareIds.map((id) => HPL_PRODUCTS.find((product) => product.id === id)).filter((product): product is HplProduct => Boolean(product));

  const setFilter = (key: keyof Filters, value: Filters[keyof Filters]) => {
    setFilters((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
    engine.emit({ type: 'filter_change', page: '/hpl', entityId: key, metadata: { value: String(value) } });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      const removing = current.includes(id);
      const next = removing ? current.filter((item) => item !== id) : [...current, id].slice(-3);
      engine.emit({ type: removing ? 'compare_remove' : 'compare_add', page: '/hpl', entityId: id });
      return next;
    });
  };

  const openExperience = (source: string, entityId?: string) => {
    if (entityId && !engine.memory.comparisonIds.includes(entityId)) engine.emit({ type: 'compare_add', page: '/hpl', entityId });
    engine.emit({ type: 'experience_open', page: '/hpl', entityId: source });
    setExperienceOpen(true);
  };

  return (
    <div className="hpl-site" data-theme="hpl">
      <header className="hpl-nav">
        <a className="hpl-brand" href="/hpl"><span>AS</span><div><strong>Atelier Surface</strong><small>fictional material library</small></div></a>
        <nav aria-label="HPL demo navigation"><a href="#collection">Collection</a><a href="#applications">Applications</a><a href="#about-demo">About this demo</a></nav>
        <Button size="sm" onClick={() => openExperience('header-sample')}>Find a material</Button>
      </header>

      <main>
        <section className="hpl-hero" data-sales-section="hpl-intro">
          <div className="hpl-hero__copy">
            <Badge tone="accent">Decorative surface library · demo</Badge>
            <h1>Material decisions should feel tactile, not overwhelming.</h1>
            <p>Explore twenty fictional finishes by visual character and project context. The quiet guide remembers what you revisit and compare, then helps only when there is something specific to reduce.</p>
            <div className="hpl-hero__actions"><a className="hpl-text-link" href="#collection">Browse the collection ↓</a><button onClick={() => openExperience('hero-match')}>Match by project →</button></div>
          </div>
          <div className="hpl-hero__composition" aria-label="Material swatch composition">
            {HPL_PRODUCTS.slice(3, 8).map((product, index) => <div key={product.id} style={{ background: product.swatch, transform: `translate(${index * 10}px, ${index * -8}px) rotate(${(index - 2) * 2.2}deg)` }}><span>{product.id}</span></div>)}
          </div>
        </section>

        <section className="hpl-collection" id="collection" data-sales-section="collection">
          <div className="hpl-section-heading"><div><span>Collection 01</span><h2>Start visually. Filter only when it helps.</h2></div><p>{products.length} of {HPL_PRODUCTS.length} demo materials</p></div>
          <div className="hpl-filters" aria-label="Material filters">
            <div><span>Family</span>{(['wood','stone','solid','textile'] as HplFamily[]).map((value) => <Chip key={value} selected={filters.family === value} onClick={() => setFilter('family', value)}>{value}</Chip>)}</div>
            <div><span>Depth</span>{(['light','medium','dark'] as HplDepth[]).map((value) => <Chip key={value} selected={filters.depth === value} onClick={() => setFilter('depth', value)}>{value}</Chip>)}</div>
            <div><span>Temperature</span>{(['warm','neutral','cool'] as HplWarmth[]).map((value) => <Chip key={value} selected={filters.warmth === value} onClick={() => setFilter('warmth', value)}>{value}</Chip>)}</div>
          </div>
          <div className="hpl-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} compared={compareIds.includes(product.id)} onCompare={() => toggleCompare(product.id)} onOpen={() => setSelectedId(product.id)} />)}
          </div>
        </section>

        <section className="hpl-applications" id="applications">
          <div className="hpl-section-heading"><div><span>Application 02</span><h2>The same finish reads differently in a real project.</h2></div></div>
          <div className="hpl-application-grid">
            <article data-sales-section="kitchen"><span>Kitchen</span><h3>Balance a darker finish with the room’s light.</h3><p>Browse context that lets the salesman infer a project without asking “what is this for?” again.</p><button onClick={() => { engine.answer('application', 'kitchen'); openExperience('kitchen-context'); }}>Explore kitchen fit →</button></article>
            <article data-sales-section="wardrobe"><span>Wardrobe</span><h3>Large vertical surfaces reward calmer pattern.</h3><p>A project signal can change which existing shortlist is most useful without inventing a technical spec.</p><button onClick={() => { engine.answer('application', 'wardrobe'); openExperience('wardrobe-context'); }}>Explore wardrobe fit →</button></article>
            <article data-sales-section="retail"><span>Retail / hospitality</span><h3>Visual character can carry more weight.</h3><p>The same engine adapts the next component sequence using explicit deterministic catalog data.</p><button onClick={() => { engine.answer('application', 'retail'); openExperience('retail-context'); }}>Explore feature surfaces →</button></article>
          </div>
        </section>

        <section className="hpl-demo-explain" id="about-demo" data-sales-section="hpl-demo-explanation">
          <div><Badge>What is actually happening</Badge><h2>The guide is reading intent, not your cursor.</h2></div>
          <ol>
            <li><span>Signal</span><strong>Repeated materials, filters, compare actions and application sections.</strong></li>
            <li><span>Memory</span><strong>A compact session state — no raw mouse trail or giant transcript.</strong></li>
            <li><span>Decision</span><strong>Stay silent unless a useful new moment survives cooldown + suppression rules.</strong></li>
            <li><span>Experience</span><strong>Open trusted visual components grounded in this fictional catalog.</strong></li>
          </ol>
        </section>
      </main>

      {selectedProduct ? <ProductDetail product={selectedProduct} onClose={() => setSelectedId(null)} onUse={() => { setSelectedId(null); openExperience('product-detail', selectedProduct.id); }} /> : null}

      {compared.length ? (
        <div className="hpl-compare-tray" role="region" aria-label="Compare tray">
          <div><span>Comparing {compared.length}/3</span><strong>{compared.map((product) => product.name).join(' · ')}</strong></div>
          <Button size="sm" disabled={compared.length < 2} onClick={() => openExperience('compare-tray')}>Compare with guide</Button>
        </div>
      ) : null}

      <SalesmanLayer engine={engine} entities={HPL_EXPERIENCE_ENTITIES} experienceOpen={experienceOpen} onExperienceOpenChange={setExperienceOpen} />
    </div>
  );
}
