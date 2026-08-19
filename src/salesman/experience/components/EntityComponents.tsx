import { Badge, ChoiceCard } from '../../../design-system';
import type { ExperienceAnswer, ExperienceComponent, ExperienceEntity } from '../types';

function entityMap(entities: ExperienceEntity[]) {
  return new Map(entities.map((entity) => [entity.id, entity]));
}

function attributeRows(entity: ExperienceEntity) {
  return Object.entries(entity.attributes ?? {}).slice(0, 5).map(([key, value]) => ({
    key,
    value: Array.isArray(value) ? value.join(', ') : String(value),
  }));
}

function entityVisual(entity: ExperienceEntity) {
  if (entity.image) return { backgroundImage: `url("${entity.image.replaceAll('"', '%22')}")` };
  return { background: entity.swatch || 'linear-gradient(135deg,#71604f,#2d2924)' };
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
            <div className="exp-product-card__visual" style={entityVisual(entity)}>
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

export function RecommendationReasonBlock({ component, entities }: { component: Extract<ExperienceComponent, { type: 'recommendation_reason' }>; entities: ExperienceEntity[] }) {
  const entity = entities.find((item) => item.id === component.entityId);
  if (!entity) return null;
  const facts = attributeRows(entity).slice(0, 3);
  return (
    <section className="exp-recommendation-reason" data-sales-entity={entity.id}>
      <span>Why this fit is grounded</span>
      <h3>{component.title ?? entity.name}</h3>
      {entity.subtitle ? <p>{entity.subtitle}</p> : null}
      {facts.length ? <ul>{facts.map((fact) => <li key={fact.key}><strong>{fact.key.replaceAll('_', ' ')}</strong><span>{fact.value}</span></li>)}</ul> : null}
    </section>
  );
}

export function ImageChoiceBlock({ component, entities, value, onAnswer }: {
  component: Extract<ExperienceComponent, { type: 'image_choice' }>;
  entities: ExperienceEntity[];
  value?: ExperienceAnswer;
  onAnswer: (value: ExperienceAnswer) => void;
}) {
  const lookup = entityMap(entities);
  const items = component.entityIds.map((id) => lookup.get(id)).filter((entity): entity is ExperienceEntity => Boolean(entity));
  return (
    <section className="exp-block" aria-labelledby={`${component.id}-question`}>
      <h3 id={`${component.id}-question`}>{component.question}</h3>
      <div className="exp-image-choice-grid">
        {items.map((entity) => (
          <div className="exp-image-choice" key={entity.id}>
            <button
              type="button"
              className="exp-image-choice__visual"
              style={entityVisual(entity)}
              aria-label={`Choose ${entity.name}`}
              aria-pressed={value === entity.id}
              onClick={() => onAnswer(entity.id)}
            />
            <ChoiceCard title={entity.name} description={entity.subtitle} selected={value === entity.id} onClick={() => onAnswer(entity.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
