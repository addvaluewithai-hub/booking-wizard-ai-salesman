import type { AlamaarProduct } from './catalog';
import { STEPS, choiceValue, type Answers } from './experience';
import type { AiUiBlock } from './aiContract';
import './ai-ui.css';

const ACTIONS = {
  sample: { label: 'اطلب عينة', href: 'https://alamaarhpl.com/contact/' },
  whatsapp: { label: 'اسأل على واتساب', href: 'https://wa.me/201008897060' },
  shop: { label: 'افتح المنتجات', href: 'https://alamaarhpl.com/shop/' },
} as const;

export default function AiUiRenderer({
  blocks,
  catalog,
  answers,
  onSuggestion,
  onFlowChoice,
}: {
  blocks?: AiUiBlock[];
  catalog: AlamaarProduct[];
  answers: Answers;
  onSuggestion: (value: string) => void;
  onFlowChoice: (stepKey: string, value: string) => void;
}) {
  if (!blocks?.length) return null;

  return (
    <div className="alamaar-ai-ui" aria-label="محتوى تفاعلي من المساعد">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'flow_choices') {
          const step = STEPS.find((item) => item.key === block.data.stepKey);
          if (!step) return null;
          const options = step.choices.filter((choice) => block.data.optionIds.includes(choiceValue(choice)));
          if (!options.length) return null;
          return (
            <div className="alamaar-ai-ui__choices" key={`flow-${blockIndex}`}>
              {options.map((choice) => (
                <button
                  type="button"
                  key={choice.value}
                  onClick={() => onFlowChoice(step.key, choiceValue(choice))}
                  data-choice-tone={choice.tone ?? ''}
                >
                  <span>{choice.icon}</span>
                  <strong>{choice.label}</strong>
                </button>
              ))}
            </div>
          );
        }

        if (block.type === 'suggestions') {
          return (
            <div className="alamaar-ai-ui__suggestions" key={`suggestions-${blockIndex}`}>
              {block.data.items.map((item) => (
                <button type="button" key={item.id} onClick={() => onSuggestion(item.value)}>{item.label}</button>
              ))}
            </div>
          );
        }

        if (block.type === 'products') {
          const products = block.data.productIds
            .map((id) => catalog.find((product) => product.id === id))
            .filter((product): product is AlamaarProduct => Boolean(product));
          if (!products.length) return null;
          return (
            <div className="alamaar-ai-ui__products" key={`products-${blockIndex}`}>
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

        if (block.type === 'actions') {
          return (
            <div className="alamaar-ai-ui__actions" key={`actions-${blockIndex}`}>
              {block.data.actionIds.map((actionId) => {
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
