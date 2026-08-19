import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ExperienceContact, ExperienceEntity, ExperienceUploadHandler } from '../experience/types';
import { ExperienceBox } from '../experience/ExperienceBox';
import type { useSalesmanEngine } from '../runtime/useSalesmanEngine';
import { usePresenceAnchor } from './usePresenceAnchor';
import './presence.css';

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
  const [morphing, setMorphing] = useState(false);
  const [morphOrigin, setMorphOrigin] = useState<CSSProperties>();
  const timerRef = useRef<number | null>(null);
  const anchorStyle = usePresenceAnchor(engine.intervention?.triggerEntityId, Boolean(engine.intervention && !experienceOpen));

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const engage = () => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setMorphOrigin(anchorStyle);
    engine.engage();
    if (reduceMotion) {
      onExperienceOpenChange(true);
      return;
    }
    setMorphing(true);
    timerRef.current = window.setTimeout(() => {
      setMorphing(false);
      onExperienceOpenChange(true);
      timerRef.current = null;
    }, 180);
  };

  const close = () => {
    engine.closeExperience();
    onExperienceOpenChange(false);
  };

  return (
    <>
      {!experienceOpen && engine.intervention ? (
        <div className={`ambient-salesman${anchorStyle ? ' ambient-salesman--anchored' : ''}`} style={anchorStyle} role="status" aria-live="polite">
          <button className="ambient-salesman__message" onClick={engage} aria-label="Open contextual salesman experience">
            <span className="presence-mark" aria-hidden="true">✦</span>
            <span>
              <small>{anchorStyle ? 'Relevant here' : 'Noticed something'}</small>
              <strong>{engine.intervention.decision.message}</strong>
            </span>
            <span className="ambient-arrow" aria-hidden="true">↗</span>
          </button>
          <button className="ambient-salesman__dismiss" onClick={engine.dismiss} aria-label="Dismiss suggestion">×</button>
        </div>
      ) : null}

      {morphing ? <div className={`experience-morph-bridge${morphOrigin ? ' experience-morph-bridge--anchored' : ''}`} style={morphOrigin} aria-hidden="true"><span className="presence-mark">✦</span></div> : null}

      {!experienceOpen && !engine.intervention && !morphing ? (
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
