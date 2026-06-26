# Filter Contracts

This document outlines the expected data shapes and processing complexities for the `useInvoiceFilters` hook, which powers the Liquifact Marketplace searching, filtering, and sorting purely on the client side.

## Current State
Filter controls are fully interactive. Sort order for the **Amount** and **Yield** columns supports an ascending/descending direction toggle.

## 1. Invoice Object Schema
The marketplace currently maps to the following object structure. The hook expects this exact shape when performing derived state calculations.

### 1. Yield Range Filter

- **Purpose**: Filter invoices by yield percentage range
- **Future API Contract**: `GET /api/invoices?yield_min=5&yield_max=10`
- **UI State**: Active

### 2. Currency Filter

- **Purpose**: Filter invoices by currency type (USD, EUR, etc.)
- **Future API Contract**: `GET /api/invoices?currency=USD,EUR`
- **UI State**: Active

### 3. Maturity Date Filter

- **Purpose**: Filter invoices by maturity date range
- **Future API Contract**: `GET /api/invoices?maturity_from=2026-06-01&maturity_to=2026-12-31`
- **UI State**: Active

### 4. Sort Options (with direction toggle)
- **Purpose**: Sort invoices by column with ascending/descending toggle for Amount and Yield
- **Sort state shape**:
  ```ts
  {
    sort:    '' | 'amount' | 'yield' | 'maturity';  // active sort column
    sortDir: 'asc' | 'desc';                         // direction, default 'desc'
  }
  ```
- **Future API Contract**: `GET /api/invoices?sort=amount&sort_dir=asc`
- **UI State**: Active

#### Direction toggle behaviour
| State | UI element | aria-sort value |
|---|---|---|
| Column is active, dir = `desc` | ↓ button, enabled | `descending` |
| Column is active, dir = `asc` | ↑ button, enabled | `ascending` |
| Column is **not** active | ↓ button, **disabled** | `none` |

Only `amount` and `yield` columns have direction toggles (the two investor-facing numeric metrics). Maturity is sorted through the main select only.

#### `parseSortState(filters)` helper
Returns `{ column: string, dir: 'asc'|'desc' }`.  
Supports both new plain-column sort values (`'amount'`, `'yield'`) and legacy compound values (`'amount_desc'`, `'yield_asc'`).

#### `applySortToList(list, filters)` helper (page.js)
Pure function that returns a sorted copy of invoice list. Does **not** mutate the original array.

### 5. Clear Filters
- **Purpose**: Reset all applied filters, including `sortDir` back to `'desc'`
- **Future API Contract**: Reset to base `GET /api/invoices`
- **UI State**: Active (disabled when no filters are active)

## Accessibility Features
- Direction toggle buttons carry `aria-sort` (`ascending` | `descending` | `none`)
- Inactive toggles are `disabled` and carry `aria-sort="none"`
- All controls have `aria-label` attributes
- Keyboard navigation preserved throughout
- High contrast design follows existing slate/cyan theme

## Responsive Design

- Filter controls wrap on smaller screens using `flex-wrap`
- Direction toggles sit inline next to the sort select

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
