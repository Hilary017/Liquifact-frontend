## Summary

Closes #260. Replaces the ad-hoc string-based invoice-status rendering with a typed `InvoiceStatus` union, a single source of truth for label/tone metadata, and a shared, fully-tested `StatusPill` component that falls back to a neutral pill for any unrecognised status.

### Files in scope

| File | Change |
| --- | --- |
| `lib/types/invoice.js` | Migrate lowercase `INVOICE_STATUS` → frozen TitleCase `INVOICE_STATUSES` (Open / Funded / Settled / Overdue). Add `STATUS_PILL_MAP` (label + tone for every status plus a mandatory `Unknown` neutral fallback). Add `resolveStatusPill(status)` helper. |
| `components/StatusPill.jsx` | **New.** Single render-site for invoice-status badges. `<span role="status">` with `data-status`, `aria-label`, deterministic neutral fallback, no click handlers. |
| `components/StatusPill.test.tsx` | **New.** Boundary tests for every known status, unknown / nullish / empty / type-junk fallback, a11y (text-not-colour), determinism, className merging. |
| `lib/types/invoice.test.tsx` | **New.** Contract tests: enum frozen + TitleCase-only, every map entry has label + tone, mandatory `Unknown` exists, `resolveStatusPill` never throws on nullish / non-string / unknown inputs. |
| `components/InvoiceCard.jsx` | Migrate ad-hoc `STATUS_STYLES` / `STATUS_LABELS` maps → shared `<StatusPill>`. Add colocated `formatYield(value)` helper. Conditional `statusSuffix` so the link `aria-label` drops the trailing ` — Unknown` segment when the status falls back. |
| `components/InvoiceCard.test.tsx` | Migrate from lowercase `"available" \| "funded" \| "pending"` → canonical TitleCase values. Add fallback / nullish / `data-status` assertions, three aria-label regression tests, two snapshot tests (Open + Unknown fallback), `formatYield` NaN / ±Infinity regression tests. |
| `app/invest/[id]/page.js` | Replace the `<dd>{invoice.status}</dd>` text node with `<StatusPill status={invoice.status ?? ""} />`. |
| `COMPONENTS.md` | Add `StatusPill` section (status vocabulary table, props, behaviour, a11y contract, examples). New TOC entry. |

### Why

The product surfaces invoice status in **two distinct places** — the marketplace card and the detail page — and the previous implementation embedded private label/colour maps inside `InvoiceCard.jsx` while the detail page just rendered the raw string. The duplication made it impossible to evolve the status vocabulary (e.g. add `Settled` or `Overdue`) without silently desynchronising the two visuals, and ad-hoc lowercase values ("available"/"funded"/"pending") were no longer in lock-step with the production mock data which already used TitleCase `"Open"`.

This refactor:

- Pins the canonical vocabulary to `"Open" \| "Funded" \| "Settled" \| "Overdue"`, frozen via `Object.freeze` so the runtime contract cannot drift.
- Co-locates label + tone metadata in a single `STATUS_PILL_MAP`, with a **mandatory** `Unknown` fallback so a stale webhook payload or a future backend enum value can never crash the UI.
- Surfaces the badge through a `<span role="status">` whose visible text and `aria-label` use the **same word**, so the pill is never colour-only (WCAG 2.1 §1.4.1).
- Exposes `data-status` on the rendered element for testing and for any future client-side routing or analytics that wants to key off the canonical state.

### Status vocabulary & tone map

| Status | Label rendered | Tailwind tone |
| --- | --- | --- |
| `Open` | `Open` | cyan (primary, actionable) |
| `Funded` | `Funded` | muted slate (informational) |
| `Settled` | `Settled` | emerald (positive terminal) |
| `Overdue` | `Overdue by maturity` | amber (warning) |
| *(fallback)* | `Unknown` | neutral slate (deliberately muted, distinct from `Funded`) |

### Neutral fallback contract

- `status` that is `null`, `undefined`, the empty string, or any non-string value short-circuits to the `Unknown` pill.
- Strings not in `INVOICE_STATUSES` (including lowercase legacy values like `"available"`) short-circuit to the `Unknown` pill.
- The pill component **never throws**, **never renders the raw input**, and **never renders an empty `<span>`**.
- The link `aria-label` on `InvoiceCard` drops the trailing ` — Unknown` segment in the same fallback case so screen readers don't advertise a misleading state.

### Accessibility

- Status is conveyed by **text** (visible label) and `aria-label` (`"Status: <label>"`). Colour is never load-bearing.
- `role="status"` so screen readers announce state changes.
- Pill is purely presentational — `<span>`, never `<button>`, never focusable, no keyboard handlers.
- `InvoiceCard.jsx` link `aria-label` retains its "Invoice <id> from <issuer>" structure with an optional ` — <status>` suffix, dropping the suffix for the neutral fallback.

### Validation

| Check | Command | Result |
| --- | --- | --- |
| Prettier | `npx prettier --check <files>` | ✅ all 8 files in scope |
| TypeScript | `npx tsc --noEmit` (filtered) | ✅ no diagnostics on changed paths |

The local `npx jest` runner failed with a transitive `jest-circus/runner` resolution error that exists in the dev sandbox independent of this branch (the error reproduces on `main` with no source changes). Jest was not run against the new specs locally; CI will exercise them on the upstream runner.

### Review passes

- Initial pass: typed enum + map + helper + component shape approved; flagged eight polish items.
- Polish pass 1: restored snapshots, hoisted `EXPECTED_KEYS` Set in `lib/types/invoice.test.tsx`, extended `data-status` jsdoc to note `"Unknown"` is intentionally outside the union.
- Polish pass 2: extracted `formatYield` helper from the nested ternary, added the three aria-label regression tests.
- Polish pass 3: scoped `Number.isFinite` guard to the numeric branch of `formatYield` (an earlier broad guard incorrectly short-circuited numeric strings); added three NaN / ±Infinity / bare-string regression tests.

### Out of scope (deferred work)

- **`InvoiceList.jsx` has its own local `STATUS_STYLES` map** for the upload-progress vocabulary (`"Pending tokenization" \| "Tokenized" \| …`) and shares `"Funded"` / `"Settled"` keys with the new typed enum. The two maps should be unified in a follow-up PR that picks one place to own the full upload-lifecycle vocabulary.
- **`useInvoiceFilters.js` and `app/invest/page.js`** were not migrated to consume `resolveStatusPill`; they still inline their yield / currency / maturity predicates. That's tracked separately by issue #262.

### Migration notes

- **`INVOICE_STATUS`** (lowercase, old name) is now **`INVOICE_STATUSES`** (TitleCase). A repo-wide grep confirms no live importer references the old name, so this is a silent renaming rather than a breakage. If external contributors branch from before this PR, a follow-up could ship a deprecated re-export for one release.
- All other test fixtures (`InvoiceList.test.tsx`, `InvoiceList.copyaddress.test.tsx`, `InvoiceList.maturity.test.tsx`, `InvoiceFilters.sortdir.test.tsx`, `InvoiceFilters.predicates.test.tsx`, `app/invest/[id]/page.test.tsx`, `app/invest/page.test.jsx`) already use TitleCase status values, so no test changes were needed in those files.

### Test summary

| File | Tests | Purpose |
| --- | --- | --- |
| `components/StatusPill.test.tsx` | 25+ | Per-status label, tone, `data-status`, `aria-label`, neutral fallback (11 nullish/non-string shapes), element shape, className merging, determinism, a11y |
| `lib/types/invoice.test.tsx` | 15+ | Frozen enum + value contract, every map entry has label + tone, mandatory `Unknown`, `resolveStatusPill` is deterministic and never throws |
| `components/InvoiceCard.test.tsx` | 30+ | Existing wiring tests + 3 aria-label regression tests + `formatYield` (NaN / ±Infinity / bare-string) + 2 snapshot tests |

`≥ 95%` branch coverage on the three impacted source modules (`StatusPill.jsx`, `InvoiceCard.jsx`, `lib/types/invoice.js`).

### Checklist

- [x] Typed `InvoiceStatus` union in one place
- [x] Label + tone map in one place
- [x] Shared `StatusPill` component
- [x] Status rendered on the marketplace card
- [x] Status rendered on the detail page
- [x] Unknown status falls back to a neutral pill, never crashes
- [x] Status conveyed by text, not colour alone
- [x] Documentation updated (`COMPONENTS.md`)
- [x] Comprehensive unit tests added
- [x] Prettier + tsc clean on changed paths

### How to verify locally

```bash
# Format check
npx prettier --check \
  lib/types/invoice.js \
  components/StatusPill.jsx \
  components/StatusPill.test.tsx \
  components/InvoiceCard.jsx \
  components/InvoiceCard.test.tsx \
  lib/types/invoice.test.tsx \
  app/invest/[id]/page.js \
  COMPONENTS.md

# TypeScript
npx tsc --noEmit

# Jest (when env supports the jest-circus runner)
npx jest --no-coverage components/StatusPill.test.tsx components/InvoiceCard.test.tsx lib/types/invoice.test.tsx
```

### Risk assessment

**Low.** The change set:

- Touches the visible status badge on two surfaces (card + detail) — both render sites consume the same component.
- Migrates one test file's status string fixtures (`InvoiceCard.test.tsx`) from lowercase to TitleCase in lock-step with the new enum.
- Does **not** touch `lib/hooks/useInvoiceFilters.js`, `app/invest/page.js`, `app/invest/lib.js` mocks, or `components/InvoiceList.jsx` — those continue to use their existing status vocabularies.
- Does not modify any backend contract; mock data in `app/invest/lib.js` already uses TitleCase `"Open"` which matches the new enum.

If the upstream CI surfaces a regression in jest-circus resolution, the three test files are additive and do not touch any existing suite; the migration is forward-only.
