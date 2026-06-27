/**
 * @file components/InvoiceCard.jsx
 * Renders a single invoice row for the Invest marketplace.
 * This is the canonical card markup; InvoiceListSkeleton mirrors its layout.
 */

import Link from "next/link";

/** @typedef {import("@/lib/types/invoice").Invoice} Invoice */

const STATUS_STYLES = {
  available: "bg-cyan-900/40 text-cyan-300 border border-cyan-700/50",
  funded: "bg-slate-700/40 text-slate-400 border border-slate-600/50",
  pending: "bg-amber-900/40 text-amber-300 border border-amber-700/50",
};

const STATUS_LABELS = {
  available: "Available",
  funded: "Funded",
  pending: "Pending",
};

/**
 * Formats a date string into a human-readable short date.
 * Falls back gracefully when the value is missing or unparseable.
 * @param {string|undefined} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Formats an amount with its currency code.
 * @param {number|undefined} amount
 * @param {string|undefined} currency
 * @returns {string}
 */
function formatAmount(amount, currency) {
  if (amount == null) return "—";
  const formatted = Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

/**
 * @param {object}  props
 * @param {Invoice} props.invoice
 */
export default function InvoiceCard({ invoice }) {
  const { id, issuer, amount, currency, dueDate, yield: yieldPct, status } = invoice ?? {};

  const statusKey = STATUS_STYLES[status] ? status : "pending";
  const statusStyle = STATUS_STYLES[statusKey];
  const statusLabel = STATUS_LABELS[statusKey] ?? status ?? "Unknown";

  return (
    <Link
      href={`/invest/${id}`}
      className="group block rounded-lg border border-slate-800 bg-slate-900/60 px-5 py-4 transition-colors hover:border-cyan-700/60 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      aria-label={`Invoice ${id ?? ""} from ${issuer ?? "unknown issuer"} — ${statusLabel}`}
    >
      {/* Row layout: mirrors InvoiceListSkeleton column widths */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">

        {/* Issuer — w-1/4 min */}
        <div className="min-w-0 flex-1 basis-1/4">
          <p className="truncate font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
            {issuer ?? <span className="text-slate-500 italic">Unknown issuer</span>}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{id ?? "—"}</p>
        </div>

        {/* Amount — w-1/5 */}
        <div className="basis-1/5 text-right">
          <p className="font-mono text-slate-200">{formatAmount(amount, currency)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Amount</p>
        </div>

        {/* Yield — w-1/6 */}
        <div className="basis-1/6 text-right">
          <p className="font-mono text-cyan-400">
            {yieldPct != null ? `${yieldPct}%` : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Yield</p>
        </div>

        {/* Maturity — w-1/5 */}
        <div className="basis-1/5 text-right">
          <p className="text-slate-300">{formatDate(dueDate)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Maturity</p>
        </div>

        {/* Status badge — w-auto */}
        <div className="basis-auto">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
            role="status"
            aria-label={`Status: ${statusLabel}`}
          >
            {statusLabel}
          </span>
        </div>

      </div>
    </Link>
  );
}