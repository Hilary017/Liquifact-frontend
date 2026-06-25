'use client';

import { useCallback } from 'react';

export const DEFAULT_FILTERS = {
  yieldMin: '',
  yieldMax: '',
  currency: '',
  maturityFrom: '',
  maturityTo: '',
  sort: '',
};

export function hasActiveFilters(filters) {
  return (
    filters.yieldMin !== '' ||
    filters.yieldMax !== '' ||
    filters.currency !== '' ||
    filters.maturityFrom !== '' ||
    filters.maturityTo !== '' ||
    filters.sort !== ''
  );
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF'];

const SORT_OPTIONS = [
  { value: '', label: 'Sort By' },
  { value: 'yield_desc', label: 'Best Yield' },
  { value: 'yield_asc', label: 'Lowest Yield' },
  { value: 'amount_desc', label: 'Highest Amount' },
  { value: 'amount_asc', label: 'Lowest Amount' },
  { value: 'maturity_asc', label: 'Earliest Maturity' },
  { value: 'maturity_desc', label: 'Latest Maturity' },
];

export default function InvoiceFilters({ filters, onFilterChange, onClearFilters }) {
  const handleChange = useCallback(
    (key, value) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange],
  );

  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <fieldset className="flex items-center gap-2 border-none p-0 m-0">
        <legend className="sr-only">Yield Range</legend>
        <input
          type="number"
          value={filters.yieldMin}
          onChange={(e) => handleChange('yieldMin', e.target.value)}
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
          onChange={(e) => handleChange('yieldMax', e.target.value)}
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
            onClick={() => handleChange('currency', filters.currency === cur ? '' : cur)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              filters.currency === cur
                ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300'
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
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
          onChange={(e) => handleChange('maturityFrom', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
          aria-label="Maturity date from"
        />
        <span className="text-slate-500">-</span>
        <input
          type="date"
          value={filters.maturityTo}
          onChange={(e) => handleChange('maturityTo', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 [color-scheme:dark]"
          aria-label="Maturity date to"
        />
      </fieldset>

      <select
        value={filters.sort}
        onChange={(e) => handleChange('sort', e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
        aria-label="Sort options"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onClearFilters}
        disabled={!active}
        className={`ml-auto rounded-lg border px-4 py-2 text-sm transition-colors ${
          active
            ? 'border-slate-600 bg-slate-800/50 text-cyan-400 hover:bg-slate-700'
            : 'border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed'
        }`}
        aria-label="Clear all filters"
      >
        Clear Filters
      </button>
    </div>
  );
}
