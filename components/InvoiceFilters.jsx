"use client";

import { useCallback } from "react";

export const DEFAULT_FILTERS = {
  yieldMin: "",
  yieldMax: "",
  currency: "",
  maturityFrom: "",
  maturityTo: "",
  sort: "",
  sortDir: "desc",
};

/**
 * Sort-column values that support direction toggling.
 * These are the base column keys (without _asc/_desc suffix).
 */
export const SORTABLE_COLUMNS = ["amount", "yield"];

export const SORT_OPTIONS = [
  { value: "", label: "Sort By" },
  { value: "amount", label: "Amount" },
  { value: "yield", label: "Yield" },
  { value: "maturity", label: "Maturity" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF"];

/**
 * Given the current filters, return the active sort column and direction.
 * Supports both plain column values ('yield') and legacy compound values ('yield_desc').
 *
 * @param {object} filters
 * @returns {{ column: string, dir: 'asc'|'desc' }}
 */
export function parseSortState(filters) {
  const { sort, sortDir } = filters;
  const match = sort.match(/^(amount|yield|maturity)_(asc|desc)$/);
  if (match) {
    return { column: match[1], dir: match[2] };
  }
  return { column: sort, dir: sortDir || "desc" };
}

/**
 * Returns true when any structured filter field is set (excludes search query).
 *
 * @param {typeof DEFAULT_FILTERS} filters
 * @returns {boolean}
 */
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
 * Returns true when search or structured filters are active.
 *
 * @param {typeof DEFAULT_FILTERS} filters
 * @param {string} [searchQuery='']
 * @returns {boolean}
 */
export function hasAnyActiveFilters(filters, searchQuery = "") {
  return hasActiveFilters(filters) || Boolean(searchQuery.trim());
}

/**
 * Builds the visible results summary line.
 *
 * @param {number} shown - Invoices currently visible (after pagination).
 * @param {number} total - Total invoices matching the current filters.
 * @returns {string}
 */
export function getResultsSummaryText(shown, total) {
  return `Showing ${shown} of ${total} invoices`;
}

/**
 * @typedef {Object} ActiveFilterChip
 * @property {string} key - Stable React key.
 * @property {string} label - Visible chip label.
 * @property {string} clearKey - Key passed to onRemoveFilter ('search' or a filter field).
 */

/**
 * Returns removable chips for each active filter and the search query.
 *
 * @param {typeof DEFAULT_FILTERS} filters
 * @param {string} [searchQuery='']
 * @returns {ActiveFilterChip[]}
 */
export function getActiveFilterChips(filters, searchQuery = "") {
  /** @type {ActiveFilterChip[]} */
  const chips = [];

  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    chips.push({ key: "search", label: `Search: ${trimmedSearch}`, clearKey: "search" });
  }

  if (filters.yieldMin !== "") {
    chips.push({ key: "yieldMin", label: `Min yield: ${filters.yieldMin}%`, clearKey: "yieldMin" });
  }

  if (filters.yieldMax !== "") {
    chips.push({ key: "yieldMax", label: `Max yield: ${filters.yieldMax}%`, clearKey: "yieldMax" });
  }

  if (filters.currency !== "") {
    chips.push({ key: "currency", label: `Currency: ${filters.currency}`, clearKey: "currency" });
  }

  if (filters.maturityFrom !== "") {
    chips.push({
      key: "maturityFrom",
      label: `From: ${filters.maturityFrom}`,
      clearKey: "maturityFrom",
    });
  }

  if (filters.maturityTo !== "") {
    chips.push({ key: "maturityTo", label: `To: ${filters.maturityTo}`, clearKey: "maturityTo" });
  }

  if (filters.sort !== "") {
    const sortLabel = SORT_OPTIONS.find((opt) => opt.value === filters.sort)?.label ?? filters.sort;
    chips.push({ key: "sort", label: `Sort: ${sortLabel}`, clearKey: "sort" });
  }

  return chips;
}

/**
 * Returns a copy of filters with a single field cleared.
 *
 * @param {typeof DEFAULT_FILTERS} filters
 * @param {string} clearKey
 * @returns {typeof DEFAULT_FILTERS}
 */
export function clearFilterByKey(filters, clearKey) {
  if (clearKey === "search") {
    return filters;
  }

  if (clearKey === "sort") {
    return { ...filters, sort: "", sortDir: "desc" };
  }

  return { ...filters, [clearKey]: "" };
}

/**
 * Visible results count and removable active-filter chips for the marketplace.
 */
export function ActiveFilterSummary({
  shown,
  totalFiltered,
  filters,
  searchQuery,
  onRemoveFilter,
  onClearAll,
}) {
  const chips = getActiveFilterChips(filters, searchQuery);
  const hasChips = chips.length > 0;

  return (
    <div className="mb-4 space-y-3">
      <p className="text-sm text-slate-400">{getResultsSummaryText(shown, totalFiltered)}</p>

      {hasChips ? (
        <div className="flex flex-wrap items-center gap-2">
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-label="Active filters">
            {chips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  onClick={() => onRemoveFilter(chip.clearKey)}
                  className="inline-flex items-center gap-1 rounded-full border border-cyan-700/60 bg-cyan-900/20 px-3 py-1 text-xs text-cyan-300 transition-colors hover:bg-cyan-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  aria-label={`Remove ${chip.label}`}
                >
                  <span>{chip.label}</span>
                  <span aria-hidden="true">&times;</span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onClearAll}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-cyan-400 transition-colors hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Render a small ↑↓ toggle button for asc/desc. */
function DirectionToggle({ column, filters, onFilterChange }) {
  const { column: activeColumn, dir } = parseSortState(filters);
  const isActive = activeColumn === column;

  const handleToggle = useCallback(() => {
    if (!isActive) return;
    onFilterChange({
      ...filters,
      sort: column,
      sortDir: dir === "asc" ? "desc" : "asc",
    });
  }, [isActive, filters, column, dir, onFilterChange]);

  const nextDir = dir === "asc" ? "desc" : "asc";
  const ariaLabel = isActive
    ? `Sort ${column} ${nextDir === "asc" ? "ascending" : "descending"}`
    : `Sort ${column} direction`;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!isActive}
      aria-label={ariaLabel}
      aria-sort={isActive ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`rounded px-2 py-1 text-xs font-mono transition-colors select-none ${
        isActive
          ? "bg-cyan-900/40 text-cyan-300 hover:bg-cyan-800/60 border border-cyan-700"
          : "bg-slate-800/50 text-slate-500 border border-slate-700 cursor-default"
      }`}
    >
      {isActive && dir === "asc" ? "↑" : "↓"}
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
      onFilterChange({ ...filters, sort: column, sortDir: filters.sortDir || "desc" });
    },
    [filters, onFilterChange]
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
