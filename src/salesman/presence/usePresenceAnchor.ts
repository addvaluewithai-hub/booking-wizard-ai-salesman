import { useEffect, useState, type CSSProperties } from 'react';
import { computePresenceAnchor } from './anchor';

export function usePresenceAnchor(entityId: string | undefined, active: boolean): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties>();

  useEffect(() => {
    if (!active || !entityId || typeof window === 'undefined') {
      setStyle(undefined);
      return;
    }

    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const element = Array.from(document.querySelectorAll<HTMLElement>('[data-sales-entity]'))
          .find((candidate) => candidate.dataset.salesEntity === entityId);
        if (!element) return setStyle(undefined);
        const rect = element.getBoundingClientRect();
        const anchor = computePresenceAnchor(rect, window.innerWidth, window.innerHeight);
        setStyle(anchor ? { top: anchor.top, left: anchor.left, right: 'auto', bottom: 'auto' } : undefined);
      });
    };

    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true, capture: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [entityId, active]);

  return style;
}
