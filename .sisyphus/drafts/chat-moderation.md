# Draft: Chat Moderation Actions (Ban/Timeout)

## Requirements (confirmed)

- Issue #16: Add ban/timeout features for Twitch and Kick
- Only available to broadcaster/moderator
- Right-click context menu on chat messages

## Actions needed (per platform)

### Twitch

- Ban user (permanent)
- Timeout user (with duration options: 1m, 5m, 10m, 1h, custom?)
- Delete message

### Kick

- Ban user
- Timeout user

## Technical Decisions

- Context menu UI: reka-ui Popover (уже используется в ChatAppearancePopover.vue) — recommended
- Альтернатива: кастомный дропдаун как в PanelNode.vue
- RPC flow: ChatMessage.vue @contextmenu → rpc.request.moderationAction → bun/index.ts → platform adapter
- Проверка роли: по badges в message.author (быстро, клиентски) + accounts

## Codebase Findings

- ChatMessage.vue: нет @contextmenu handler, есть hover copy/reply кнопки
- NormalizedChatMessage.author.badges[] — можно проверить 'moderator'/'broadcaster' badge
- BasePlatformAdapter: нет moderation методов → нужно расширить
- TwitchAdapter: логирует ban/timeout events, но не реализует moderation API
- RPC schema: нет moderation методов → нужно добавить ban/timeout/deleteMessage
- UI patterns: reka-ui Popover (ChatAppearancePopover.vue), кастомный (PanelNode.vue)
- Backend OAuth scopes (twitch.ts): НЕТ moderation scopes → нужно добавить

## Research Findings

### Twitch Helix API (confirmed)

**Ban/Timeout**: POST `/helix/moderation/bans`

- `broadcaster_id`, `moderator_id` in query params
- Body: `{ data: { user_id, duration?, reason? } }`
- Timeout: include `duration` (seconds), Ban: omit `duration`
- Scope: `moderator:manage:banned_users`

**Delete Message**: DELETE `/helix/moderation/chat`

- `broadcaster_id`, `moderator_id`, `message_id` in query params
- Scope: `moderator:manage:chat_messages`

**Check moderator**: GET `/helix/moderation/moderators`

- `broadcaster_id`, `user_id` params
- Scope: `moderation:read`

**Permission logic**:

1. Get current user ID from OAuth token
2. Compare to broadcaster_id → if match, broadcaster (full access)
3. Otherwise call moderators endpoint to check if moderator

- [ ] Chat message component structure (agent running)
- [ ] NormalizedChatMessage type (agent running)
- [ ] Platform adapter capabilities (agent running)
- [ ] RPC schema (agent running)
- [ ] Kick moderation API (TBD)

## Open Questions

- Which timeout durations to offer?
- Kick moderation API specifics
- How is user role (broadcaster/mod) currently tracked?

## Scope Boundaries

- INCLUDE: Right-click context menu on messages, Twitch ban/timeout/delete, Kick ban/timeout
- EXCLUDE: Unban flows, mod management UI
