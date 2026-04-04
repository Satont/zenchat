---
name: 7tv-events-api
description: Complete reference for 7TV EventAPI v3 — WebSocket and SSE protocols, opcodes, subscription types, ChangeMap/ChangeField payloads, close codes, and TypeScript implementation patterns for real-time emote/user/entitlement events.
license: MIT
compatibility: opencode
---

## Overview

**Base URL:** `https://events.7tv.io`  
**Supported version:** V3 (`/v3`)  
**Protocols:** WebSocket (`wss://events.7tv.io/v3`) and Server-Sent Events (`https://events.7tv.io/v3`)

> ⚠️ The GitHub repo `SevenTV/EventAPI` is **archived**. The canonical repo is now at `https://github.com/seventv/seventv`, but v3 of the Events API remains live at `events.7tv.io`.

---

## Opcodes

| Op  | Name          | Direction | Description                                            |
| --- | ------------- | --------- | ------------------------------------------------------ |
| 0   | Dispatch      | ⬇️ Server | Subscribed event fired — contains ChangeMap            |
| 1   | Hello         | ⬇️ Server | Sent on connect — heartbeat interval + session ID      |
| 2   | Heartbeat     | ⬇️ Server | Keep-alive ping                                        |
| 4   | Reconnect     | ⬇️ Server | Server wants client to reconnect                       |
| 5   | Ack           | ⬇️ Server | Server acknowledged a client command                   |
| 6   | Error         | ⬇️ Server | An error occurred — always log                         |
| 7   | End of Stream | ⬇️ Server | Connection closing imminently — see close code in body |
| 33  | Identify      | ⬆️ Client | Authenticate with an account token                     |
| 34  | Resume        | ⬆️ Client | Resume a previous session by session_id                |
| 35  | Subscribe     | ⬆️ Client | Subscribe to event type + conditions                   |
| 36  | Unsubscribe   | ⬆️ Client | Unsubscribe from event type                            |
| 37  | Signal        | ⬆️ Client | (undocumented)                                         |

---

## Close Codes

| Code | Name                   | Reconnect? | Notes                         |
| ---- | ---------------------- | ---------- | ----------------------------- |
| 4000 | Server Error           | Yes        |                               |
| 4001 | Unknown Operation      | No ¹       | Fix client bug first          |
| 4002 | Invalid Payload        | No ¹       | Fix client bug first          |
| 4003 | Auth Failure           | No ¹       |                               |
| 4004 | Already Identified     | No ¹       |                               |
| 4005 | Rate Limited           | Maybe ³    | Only if user-initiated        |
| 4006 | Restart                | Yes        |                               |
| 4007 | Maintenance            | Yes ²      | Wait ≥5 min with jitter       |
| 4008 | Timeout                | Yes        | Client was idle too long      |
| 4009 | Already Subscribed     | No ¹       | Duplicate condition           |
| 4010 | Not Subscribed         | No ¹       | Unsubscribe from unknown type |
| 4011 | Insufficient Privilege | Maybe ³    | Only if user-initiated        |

---

## WebSocket Message Structure

Every WebSocket frame is JSON:

```typescript
interface WSMessage {
  op: number // opcode
  t: number // unix timestamp (milliseconds)
  d: unknown // payload, type depends on op
}
```

---

## Payloads

### Hello (op: 1)

Sent immediately after connecting.

```typescript
interface HelloPayload {
  heartbeat_interval: number // ms between heartbeats
  session_id: string // save this for Resume
  subscription_limit: number // max concurrent subscriptions
}
```

### Heartbeat (op: 2)

```typescript
interface HeartbeatPayload {
  count: number // total heartbeats so far
}
```

If 3 consecutive heartbeats are missed → connection is dead, reconnect.

### Ack (op: 5)

```typescript
interface AckPayload {
  command: string // e.g. "SUBSCRIBE", "UNSUBSCRIBE", "RESUME"
  data: unknown // echo of the client's payload
}
```

### Error (op: 6)

Always log. Contains an error message string.

### End of Stream (op: 7)

```typescript
interface EndOfStreamPayload {
  code: number // close code (4000–4011)
  message: string // human-readable reason
}
```

### Resume (op: 34) — client sends

```typescript
interface ResumePayload {
  session_id: string // session_id from the previous Hello
}
```

On success: server sends Ack with `command: "RESUME"`, restores subscriptions, replays missed Dispatches.

### Subscribe (op: 35) — client sends

```typescript
interface SubscribePayload {
  type: EventType // see Subscription Types below
  condition: Record<string, string> // filter fields (usually object_id)
}
```

Example:

```json
{
  "op": 35,
  "d": {
    "type": "emote_set.update",
    "condition": {
      "object_id": "62cdd34e72a832540de95857"
    }
  }
}
```

### Unsubscribe (op: 36) — client sends

```typescript
interface UnsubscribePayload {
  type: EventType
  condition?: Record<string, string> // omit to unsubscribe entire type
}
```

### Dispatch (op: 0)

Fired when a subscribed event occurs.

```typescript
interface DispatchPayload {
  type: EventType
  body: ChangeMap
}
```

---

## ChangeMap

```typescript
interface ChangeMap {
  id: string // ObjectID of the changed object
  kind: number // object kind (int8)
  contextual?: boolean // true = local/session-only change
  actor: User // user who made the change
  added?: ChangeField[]
  updated?: ChangeField[]
  removed?: ChangeField[]
  pushed?: ChangeField[] // item appended to an array
  pulled?: ChangeField[] // item removed from an array
}
```

---

## ChangeField

```typescript
interface ChangeField {
  key: string
  index?: number // array index (if field is an array)
  nested?: boolean // true → value is ChangeField[]
  old_value?: unknown
  value?: unknown | ChangeField[] // ChangeField[] when nested === true
}
```

---

## Subscription Types

| Type                     | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `system.announcement`    | System-wide announcement                         |
| `emote.create`           | New emote created                                |
| `emote.update`           | Emote updated                                    |
| `emote.delete`           | Emote deleted                                    |
| `emote_set.create`       | New emote set created                            |
| `emote_set.update`       | Emote set updated (most common — channel emotes) |
| `emote_set.delete`       | Emote set deleted                                |
| `user.create`            | New user created                                 |
| `user.update`            | User updated                                     |
| `user.delete`            | User deleted                                     |
| `user.add_connection`    | Platform connection added to user                |
| `user.update_connection` | Platform connection updated                      |
| `user.delete_connection` | Platform connection removed                      |
| `cosmetic.create`        | Cosmetic created                                 |
| `cosmetic.update`        | Cosmetic updated                                 |
| `cosmetic.delete`        | Cosmetic deleted                                 |
| `entitlement.create`     | Entitlement granted                              |
| `entitlement.update`     | Entitlement updated                              |
| `entitlement.delete`     | Entitlement revoked                              |

**Wildcard**: Use `emote.*` to subscribe to `emote.create`, `emote.update`, and `emote.delete` simultaneously. Same applies to `user.*`, `emote_set.*`, `cosmetic.*`, `entitlement.*`.

---

## Condition Fields

Most subscription types accept `object_id` to filter for a specific object.

For entitlement/cosmetic events scoped to a channel:

```json
{
  "host_id": "<7tv_user_id>",
  "connection_id": "<platform_connection_id>"
}
```

---

## SSE (Server-Sent Events)

**Endpoint:** `https://events.7tv.io/v3`  
Use the browser `EventSource` API or any SSE client. Opcodes are sent as the SSE `event` type (text), data is always JSON.

### Inline Subscriptions (SSE)

Append `@` + URL-encoded subscription string to the URL:

```
{type}<{key1}={val1};{key2}={val2}>,{type2}<...>
```

Examples:

```
# Single emote_set subscription:
GET https://events.7tv.io/v3@emote_set.update<object_id=62cdd34e72a832540de95857>

# Multiple subscriptions (URL-encoded):
GET https://events.7tv.io/v3@entitlement.*<host_id=60867b015e01df61570ab900;connection_id=1234>,cosmetic.*<host_id=60867b015e01df61570ab900;connection_id=1234>
```

ACK events are sent immediately after session is ready to confirm subscription validity.

> Managing subscriptions via REST is **not yet available** — use inline subscriptions.

---

## TypeScript: WebSocket Implementation

```typescript
const WS_URL = 'wss://events.7tv.io/v3'

interface SevenTVMessage {
  op: number
  t: number
  d: unknown
}

class SevenTVEventClient {
  private ws: WebSocket | null = null
  private sessionId: string | null = null
  private heartbeatInterval: number | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private missedHeartbeats = 0

  connect(previousSessionId?: string) {
    this.ws = new WebSocket(WS_URL)

    this.ws.onmessage = (event) => {
      const msg: SevenTVMessage = JSON.parse(event.data)
      this.handleMessage(msg, previousSessionId)
    }

    this.ws.onclose = (event) => {
      this.clearHeartbeat()
      const shouldReconnect = [4000, 4006, 4007, 4008].includes(event.code)
      if (shouldReconnect) {
        setTimeout(() => this.connect(this.sessionId ?? undefined), 3000)
      }
    }
  }

  private handleMessage(msg: SevenTVMessage, previousSessionId?: string) {
    switch (msg.op) {
      case 1: {
        // Hello
        const hello = msg.d as { heartbeat_interval: number; session_id: string }
        this.sessionId = hello.session_id
        this.startHeartbeat(hello.heartbeat_interval)
        if (previousSessionId) {
          this.resume(previousSessionId)
        }
        break
      }
      case 2: // Heartbeat
        this.missedHeartbeats = 0
        break
      case 0: {
        // Dispatch
        const dispatch = msg.d as { type: string; body: ChangeMap }
        this.onDispatch(dispatch.type, dispatch.body)
        break
      }
      case 7: {
        // End of Stream
        const eos = msg.d as { code: number; message: string }
        console.error('7TV End of Stream:', eos)
        break
      }
    }
  }

  subscribe(type: string, condition: Record<string, string> = {}) {
    this.send(35, { type, condition })
  }

  unsubscribe(type: string, condition?: Record<string, string>) {
    this.send(36, { type, condition })
  }

  private resume(sessionId: string) {
    this.send(34, { session_id: sessionId })
  }

  private send(op: number, d: unknown) {
    this.ws?.send(JSON.stringify({ op, d }))
  }

  private startHeartbeat(intervalMs: number) {
    this.heartbeatInterval = intervalMs
    this.heartbeatTimer = setInterval(() => {
      this.missedHeartbeats++
      if (this.missedHeartbeats >= 3) {
        this.ws?.close()
      }
    }, intervalMs)
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
  }

  // Override in subclass or assign handler
  onDispatch(type: string, body: ChangeMap): void {}
}
```

---

## TypeScript: SSE Implementation

```typescript
const SSE_BASE = 'https://events.7tv.io/v3'

function connectSSE(emoteSetId: string, onUpdate: (body: ChangeMap) => void) {
  const encoded = encodeURIComponent(`emote_set.update<object_id=${emoteSetId}>`)
  const url = `${SSE_BASE}@${encoded}`
  const es = new EventSource(url)

  // SSE event names match opcode names in text form
  es.addEventListener('dispatch', (e: MessageEvent) => {
    const payload = JSON.parse(e.data) as { type: string; body: ChangeMap }
    onUpdate(payload.body)
  })

  es.addEventListener('error', (e) => {
    console.error('7TV SSE error', e)
  })

  return es // call es.close() to disconnect
}
```

---

## Common Patterns

### Subscribe to a channel's emote set updates

The most common use case — track emote changes for a Twitch channel:

```typescript
// 1. Fetch the user's 7TV emote_set id (via 7TV REST API)
// 2. Subscribe to emote_set.update with that id
client.subscribe('emote_set.update', { object_id: emoteSetId })

// 3. In onDispatch, check body.pushed/pulled/updated for emote changes
client.onDispatch = (type, body) => {
  if (type !== 'emote_set.update') return

  for (const field of body.pushed ?? []) {
    if (field.key === 'emotes') {
      console.log('Emote added:', field.value)
    }
  }
  for (const field of body.pulled ?? []) {
    if (field.key === 'emotes') {
      console.log('Emote removed:', field.value)
    }
  }
}
```

### Subscribe to personal emotes (entitlements)

```typescript
client.subscribe('entitlement.*', {
  host_id: sevenTvUserId,
  connection_id: twitchConnectionId,
})
```
