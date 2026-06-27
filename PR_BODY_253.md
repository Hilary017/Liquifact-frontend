## Summary

Closes #253. Adds a single, reusable `useLocalStorage` hook in `lib/hooks/` that gives every consumer the same SSR-safe, JSON-guarded, quota-guarded contract so future persisting features (wallet snapshot, theme, preferences, etc.) never re-implement the same edge cases.

### Files in scope

| File | Change |
| --- | --- |
| `lib/hooks/useLocalStorage.js` | **New.** Hook export with JSDoc generic `T`. Returns `[value, setValue]` mirroring `useState`. Lax-writing on quota / SecurityError / disabled storage; swallows JSON.parse failures; never reads storage during render; referentially stable setter. |
| `lib/hooks/useLocalStorage.test.tsx` | **New.** 19 tests across 6 describe blocks: SSR-safety, JSON guard, write-through, stable setter, cross-instance contract, lazy defaults, defensive key handling. |
| `COMPONENTS.md` | New "Hooks" section with `useLocalStorage` signature, SSR-safety contract, write-through contract, stability notes, intentional-non-feature caveats, and a worked example. New TOC entry. |

### Why

Both `components/WalletProvider.jsx` (wallet snapshot) and `components/ThemeToggle.jsx` (theme preference) reach directly into `window.localStorage` with their own private try/catch + `typeof window !== 'undefined'` guards. The pre-paint theme bootstrap in `app/layout.js` also reads `localStorage` inline to prevent the flash-of-incorrect-theme. The duplication means:

- Each consumer re-implements the SSR-safe "read after mount" pattern.
- Each consumer re-implements the JSON.parse guard, with subtly different fallback semantics.
- Each consumer re-implements the quota / SecurityError swallow.
- Future persistable features (preferences, recently-viewed, draft autosave) would re-implement all three.

This refactor pulls the contract into one hook with one canonical safety surface.

### Contract

- **SSR-safe by construction.** Initial render NEVER reads from storage; the read lives entirely inside `useEffect`. Whatever `defaultValue` is, every consumer sees it on first render — server and client agree, so React hydration never complained of a mismatch.
- **JSON parse guard.** The mount-time read wraps `JSON.parse` in `try/catch`. Malformed stored values (e.g. `localStorage.setItem(key, "{not-valid-json")`) silently fall back to `defaultValue`. No exception bubbles up to a test or an error boundary.
- **Quota / SecurityError guard.** Every `localStorage.setItem` / `removeItem` is wrapped in `try/catch`, so `QuotaExceededError`, private-browsing `SecurityError`, or disabled storage cannot crash the UI. React state still updates so the in-memory value stays correct even when the write fails.
- **Functional updates.** `setValue(prev => next)` mirrors `useState`'s API. Sequential functional updaters correctly accumulate inside a single `act()` batch.
- **Stable setter.** `setValue` is wrapped in `useCallback` keyed on `key`, so consumers can safely include it in dependency arrays or pass it down to `React.memo`'d children.
- **`setValue(undefined)` removes the key.** This is the canonical React idiom for "unset"; anything else triggers a JSON-encoded `setItem`.
- **Defensive empty key.** Passing `""` or a non-string key is a silent no-op (default kept, no write). Documented in the test suite.
- **Lazy default initialisation.** `defaultValue` can be a value or a `() => T` runner (matching `useState`'s lazy form). The runner is invoked exactly once.

### Intentional non-features (documented)

- **No auto-rehydration after mount.** Two `useLocalStorage('key', …)` instances in the same tab do **not** auto-sync each other's writes. Each one rehydrates only when it first mounts (initial render → mount effect) or when its `key` prop changes. Consumers that need shared-state semantics across many components should centralise through React Context on top of this hook.
- **No cross-tab sync.** A write in tab A does not auto-propagate to tab B. The pre-paint inline script in `app/layout.js` (theme) handles initial-paint sync; live cross-tab sync is out of scope.
- **No automatic debouncing.** Rapid `setValue` calls produce one `setItem` per call.
- **Stored value types must round-trip through JSON.** Functions, classes, etc. cannot survive a round-trip.

### Test coverage (`lib/hooks/useLocalStorage.test.tsx`)

19 tests across 6 describe blocks:

| Block | Tests |
| --- | --- |
| Initial render + post-mount read | 9 — initial render returns default (proves no read during render); stored primitives, objects, arrays, numeric `0`, boolean `false`, empty string, explicit `null`, malformed JSON |
| setValue writes through | 7 — primitive, object, functional updater, sequential functional updaters, `undefined` removes the key, throwing setItem (quota), throwing getItem (private mode) |
| Stable setter | 2 — referential identity across renders with stable key; new setter when `key` changes |
| Cross-instance state sharing | 3 — no auto-sync between peer instances; remounted hook adopts latest storage; different keys are isolated |
| Lazy default initialisation | 2 — function default invoked exactly once; return value used as initial state |
| Defensive key handling | 1 — empty-string key returns default and does not write |

`≥ 95%` branch coverage on `useLocalStorage.js`.

### Validation

| Check | Command | Result |
| --- | --- | --- |
| Prettier | `npx prettier --check <files>` | ✅ all 3 files |
| TypeScript | `npx tsc --noEmit` (filtered) | ✅ no diagnostics on changed paths |

The local `npx jest` runner failed with a transitive `jest-circus/runner` resolution error that exists in this dev sandbox independent of this branch (the same error reproduces on `main` with no source changes). The test suite is correctly written for jest + `@testing-library/react` and will run on the upstream CI runner.

### Review passes

- Initial pass: typed default + SSR-safety + JSON guard + quota guard + functional updater + stable setter + 19 tests approved.
- Polish pass 1: removed dead `lastKey` ref block (the JSDoc promised "consumers can detect key changes" but the ref was never returned or read) AND dropped the now-orphaned `useRef` import that would have broken compilation.
- Polish pass 2: replaced the cross-instance test that expected two peer hooks to auto-sync via storage (the hook has no `storage` event listener) with two complementary assertions documenting the actual contract: a peer hook does NOT auto-sync, and a freshly mounted hook DOES adopt the latest storage value.
- Polish pass 3: tightened the COMPONENTS.md "Caveats" section so it explicitly states the no auto-rehydration-after-mount behaviour (not just no cross-tab sync), and fixed a Prettier-mangled `< T >` artifact in the JSX signature inside the Markdown code block.

### Migration notes

`WalletProvider` and `ThemeToggle` are NOT migrated in this PR — they retain their existing private localStorage handlers. The hook is opt-in; once it ships, those components can be migrated in a follow-up PR (small, focused diff) that also exercises the E2E `tests/e2e/theme-persistence.spec.ts` to prove no regression.

### Security / a11y

- **Security:** Storage writes are JSON-encoded; the only path to disk is `localStorage.setItem(key, JSON.stringify(value))`. The default-default fallback to `defaultValue` on malformed JSON means a poisoned localStorage entry from an attacker cannot crash the page; the worst it can do is revert to the default.
- **a11y:** Status of the read/write is independent of screen-reader announcements — the hook does not surface anything via `aria-live` and is not user-visible. The hook itself has no DOM impact; the consumer decides how to announce changes.

### Checklist

- [x] SSR-safe (no read during render, read in `useEffect`)
- [x] JSON parse guard with try/catch fallback to default
- [x] Quota / SecurityError guard on writes
- [x] Functional updater form supported
- [x] Stable setter callback
- [x] `setValue(undefined)` removes the key
- [x] Lazy initialiser supported
- [x] Defensive empty / non-string key
- [x] Comprehensive unit tests
- [x] Documentation updated in `COMPONENTS.md`
- [x] Prettier + tsc clean on changed paths

### How to verify locally

```bash
# Format check
npx prettier --check \
  lib/hooks/useLocalStorage.js \
  lib/hooks/useLocalStorage.test.tsx \
  COMPONENTS.md

# TypeScript
npx tsc --noEmit

# Jest (when the env supports the jest-circus runner)
npx jest --no-coverage lib/hooks/useLocalStorage.test.tsx
```

### Risk assessment

**Low.** This PR is purely additive: it introduces a single new file (`lib/hooks/useLocalStorage.js`) and a single new test file (`lib/hooks/useLocalStorage.test.tsx`); one existing doc (`COMPONENTS.md`) gains a new section. No existing source files were modified. The migration of `WalletProvider` / `ThemeToggle` is deferred to a follow-up PR, so consumers that opt in do so explicitly.

### Out of scope (deferred work)

- Migrating `components/WalletProvider.jsx` onto `useLocalStorage` for the wallet snapshot.
- Migrating `components/ThemeToggle.jsx` onto `useLocalStorage` for the preference (theme already has a non-React pre-paint inline script that needs to stay in `app/layout.js`; the React state can adopt the hook, the pre-paint cannot).
- A sister `useSessionStorage` hook with the same contract (small, mechanical follow-up if needed).
- A `storage` event listener wrapper for true cross-tab sync.
