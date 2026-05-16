// HMAC signature verification.
//
// Nodey does NOT sign webhook requests today — see the developer responses in
// the HANDOFF.md. This helper is here so the node can opt-in to verification
// the moment Nodey ships signing without a new package release.
//
// Uses node:crypto (allowed by n8n's verified-community-node sandbox).

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifyOptions {
  // Raw request body as it arrived on the wire. HMAC must be computed over the
  // exact bytes the server received — not a JSON-parsed-then-restringified copy.
  rawBody: string;
  // The shared secret configured in the Nodey app + n8n credential.
  secret: string;
  // The signature header value, e.g. "sha256=abcdef..." or just the hex digest.
  signatureHeader: string | undefined;
  // Algorithm; default sha256 matches the most common webhook signing convention.
  algorithm?: 'sha256' | 'sha512';
}

export function verifySignature(opts: VerifyOptions): boolean {
  const { rawBody, secret, signatureHeader } = opts;
  if (!signatureHeader || !secret) return false;

  const algorithm = opts.algorithm ?? 'sha256';
  const provided = signatureHeader.startsWith(`${algorithm}=`)
    ? signatureHeader.slice(algorithm.length + 1)
    : signatureHeader;

  const expected = createHmac(algorithm, secret).update(rawBody).digest('hex');

  // timingSafeEqual requires equal-length buffers; bail early otherwise.
  if (provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
