"use client";

/**
 * InvoiceSearch — A controlled search input for filtering invoices by issuer name.
 *
 * Renders a labelled search field styled to match the existing slate/cyan
 * marketplace theme. A clear button appears when the input has a value.
 *
 * @param {Object} props
 * @param {string} props.value  - Current search query (controlled by parent).
 * @param {(value: string) => void} props.onChange - Called with the new value on every keystroke.
 * @param {string} [props.placeholder] - Placeholder text for the input.
 */
export default function InvoiceSearch({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="issuer-search" className="sr-only">
        Search by issuer name
      </label>
      <input
        id="issuer-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search issuer\u2026"}
        className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-cyan-400 hover:bg-slate-700/50 transition-colors"
          aria-label="Clear search"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
