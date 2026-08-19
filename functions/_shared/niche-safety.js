const PROHIBITED_SALES_CLAIMS = [
  /\bonly\s+\d+\s+left\b/i,
  /\blimited\s+time\b/i,
  /\bact\s+now\b/i,
  /\bguaranteed\b/i,
  /\byou\s+qualify\b/i,
  /\bdefinitely\b/i,
];

const LAW_PROHIBITED_PATTERNS = [
  /\byou\s+(?:will|can|should)\s+(?:win|succeed|recover|sue|settle|file)\b/i,
  /\b(?:strong|weak|good|bad)\s+case\b/i,
  /\bcase\s+(?:is|may\s+be|could\s+be)\s+worth\b/i,
  /\b(?:damages|compensation|claim)\s+(?:is|are|of|worth|could\s+be|may\s+be)\s*[$£€]?\s*\d/i,
  /\b(?:deadline|statute\s+of\s+limitations)\s+(?:is|expires|runs|ends)\b/i,
  /\b(?:file|submit|appeal|sue)\s+(?:by|before)\s+(?:today|tomorrow|\w+\s+\d{1,2}|\d{1,2}[/-]\d{1,2})\b/i,
  /\b(?:accept|reject)\s+(?:the\s+)?settlement\b/i,
  /\bi\s+(?:recommend|advise)\s+(?:that\s+)?you\b/i,
];

export function hasProhibitedSalesClaim(message) {
  if (typeof message !== 'string') return false;
  return PROHIBITED_SALES_CLAIMS.some((pattern) => pattern.test(message));
}

export function isLawRoutingCopySafe(message) {
  if (typeof message !== 'string' || !message.trim()) return true;
  return !LAW_PROHIBITED_PATTERNS.some((pattern) => pattern.test(message));
}
