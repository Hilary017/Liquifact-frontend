"use client";

import { useCallback } from "react";

export const DEFAULT_FILTERS = {
  yieldMin: '',
  yieldMax: '',
  currency: '',
  maturityFrom: '',
  maturityTo: '',
  sort: '',
  sortDir: 'desc',
};

export function hasActiveFilters(filters) {
  return (
    filters.yieldMin !== "" ||
    filters.yieldMax !== "" ||
    filters.currency !== "" ||
    filters.maturityFrom !== "" ||
    filters.maturityTo !== "" ||
    filters.sort !== ""
  );
}

/**
 * Sort-column values that support direction toggling.
 * These are the base column keys (without a _asc/_desc suffix).
 */
export const SORTABLE_COLUMNS = ['amount', 'yield'];

/**
 * Given the current filters, return the active sort column and direction.
 *
 * @param {object} filters
 * @returns {{ column: string, dir: 'asc'|'desc' }}
 */
export function parseSortState(filters) {
  const { sort, sortDir } = filters;
  // Extract base column from legacy compound values like 'yield_desc'
  const match = sort.match(/^(amount|yield|maturity)_(asc|desc)$/);
  if (match) {
    return { column: match[1], dir: match[2] };
  }
  return { column: sort, dir: sortDir || 'desc' };
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF'];

const SORT_OPTIONS = [
  { value: '', label: 'Sort By' },
  { value: 'amount', label: 'Amount' },
  { value: 'yield', label: 'Yield' },
  { value: 'maturity', label: 'Maturity' },
];

/** Render a small ↑↓ toggle button for asc/desc. */
function DirectionToggle({ column, filters, onFilterChange }) {
  const { column: activeColumn, dir } = parseSortState(filters);
  const isActive = activeColumn === column;

  const handleToggle = useCallback(() => {
    if (!isActive) return; // only relevant when this column is selected
    onFilterChange({
      ...filters,
      sort: column,
      sortDir: dir === 'asc' ? 'desc' : 'asc',
    });
  }, [isActive, filters, column, dir, onFilterChange]);

  const nextDir = dir === 'asc' ? 'desc' : 'asc';
  const ariaLabel = isActive
    ? `Sort ${column} ${nextDir === 'asc' ? 'ascending' : 'descending'}`
    : `Sort ${column} direction`;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!isActive}
      aria-label={ariaLabel}
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`rounded px-2 py-1 text-xs font-mono transition-colors select-none ${
        isActive
          ? 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-800/60 border border-cyan-700'
          : 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-default'
      }`}
    >
      {isActive && dir === 'asc' ? '↑' : '↓'}
    </button>
  );
}

export default function InvoiceFilters({ filters, onFilterChange, onClearFilters }) {
  const handleChange = useCallback(
    (key, value) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange]
  );

  const handleSortColumnChange = useCallback(
    (column) => {
      onFilterChange({ ...filters, sort: column, sortDir: filters.sortDir || 'desc' });
    },
    [filters, onFilterChange],
  );

  const active = hasActiveFilters(filters);
  const { column: activeColumn } = parseSortState(filters);

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <fieldset className="flex items-center gap-2 border-none p-0 m-0">
        <legend className="sr-only">Yield Range</legend>
        <input
          type="number"
          value={filters.yieldMin}
          onChange={(e) => handleChange("yieldMin", e.target.value)}
          placeholder="Min yield"
          className="w-28 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          aria-label="Minimum yield percentage"
          min="0"
          step="0.1"
        />
        <span className="text-slate-500">-</span>
        <input
          type="number"
          value={filters.yieldMax}
          onChange={(e) => handleChange("yieldMax", e.target.value)}
          placeholder="Max yield"
          className="w-28 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          aria-label="Maximum yield percentage"
          min="0"
          step="0.1"
        />
      </fieldset>

      <fieldset className="flex items-center gap-1 border-none p-0 m-0">
        <legend className="sr-only">Currency</legend>
        {CURRENCIES.map((cur) => (
          <button
            key={cur}
            type="button"
            onClick={() => handleChange("currency", filters.currency === cur ? "" : cur)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              filters.currency === cur
                ? "border-cyan-500 bg-cyan-900/30 text-cyan-300"
                : "border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            }`}
            aria-label={`Filter by ${cur}`}
            aria-pressed={filters.currency === cur}
          >
            {cur}
          </button>
        ))}
      </fieldset>

      <fieldset className="flex items-center gap-2 border-none p-0 m-0">
        <legend className="sr-only">Maturity Date Range</legend>
        <input
          type="date"
          value={filters.maturityFrom}
          onChange={(e) => handleChange("maturityFrom", e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
          aria-label="Maturity date from"
        />
        <span className="text-slate-500">-</span>
        <input
          type="date"
          value={filters.maturityTo}
          onChange={(e) => handleChange("maturityTo", e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
          aria-label="Maturity date to"
        />
      </fieldset>

      {/* Sort column selector + per-column direction toggles */}
      <fieldset className="flex items-center gap-2 border-none p-0 m-0">
        <legend className="sr-only">Sort Options</legend>
        <select
          value={activeColumn}
          onChange={(e) => handleSortColumnChange(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
          aria-label="Sort options"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {SORTABLE_COLUMNS.map((col) => (
          <DirectionToggle
            key={col}
            column={col}
            filters={{ ...filters, sort: activeColumn }}
            onFilterChange={onFilterChange}
          />
        ))}
      </fieldset>

      <button
        type="button"
        onClick={onClearFilters}
        disabled={!active}
        className={`ml-auto rounded-lg border px-4 py-2 text-sm transition-colors ${
          active
            ? "border-slate-600 bg-slate-800/50 text-cyan-400 hover:bg-slate-700"
            : "border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed"
        }`}
        aria-label="Clear all filters"
      >
        Clear Filters
      </button>
    </div>
  );
}
