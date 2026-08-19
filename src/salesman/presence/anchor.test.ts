import { describe, expect, it } from 'vitest';
import { computePresenceAnchor } from './anchor';

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

describe('contextual presence anchoring', () => {
  it('anchors to the right of a visible entity when there is room', () => {
    expect(computePresenceAnchor(rect(80, 200, 220, 180), 1200, 800)).toEqual({ top: 224, left: 314 });
  });

  it('anchors to the left when the entity is near the right edge', () => {
    const anchor = computePresenceAnchor(rect(850, 180, 240, 180), 1200, 800);
    expect(anchor?.left).toBe(456);
    expect(anchor?.top).toBe(204);
  });

  it('falls back to viewport-edge presence on mobile or when no side has room', () => {
    expect(computePresenceAnchor(rect(40, 100, 280, 160), 390, 800)).toBeNull();
    expect(computePresenceAnchor(rect(350, 100, 500, 160), 1000, 800)).toBeNull();
  });

  it('does not anchor to an off-screen entity', () => {
    expect(computePresenceAnchor(rect(-500, 100, 200, 100), 1200, 800)).toBeNull();
  });
});
