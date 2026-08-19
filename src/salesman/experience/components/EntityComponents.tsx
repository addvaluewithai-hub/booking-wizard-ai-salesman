import { Badge } from '../../../design-system';
import type { ExperienceComponent, ExperienceEntity } from '../types';

function entityMap(entities: ExperienceEntity[]) {
  return new Map(entities.map((entity) => [entity.id, entity]));
}

function attributeRows(entity: ExperienceEntity) {
  return Object.entries(entity.attributes ?? {}).slice(0, 5).map(([key, value]) => ({
    key,
    value: Array.isArray(value) ? value.join(', ') : String(value),
  }));
}

export function ProductCardsBlock({ component, entities }: { component: Extract<ExperienceComponent, { type: 'product_cards' }>; entities: ExperienceEntity[] }) {
  const lookup = entityMap(entities);
  const items = component.entityIds.map((id) => lookup.get(id)).filter((entity): entity is ExperienceEntity => Boolean(entity));
  return (
    <section className="exp-block">
      {component.reason ? <p className="exp-component-note">{component.reason}</p> : null}
      <div className="exp-product-grid">
        {items.map((entity, index) => (
          <article className="exp-product-card" key={entity.id} data-sales-entity={entity.id}>
            <div className="exp-product-card__visual" style={{ background: entity.swatch || 'linear-gradient(135deg,#71604f,#2d2924)' }}>
              {index === 0 ? <Badge tone="accent">Best fit</Badge> : null}
            </div>
            <div className="exp-product-card__copy">
              <span>{entity.id}</span>
              <h4>{entity.name}</h4>
              {entity.subtitle ? <p>{entity.subtitle}</p> : null}
              <dl>{attributeRows(entity).slice(0, 3).map((row) => <div key={row.key}><dt>{row.key.replaceAll('_', ' ')}</dt><dd>{row.value}</dd></div>)}</dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ComparisonBlock({ component, entities }: { component: Extract<ExperienceComponent, { type: 'comparison' }>; entities: ExperienceEntity[] }) {
  const lookup = entityMap(entities);
  const items = component.entityIds.map((id) => lookup.get(id)).filter((entity): entity is ExperienceEntity => Boolean(entity));
  const keys = [...new Set(items.flatMap((entity) => Object.keys(entity.attributes ?? {})))].slice(0, 7);
  if (items.length < 2) return null;

  return (
    <section className="exp-block exp-comparison">
      <h3>Compare the grounded differences</h3>
      <div className="exp-comparison__scroll">
        <table>
          <thead><tr><th>Attribute</th>{items.map((entity) => <th key={entity.id}>{entity.name}<small>{entity.id}</small></th>)}</tr></thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key}>
                <th>{key.replaceAll('_', ' ')}</th>
                {items.map((entity) => {
                  const raw = entity.attributes?.[key];
                  const value = Array.isArray(raw) ? raw.join(', ') : raw === undefined ? '—' : String(raw);
                  return <td key={entity.id}>{value}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
