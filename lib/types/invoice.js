/**
 * @file lib/types/invoice.js
 * Single source of truth for the invoice data shape used across the marketplace,
 * invoice list, skeleton, and API client.
 *
 * This file owns three coupled contracts:
 *   1. The `Invoice` shape itself (typedef).
 *   2. The typed `InvoiceStatus` union and the `INVOICE_STATUSES` enum — the
 *      canonical, exhaustive vocabulary of status values the product supports.
 *   3. The `STATUS_PILL_MAP` mapping every known status to its human-readable
 *      label and Tailwind tone classes.  The map lives here, in one place, so
 *      any new status must be added to all three tables or the build will
 *      diverge.
 *
 * The actual rendering lives in `components/StatusPill.jsx`; this file is the
 * authoritative data contract it reads from.
 */

/**
 * @typedef {Object} Invoice
 * @property {string}        id        - Unique invoice identifier (e.g. "INV-001")
 * @property {string}        issuer    - Name of the invoice issuer / SME
 * @property {number|string} amount    - Invoice face value (numeric for sorting,
 *                                        formatted string for display)
 * @property {string}        currency  - ISO 4217 currency code (e.g. "USDC", "USD")
 * @property {string}        dueDate   - ISO 8601 date string (e.g. "2025-09-30")
 * @property {number|string} yield     - Expected annual yield as a percentage
 *                                        (e.g. 8.5 or "8.5%")
 * @property {InvoiceStatus} status    - One of the typed InvoiceStatus values
 */

/**
 * The exhaustive set of status values an invoice can carry.
 *
 * Consumers SHOULD treat any value outside this union as `Unknown` and render
 * the neutral pill; see `STATUS_PILL_MAP["Unknown"]`.
 *
 * @typedef {"Open" | "Funded" | "Settled" | "Overdue"} InvoiceStatus
 */

/**
 * Valid invoice status values.
 *
 * TitleCase by design: matches `app/invest/lib.js` mock data, the issue #260
 * spec, and the InvoiceStatus union so a value can be used both as a runtime
 * comparison and a typed shape without a translation layer.
 *
 * @readonly
 * @enum {InvoiceStatus}
 */
export const INVOICE_STATUS = /** @type {const} */ ({
  AVAILABLE: "available",
  FUNDED: "funded",
  PENDING: "pending",
});

/**
 * Canonical, exhaustive set of invoice status values used across the marketplace.
 *
 * TitleCase values match the `InvoiceStatus` union and the mock data in
 * `app/invest/lib.js`.  Any new status must be added here and to
 * `STATUS_PILL_MAP` simultaneously.
 *
 * @readonly
 * @enum {string}
 */
export const INVOICE_STATUSES = Object.freeze(
  /** @type {const} */ ({
    OPEN: "Open",
    FUNDED: "Funded",
    SETTLED: "Settled",
    OVERDUE: "Overdue",
  })
);

/**
 * Mapping from every known status key (plus the `"Unknown"` fallback) to its
 * human-readable label and Tailwind tone classes.
 *
 * `StatusPill` is the sole render-time consumer of this map.
 *
 * @readonly
 */
export const STATUS_PILL_MAP = Object.freeze(
  /** @type {const} */ ({
    Open: {
      label: "Open",
      tone: "bg-cyan-900/40 text-cyan-300 ring-1 ring-cyan-500/30",
    },
    Funded: {
      label: "Funded",
      tone: "bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-500/30",
    },
    Settled: {
      label: "Settled",
      tone: "bg-slate-800/60 text-slate-300 ring-1 ring-slate-500/30",
    },
    Overdue: {
      label: "Overdue",
      tone: "bg-red-900/40 text-red-300 ring-1 ring-red-500/30",
    },
    Unknown: {
      label: "Unknown",
      tone: "bg-slate-700/40 text-slate-400 ring-1 ring-slate-600/30",
    },
  })
);

/**
 * Resolve any raw status input to its pill metadata.
 *
 * Unknown / nullish / non-string values always produce the neutral
 * `Unknown` entry — this function never throws.
 *
 * @param {unknown} status
 * @returns {{ key: string, label: string, tone: string }}
 */
export function resolveStatusPill(status) {
  if (typeof status === "string" && Object.prototype.hasOwnProperty.call(STATUS_PILL_MAP, status)) {
    const entry = STATUS_PILL_MAP[/** @type {keyof typeof STATUS_PILL_MAP} */ (status)];
    return { key: status, label: entry.label, tone: entry.tone };
  }
  return { key: "Unknown", label: STATUS_PILL_MAP.Unknown.label, tone: STATUS_PILL_MAP.Unknown.tone };
}
