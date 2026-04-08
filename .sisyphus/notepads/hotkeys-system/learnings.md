## Task 1 findings

- `PanelNode.vue` already handles `@keydown` on a focusable root (`tabindex="0"`) and intercepts `Ctrl+H` / `Ctrl+W` with `preventDefault()`.
- Electrobun `BrowserWindow` docs describe a native window with a webview, not browser chrome.
- Result: `Ctrl+Tab` and `Ctrl+L` should be interceptable in the webview `keydown` listener.

## Task 4 findings

- Bun test files in this package use `import { describe, expect, test } from 'bun:test'` and keep assertions compact.
- A simple in-order character scan is enough for the fuzzy match rule here; unicode labels did not require special handling beyond `toLowerCase()` for the covered cases.

## Task 3 findings

- `useHotkeys.ts` can stay testable without a real Vue component instance if it only depends on a `Ref`-shaped object (`{ value }`) and guards `window`/`document` access.
- In Bun unit tests here, a lightweight mock `window`, `KeyboardEvent`, and `HTMLElement` is sufficient to exercise global keydown behavior plus editable-element guards.
- bun run fix formats files and still reports pre-existing oxlint warnings; the hotkeys worktree itself passed typecheck and tests.

## Task 5 findings

- Centralizing the recording listener inside `useHotkeys.ts` keeps SettingsPanel simpler and preserves the single-listener constraint without changing combo capture behavior.
- `startKeyRecording()` can safely call `stopKeyRecording()` internally before invoking the callback, so the caller can also stop recording defensively.
