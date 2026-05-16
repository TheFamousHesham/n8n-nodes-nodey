// Pure logic to merge iOS + Android NFC payloads into a consistent shape.
// No imports — keeps the function trivially testable and sandbox-friendly.

export type Platform = 'ios' | 'android' | 'unknown';

export interface NormalizedPayload {
  platform: Platform;
  triggerName: string | null;
  triggerType: string;
  event: string;
  timestamp: string;
  source: string;
  triggerId: string | null;
  customData: unknown;
  raw: Record<string, unknown>;
}

const isString = (v: unknown): v is string => typeof v === 'string';

function detectPlatform(body: Record<string, unknown>): Platform {
  // iOS shape: has snake_case trigger fields and a "source" of "Nodey".
  if ('trigger_name' in body || 'trigger_type' in body || body.source === 'Nodey') {
    return 'ios';
  }
  // Android shape: has triggerId (UUID) plus customData OR customPayload.
  if ('triggerId' in body && ('customData' in body || 'customPayload' in body)) {
    return 'android';
  }
  // Looser Android detection: any triggerId without iOS fields.
  if ('triggerId' in body) {
    return 'android';
  }
  return 'unknown';
}

function extractCustomData(body: Record<string, unknown>, parseCustomData: boolean): unknown {
  // Android valid-JSON case: customData is a JSON-encoded string.
  if ('customData' in body) {
    const raw = body.customData;
    if (!parseCustomData) return raw;
    if (!isString(raw)) return raw; // already an object (forward-compat)
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  // Android invalid-JSON fallback: customPayload holds raw user text.
  if ('customPayload' in body) {
    return body.customPayload;
  }
  return null;
}

export function normalize(
  body: Record<string, unknown>,
  parseCustomData: boolean,
): NormalizedPayload {
  const platform = detectPlatform(body);
  const customData = extractCustomData(body, parseCustomData);

  return {
    platform,
    triggerName: isString(body.trigger_name) ? body.trigger_name : null,
    triggerType: isString(body.trigger_type) ? body.trigger_type : 'nfc',
    event: isString(body.event) ? body.event : 'tap',
    timestamp: isString(body.timestamp) ? body.timestamp : new Date().toISOString(),
    source: isString(body.source) ? body.source : 'Nodey',
    triggerId: isString(body.triggerId) ? body.triggerId : null,
    customData,
    raw: body,
  };
}
