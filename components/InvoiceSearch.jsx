import React from "react";

export default function InvoiceSearch({
  searchTerm,
  onSearchChange,
  sortOption,
  onSortChange,
  filters,
  onFiltersChange,
}) {
  return (
    <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      {/* Future Sort & Filter controls (currently disabled) */}
      <div className="flex flex-wrap gap-4 items-center opacity-60">
        <button type="button" disabled className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-500">
          Sort: {sortOption || "Best Yield"}
        </button>
        <button type="button" disabled className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-500">
          Filters: {filters.length > 0 ? filters.join(", ") : "None"}
        </button>
      </div>
    </div>
  );
}
