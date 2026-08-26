import type { AlamaarProduct } from './catalog';
import { STEPS, choiceValue, type Answers } from './experience';
import type { ConversationEffect } from './conversationEngine';
import './conversation-effects.css';

const ACTIONS = {
  sample: { label: 'اطلب عينة', href: 'https://alamaarhpl.com/contact/' },
  whatsapp: { label: 'اسأل على واتساب', href: 'https://wa.me/201008897060' },
  shop: { label: 'افتح المنتجات', href: 'https://alamaarhpl.com/shop/' },
} as const;

export default function ConversationEffectRenderer({
  effects,
  catalog,
  answers,
  onKnownAnswer,
}: {
  effects?: ConversationEffect[];
  catalog: AlamaarProduct[];
  answers: Answers;
  onKnownAnswer: (stepKey: string, value: string) => void;
}) {
  if (!effects?.length) return null;

  return (
    <div className="alamaar-engine-ui" aria-label="محتوى المحادثة التفاعلي">
      {effects.map((effect, index) => {
        if (effect.type === 'guided_candidates') {
          const step = STEPS.find((item) => item.key === effect.stepKey);
          const options = step?.choices.filter((choice) => effect.optionIds.includes(choiceValue(choice))) ?? [];
          if (!step || !options.length) return null;
          return (
            <div className="alamaar-engine-ui__choices" key={`candidates-${index}`}>
              {options.map((choice) => (
                <button type="button" key={choice.value} onClick={() => onKnownAnswer(step.key, choiceValue(choice))} data-choice-tone={choice.tone ?? ''}>
                  <span>{choice.icon}</span><strong>{choice.label}</strong>
                </button>
              ))}
            </div>
          );
        }

        if (effect.type === 'product_results') {
          const products = effect.productIds
            .map((id) => catalog.find((product) => product.id === id))
            .filter((product): product is AlamaarProduct => Boolean(product));
          if (!products.length) return null;
          return (
            <div className="alamaar-engine-ui__products" key={`products-${index}`}>
              {products.map((product) => (
                <a href={product.url} target="_blank" rel="noreferrer" key={product.id}>
                  <img src={product.image} alt="" />
                  <span><strong>{product.name}</strong><small>{product.code}</small></span>
                  {answers.tone === product.tone ? <b>قريب من درجتك</b> : null}
                </a>
              ))}
            </div>
          );
        }

        if (effect.type === 'actions') {
          return (
            <div className="alamaar-engine-ui__actions" key={`actions-${index}`}>
              {effect.actionIds.map((actionId) => {
                const action = ACTIONS[actionId];
                return <a href={action.href} target="_blank" rel="noreferrer" key={actionId}>{action.label}</a>;
              })}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
