import { Button, Chip, ChoiceCard } from '../../../design-system';
import type { ExperienceAnswer, ExperienceComponent, ExperienceOption } from '../types';

type AnswerProps = {
  value?: ExperienceAnswer;
  onAnswer: (value: ExperienceAnswer) => void;
};

export function SingleSelectBlock({ component, value, onAnswer }: { component: Extract<ExperienceComponent, { type: 'single_select' }> } & AnswerProps) {
  return (
    <section className="exp-block" aria-labelledby={`${component.id}-question`}>
      <h3 id={`${component.id}-question`}>{component.question}</h3>
      <div className="exp-choice-grid">
        {component.options.map((option) => (
          <ChoiceCard
            key={option.id}
            title={option.label}
            description={option.description}
            selected={value === option.id}
            onClick={() => onAnswer(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function MultiSelectBlock({ component, value, onAnswer }: { component: Extract<ExperienceComponent, { type: 'multi_select' | 'add_ons' }> } & AnswerProps) {
  const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  const max = component.type === 'multi_select' ? component.max : undefined;
  const toggle = (option: ExperienceOption) => {
    if (selected.includes(option.id)) return onAnswer(selected.filter((id) => id !== option.id));
    if (max && selected.length >= max) return;
    onAnswer([...selected, option.id]);
  };

  return (
    <section className="exp-block" aria-labelledby={`${component.id}-question`}>
      <h3 id={`${component.id}-question`}>{component.question}</h3>
      <div className="exp-chip-row">
        {component.options.map((option) => (
          <Chip key={option.id} selected={selected.includes(option.id)} onClick={() => toggle(option)}>
            {option.label}
          </Chip>
        ))}
      </div>
    </section>
  );
}

export function YesNoBlock({ component, value, onAnswer }: { component: Extract<ExperienceComponent, { type: 'yes_no' }> } & AnswerProps) {
  return (
    <section className="exp-block" aria-labelledby={`${component.id}-question`}>
      <h3 id={`${component.id}-question`}>{component.question}</h3>
      <div className="exp-choice-grid exp-choice-grid--binary">
        <ChoiceCard title={component.yesLabel ?? 'Yes'} selected={value === true} onClick={() => onAnswer(true)} />
        <ChoiceCard title={component.noLabel ?? 'No'} selected={value === false} onClick={() => onAnswer(false)} />
      </div>
    </section>
  );
}

export function RangeBlock({ component, value, onAnswer }: { component: Extract<ExperienceComponent, { type: 'range' }> } & AnswerProps) {
  const numberValue = typeof value === 'number' ? value : component.min;
  return (
    <section className="exp-block">
      <div className="exp-range-heading"><h3>{component.question}</h3><strong>{numberValue}{component.unit ?? ''}</strong></div>
      <input
        className="exp-range"
        type="range"
        min={component.min}
        max={component.max}
        step={component.step ?? 1}
        value={numberValue}
        onChange={(event) => onAnswer(Number(event.target.value))}
        aria-label={component.question}
      />
      <div className="exp-range-labels"><span>{component.min}{component.unit ?? ''}</span><span>{component.max}{component.unit ?? ''}</span></div>
    </section>
  );
}

export function QuantityBlock({ component, value, onAnswer }: { component: Extract<ExperienceComponent, { type: 'quantity' }> } & AnswerProps) {
  const numberValue = typeof value === 'number' ? value : component.min;
  const step = component.step ?? 1;
  return (
    <section className="exp-block">
      <h3>{component.question}</h3>
      <div className="exp-stepper" role="group" aria-label={component.question}>
        <Button variant="secondary" aria-label="Decrease" disabled={numberValue <= component.min} onClick={() => onAnswer(Math.max(component.min, numberValue - step))}>−</Button>
        <strong aria-live="polite">{numberValue}</strong>
        <Button variant="secondary" aria-label="Increase" disabled={numberValue >= component.max} onClick={() => onAnswer(Math.min(component.max, numberValue + step))}>+</Button>
      </div>
    </section>
  );
}

export function DatePickerBlock({ component, value, onAnswer }: { component: Extract<ExperienceComponent, { type: 'date_picker' }> } & AnswerProps) {
  return (
    <section className="exp-block">
      <label className="exp-date-field">
        <span>{component.question}</span>
        <input type="date" min={component.minDate} max={component.maxDate} value={typeof value === 'string' ? value : ''} onChange={(event) => onAnswer(event.target.value)} />
      </label>
    </section>
  );
}

export function TimeSlotsBlock({ component, value, onAnswer }: { component: Extract<ExperienceComponent, { type: 'time_slots' }> } & AnswerProps) {
  return (
    <section className="exp-block">
      <h3>{component.question}</h3>
      <div className="exp-chip-row">
        {component.slots.map((slot) => <Chip key={slot} selected={value === slot} onClick={() => onAnswer(slot)}>{slot}</Chip>)}
      </div>
    </section>
  );
}

export function FAQBlock({ component }: { component: Extract<ExperienceComponent, { type: 'faq' }> }) {
  return <section className="exp-reassurance"><span>Good to know</span><h3>{component.title}</h3><p>{component.body}</p></section>;
}

export function SummaryBlock({ component }: { component: Extract<ExperienceComponent, { type: 'summary' }> }) {
  return (
    <section className="exp-summary">
      <h3>{component.title}</h3>
      <dl>{component.items.map((item) => <div key={`${item.label}-${item.value}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
    </section>
  );
}
