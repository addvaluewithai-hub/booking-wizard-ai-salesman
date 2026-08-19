import type { ExperienceContact, ExperienceEntity, ExperienceUploadHandler } from '../experience/types';
import { ExperienceBox } from '../experience/ExperienceBox';
import type { useSalesmanEngine } from '../runtime/useSalesmanEngine';

type Engine = ReturnType<typeof useSalesmanEngine>;

export type SalesmanLayerProps = {
  engine: Engine;
  entities?: ExperienceEntity[];
  contacts?: Record<string, ExperienceContact>;
  onUploadAsset?: ExperienceUploadHandler;
  experienceOpen: boolean;
  onExperienceOpenChange: (open: boolean) => void;
};

export function SalesmanLayer({ engine, entities = [], contacts, onUploadAsset, experienceOpen, onExperienceOpenChange }: SalesmanLayerProps) {
  const engage = () => {
    engine.engage();
    onExperienceOpenChange(true);
  };

  const close = () => {
    engine.closeExperience();
    onExperienceOpenChange(false);
  };

  return (
    <>
      {!experienceOpen && engine.intervention ? (
        <div className="ambient-salesman" role="status" aria-live="polite">
          <button className="ambient-salesman__message" onClick={engage} aria-label="Open contextual salesman experience">
            <span className="presence-mark" aria-hidden="true">✦</span>
            <span>
              <small>Noticed something</small>
              <strong>{engine.intervention.decision.message}</strong>
            </span>
            <span className="ambient-arrow" aria-hidden="true">↗</span>
          </button>
          <button className="ambient-salesman__dismiss" onClick={engine.dismiss} aria-label="Dismiss suggestion">×</button>
        </div>
      ) : null}

      {!experienceOpen && !engine.intervention ? (
        <button className="manual-salesman" onClick={engine.askForHelp} aria-label="Ask the site salesman for contextual help">
          <span className="presence-mark" aria-hidden="true">✦</span>
          <span>Ask</span>
        </button>
      ) : null}

      <ExperienceBox
        open={experienceOpen}
        niche={engine.niche}
        memory={engine.memory}
        entities={entities}
        contacts={contacts}
        onUploadAsset={onUploadAsset}
        onClose={close}
        onAnswer={engine.answer}
        onComplete={engine.completeExperience}
      />
    </>
  );
}
