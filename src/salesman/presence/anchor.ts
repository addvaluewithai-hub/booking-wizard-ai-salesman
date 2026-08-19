export type PresenceAnchor = {
  top: number;
  left: number;
};

export type AnchorRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export function computePresenceAnchor(rect: AnchorRect, viewportWidth: number, viewportHeight: number): PresenceAnchor | null {
  if (viewportWidth < 760 || viewportHeight < 420) return null;
  if (rect.bottom < 0 || rect.top > viewportHeight || rect.right < 0 || rect.left > viewportWidth) return null;

  const gap = 14;
  const edge = 16;
  const promptWidth = Math.min(380, viewportWidth - edge * 2);
  const estimatedHeight = 132;

  let left: number | null = null;
  if (rect.right + gap + promptWidth <= viewportWidth - edge) {
    left = rect.right + gap;
  } else if (rect.left - gap - promptWidth >= edge) {
    left = rect.left - gap - promptWidth;
  }

  if (left === null) return null;
  const centeredTop = rect.top + rect.height / 2 - estimatedHeight / 2;
  const top = Math.max(edge, Math.min(viewportHeight - estimatedHeight - edge, centeredTop));
  return { top: Math.round(top), left: Math.round(left) };
}
