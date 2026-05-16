# n8n-nodes-nodey

[![npm version](https://img.shields.io/npm/v/n8n-nodes-nodey.svg)](https://www.npmjs.com/package/n8n-nodes-nodey)
[![License](https://img.shields.io/npm/l/n8n-nodes-nodey.svg)](./LICENSE)

**n8n community node that fires a workflow when you tap an NFC tag with the [Nodey mobile app](https://getnodey.com).**

Verified-compatible — installable on n8n Cloud via *Settings → Community Nodes*. Accepts payloads from both iOS and Android Nodey clients and normalizes them into a single shape.

## How it works

1. You install **n8n-nodes-nodey** in your n8n instance.
2. You add a **Nodey NFC Trigger** node to a workflow. n8n gives you a Production webhook URL.
3. In the Nodey app, you create an NFC trigger pointing at that URL.
4. Every tap on the tag POSTs to the webhook and runs your workflow.

## Installation

In n8n Cloud or self-hosted:

1. **Settings → Community Nodes → Install**
2. Enter the package name: `n8n-nodes-nodey`
3. Click **Install**

## What you get

- **Webhook trigger** — one POST per NFC tap, no polling.
- **Cross-platform payload normalization** — iOS and Android send different JSON shapes; the node merges them into a consistent output.
- **Android `customData` parsing** — Nodey on Android currently sends `customData` as a JSON-encoded string. The node parses it transparently (toggleable).
- **Optional tag UID allowlist** — restrict the trigger to a specific set of NFC tags.
- **Forward-compatible HMAC signature verification** — Nodey does not sign requests today, but if you set a webhook secret the node will require an `X-Nodey-Signature` (or `X-Signature`, or `X-Hub-Signature-256`) header. Ready for whenever Nodey ships signing.

## Normalized output

The default **Normalized** output format produces:

```jsonc
{
  "platform": "ios" | "android" | "unknown",
  "triggerName": "Front Door Tag" | null,
  "triggerType": "nfc",
  "event": "tap",
  "timestamp": "2026-05-16T12:30:45.123Z",
  "source": "Nodey",
  "triggerId": "8b3f9a7c-…" | null,
  "customData": { … } | "raw text" | null,
  "raw": { /* the original request body */ }
}
```

Switch to **Raw Payload** in the node settings if you'd rather work with what Nodey sent directly.

## Payload shapes (as of Nodey v2.3.x)

### iOS

```json
{
  "trigger_name": "Front Door Tag",
  "trigger_type": "nfc",
  "event": "tap",
  "timestamp": "2026-05-16T12:30:45.123Z",
  "source": "Nodey"
}
```

### Android (valid custom payload)

```json
{
  "triggerId": "8b3f9a7c-2d1e-4b5a-9c8f-6a3d1e7b2f4c",
  "timestamp": "2026-05-16T12:30:45.123Z",
  "customData": "{\"door\":\"front\",\"action\":\"unlock\"}"
}
```

### Android (invalid custom payload fallback)

```json
{
  "triggerId": "8b3f9a7c-2d1e-4b5a-9c8f-6a3d1e7b2f4c",
  "timestamp": "2026-05-16T12:30:45.123Z",
  "customPayload": "raw text the user entered"
}
```

## Delivery semantics

> Nodey attempts delivery **once per scan**. If the device is offline or the request fails, Nodey records the failed attempt locally but does not replay it. Workflows that need guaranteed delivery should handle acknowledgement, retry, or queueing inside n8n.

This matches what the Nodey iOS and Android devs confirmed: at-most-once, best-effort delivery, no retries from the app. NFC scans are intentional physical actions and a delayed replay would surprise users.

## Credentials

Credentials are **optional**. Skip them unless you need allowlisting or signing.

| Field | Purpose |
|---|---|
| **Webhook Secret** | Shared secret for HMAC verification. Leave blank — Nodey does not sign requests today. Setting it will reject unsigned requests, so configure once Nodey ships signing. |
| **Allowed Tag UIDs** | Comma-separated list of tag UIDs / trigger IDs. If set, scans from other tags are silently dropped (200 OK, no workflow run). |

## Local testing

Once installed, paste the **Test URL** from the node panel into curl:

```bash
# iOS payload
curl -X POST "<test-webhook-url>" \
  -H "Content-Type: application/json" \
  -d '{"trigger_name":"Front Door Tag","trigger_type":"nfc","event":"tap","timestamp":"2026-05-16T12:30:45.123Z","source":"Nodey"}'

# Android payload
curl -X POST "<test-webhook-url>" \
  -H "Content-Type: application/json" \
  -d '{"triggerId":"8b3f9a7c-2d1e-4b5a-9c8f-6a3d1e7b2f4c","timestamp":"2026-05-16T12:30:45.123Z","customData":"{\"door\":\"front\"}"}'
```

## More tools for n8n users

- **[Nodey](https://getnodey.com)** — Mobile command-centre for n8n. NFC triggers, geo-fenced location triggers, AI workflow builder, and on-the-go workflow debugging.
- **[n8n-nodes-ghost-blocks-cloud](https://www.npmjs.com/package/n8n-nodes-ghost-blocks-cloud)** — Publish to Ghost CMS from n8n Cloud using a clean content-blocks format.
- **[n8n-nodes-ghost-blocks](https://www.npmjs.com/package/n8n-nodes-ghost-blocks)** — Full-features Ghost publishing for self-hosted n8n (image upload, oEmbed, OpenGraph).

## License

MIT
