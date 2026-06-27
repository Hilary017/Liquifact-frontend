# Filter Controls — Implementation Contract

## Overview

## Current State

Filter controls are fully interactive. Sort order for the **Amount** and **Yield** columns supports an ascending/descending direction toggle.

## 1. Invoice Object Schema

The marketplace currently maps to the following object structure. The hook expects this exact shape when performing derived state calculations.

The marketplace maps to the following object structure. The `filterInvoices()` function and `useInvoiceFilters` hook expect this exact shape when performing derived state calculations.

## Filter Controls

### 1. Issuer Search

- **Purpose:** Filter invoices by issuer name (case-insensitive substring match).
- **UI:** `InvoiceSearch` component with debounced input (`SEARCH_DEBOUNCE_MS = 200`).
- **Active chip:** `Search: {query}` — removing clears the search field.

### 2. Yield Range Filter

- **Purpose:** Filter invoices by yield percentage range.
- **Future API Contract:** `GET /api/invoices?yield_min=5&yield_max=10`
- **Active chips:** `Min yield: {n}%`, `Max yield: {n}%`

### 4. Sort Options (with direction toggle)

- **Purpose**: Sort invoices by column with ascending/descending toggle for Amount and Yield
- **Sort state shape**:
  ```ts
  {
    sort: "" | "amount" | "yield" | "maturity"; // active sort column
    sortDir: "asc" | "desc"; // direction, default 'desc'
  }
```
- **Future API Contract:** `GET /api/invoices?sort=amount&sort_dir=asc`
- **Active chip:** `Sort: {label}` (e.g. `Sort: Best Yield`)

#### Direction toggle behaviour

| State                          | UI element             | aria-sort value |
| ------------------------------ | ---------------------- | --------------- |
| Column is active, dir = `desc` | ↓ button, enabled      | `descending`    |
| Column is active, dir = `asc`  | ↑ button, enabled      | `ascending`     |
| Column is **not** active       | ↓ button, **disabled** | `none`          |

| State                          | UI element             | aria-sort value |
| ------------------------------ | ---------------------- | --------------- |
| Column is active, dir = `desc` | ↓ button, enabled      | `descending`    |
| Column is active, dir = `asc`  | ↑ button, enabled      | `ascending`     |
| Column is **not** active       | ↓ button, **disabled** | `none`          |

| State | UI element | `aria-sort` value |
|---|---|---|
| Column active, dir = `desc` | ↓ button, enabled | `descending` |
| Column active, dir = `asc` | ↑ button, enabled | `ascending` |
| Column **not** active | ↓ button, disabled | `none` |

Only `amount` and `yield` columns have direction toggles. Maturity is sorted via the main select only.

#### `parseSortState(filters)` helper

Returns `{ column: string, dir: 'asc'|'desc' }`.  
Supports both new plain-column sort values (`'amount'`, `'yield'`) and legacy compound values (`'amount_desc'`, `'yield_asc'`).

#### `applySortToList(list, filters)` helper (page.js)

Pure function that returns a sorted copy of invoice list. Does **not** mutate the original array.

### 5. Clear Filters

- **Purpose**: Reset all applied filters, including `sortDir` back to `'desc'`
- **Future API Contract**: Reset to base `GET /api/invoices`
- **UI State**: Active (disabled when no filters are active)

## 2. Filter Predicates (exported)

Pure, testable export functions from `components/InvoiceFilters.jsx`. These
encode the exact filtering contract used by `lib/hooks/useInvoiceFilters.js`
and `app/invest/page.js` for valid inputs, but additionally enforce a
**strict NaN-defence contract** that protects against malformed invoice data.

### 2.1 Predicate inventory

| Export                                                           | Signature                                                      | Used by            |
| ---------------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| `matchesYieldRange(invoiceYield, yieldMin, yieldMax)`            | `(string\|number\|null\|undefined, string, string) => boolean` | Yield predicate    |
| `matchesCurrency(invoiceCurrency, currency)`                     | `(string\|null\|undefined, string) => boolean`                 | Currency predicate |
| `matchesMaturityRange(invoiceDueDate, maturityFrom, maturityTo)` | `(string, string, string) => boolean`                          | Maturity predicate |
| `matchesFilters(invoice, filters)`                               | `(Invoice, Filters) => boolean`                                | Combined AND       |

All four are imported from `components/InvoiceFilters.jsx`; the unit tests
live in `components/InvoiceFilters.predicates.test.tsx`.

### 2.2 Yield range — inclusive both ends

| Filter            | Invoice yield | Result                       |
| ----------------- | ------------- | ---------------------------- |
| `yieldMin = 8.0`  | `8.0%`        | ✅ pass (inclusive lower)    |
| `yieldMin = 8.0`  | `7.9%`        | ❌ fail                      |
| `yieldMax = 8.0`  | `8.0%`        | ✅ pass (inclusive upper)    |
| `yieldMax = 8.0`  | `8.1%`        | ❌ fail                      |
| Both bounds empty | any value     | ✅ pass (parseable yields)   |
| Both bounds empty | unparseable   | ❌ fail (strict NaN defence) |

The invoice yield accepts either the `"8.2%"` percentage string format
(used by `lib/api/invoices.js`) or a bare number `8.2`. Non-numeric /
`NaN` invoice yields are excluded even when both bounds are empty — see
[§ 2.5](#25-strict-nan-defence-contract).

### 2.3 Currency — strict equality

- Empty / `undefined` / `null` currency filter passes every invoice.
- Otherwise the invoice `currency` must equal the filter value **exactly**,
  case-sensitive (i.e. `"USD"` is not equal to `"usd"`).
- Missing / `null` / empty invoice `currency` always fails when the filter
  is set.

### 2.4 Maturity — ISO lexicographic, inclusive

Comparison is done on ISO date strings (`YYYY-MM-DD`) which sort
lexicographically in chronological order. This matches
`app/invest/page.js`'s implementation exactly.

| Filter                      | Invoice dueDate | Result              |
| --------------------------- | --------------- | ------------------- |
| `maturityFrom = 2026-09-01` | `2026-09-01`    | ✅ pass (inclusive) |
| `maturityFrom = 2026-09-01` | `2026-08-31`    | ❌ fail             |
| `maturityTo  = 2026-09-01`  | `2026-09-01`    | ✅ pass (inclusive) |
| `maturityTo  = 2026-09-01`  | `2026-09-02`    | ❌ fail             |

### 2.5 Strict NaN-defence contract

Every predicate parses its input up front and returns `false` on any
unparseable / `NaN` value. This is **stricter** than the current
production behaviour:

- `lib/hooks/useInvoiceFilters.js` short-circuits the entire yield block
  when both bounds are empty (`if (filters.yieldMin || filters.yieldMax)`),
  so a malformed invoice yield would slip through.
- The hook also coerces **empty** yield strings to the number `0` (its
  inline `parseYield` returns `0` when input is falsy) rather than `NaN`,
  so an invoice with `yield === ""` is treated as `0%` — not as missing.
  The predicate treats the same input as unparseable and excludes it.
- The hook also uses `new Date(invoice.dueDate)` for maturity comparison;
  an invalid ISO string yields `Invalid Date`, and comparisons between
  `Invalid Date` and a real date silently coerce to `false`, so a
  malformed date would pass.

The predicates' strict contract is the **forward-looking intent**; closing
the divergence is the subject of a follow-up hook refactor (see
_Future Work_ below). Until then:

- Test the predicates against the strict contract.
- Test the production filter pipeline (`useInvoiceFilters.test.tsx`,
  `app/invest/page.test.jsx`) against the looser contract.
- Document any production invoice that surfaces a `NaN` value as a data
  issue upstream of the marketplace.

### 2.6 Combined intersection

`matchesFilters(invoice, filters)` short-circuits with logical `AND`:

1. `matchesCurrency(...)` must pass.
2. `matchesYieldRange(...)` must pass.
3. `matchesMaturityRange(...)` must pass.

Empty / `DEFAULT_FILTERS` passes every invoice (subject to the strict
NaN-defence contract above).

## Accessibility Features

- Direction toggle buttons carry `aria-sort` (`ascending` | `descending` | `none`)
- Inactive toggles are `disabled` and carry `aria-sort="none"`
- All controls have `aria-label` attributes
- Keyboard navigation preserved throughout
- High contrast design follows existing slate/cyan theme

## Responsive Design

- Filter controls and chip row wrap on smaller screens using `flex-wrap`.
- Direction toggles sit inline next to the sort select.
- Maintains spacing and layout across breakpoints.

## Implementation Notes

- `DEFAULT_FILTERS.sortDir` defaults to `'desc'`
- `SORTABLE_COLUMNS` constant exported from `InvoiceFilters.jsx` lists columns with direction support: `['amount', 'yield']`
- Uses Tailwind CSS classes consistent with existing design system
- Follows slate-950/cyan-400 color scheme

## Backend Integration Requirements

When implementing the backend:

1. Accept `sort` (column name) and `sort_dir` (`asc`|`desc`) query parameters
2. Create API endpoints that support the filter query parameters above
3. Implement filtering logic on the invoice data
4. Add pagination support for large datasets
5. Consider caching for frequently accessed filter combinations
6. Validate filter parameters and return appropriate error responses

## Testing Checklist

- [x] `DEFAULT_FILTERS` includes `sortDir: 'desc'`
- [x] `parseSortState` correctly extracts column and direction (including legacy compound values)
- [x] `applySortToList` sorts amount and yield in both directions
- [x] `applySortToList` does not mutate the source array
- [x] Direction toggle button is **enabled** only for the active sort column
- [x] `aria-sort` reflects current direction on the active column toggle
- [x] Inactive column toggle has `aria-sort="none"`
- [x] Clicking the active toggle flips direction (`desc → asc`, `asc → desc`)
- [x] Clicking a disabled (inactive) toggle does not call `onFilterChange`
- [x] Changing the sort column preserves existing `sortDir`
- [x] Clearing filters resets `sortDir` to `'desc'`
- [x] Filter controls are visually consistent on mobile
- [x] Accessibility labels are present on all controls
- [x] Color contrast meets WCAG standards
- [x] No console errors on page load
- [x] `matchesYieldRange` is INCLUSIVE at both ends (yield Min and Max boundary samples)
- [x] `matchesCurrency` is strict-equality, case-sensitive, with empty-filter passthrough
- [x] `matchesMaturityRange` is INCLUSIVE at both ends using ISO lexicographic comparison
- [x] `matchesFilters(DEFAULT_FILTERS)` passes every parseable invoice (empty-filter intersection)
- [x] Combined filters intersect with logical AND across all three predicates
- [x] Predicates return `false` for unparseable invoice values (strict NaN-defence contract)

## Future Work

1. Refactor `lib/hooks/useInvoiceFilters.js` (and the inline filter block in
   `app/invest/page.js`) to consume the exported `matchesYieldRange`,
   `matchesCurrency`, `matchesMaturityRange`, and `matchesFilters` so that
   the strict NaN-defence contract becomes the production contract. Until
   that refactor lands, the predicates are the forward-looking golden copy
   while the hook/page pipeline carries the documented divergence (see
   § 2.5).
2. Consider extracting `parseYieldValue` into a shared helper (e.g.
   `lib/format/invoice.js`) so the predicate, the hook, and the page no
   longer carry duplicate parsers.
