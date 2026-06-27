import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import InvoiceSearch from "@/components/InvoiceSearch";
import { sanitize } from "@/utils/sanitizeUrl";

"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ErrorBanner from "@/components/ErrorBanner";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import InvoiceSearch from "@/components/InvoiceSearch";
import Pagination from "@/components/Pagination";
import { copy } from "../copy/en";
import { fetchInvestableInvoices } from "../../lib/api/invoices";
import InvoiceSearch from "@/components/InvoiceSearch";

export const PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Returns the screen-reader announcement text for the initial invoice load.
 *
 * @param {Array} invoices - The resolved invoice array (may be empty).
 * @param {object} [options]
 * @param {boolean} [options.filterActive] - Whether an issuer filter is active.
 * @param {number} [options.filteredCount] - Number of invoices matching the active filter.
 * @returns {string}
 */
export function getInvoiceLoadAnnouncement(
  invoices,
  { filterActive, filteredCount } = {},
) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return "No invoices available";
  }

  if (filterActive) {
    if (filteredCount === 0) {
      return "No invoices match";
    }
    return `${filteredCount} of ${invoices.length} invoices match`;
  }

  return `${invoices.length} investable invoices loaded`;
}

export function getPaginationAnnouncement(shown, total) {
  if (total === 0) return "No invoices available";
  return `Showing ${shown} of ${total} investable invoices`;
}

/**
 * Parse a numeric amount string like "12,500" → 12500.
 * @param {string} str
 * @returns {number}
 */
function parseAmount(str) {
  return parseFloat(String(str).replace(/,/g, "")) || 0;
}

/**
 * Parse a yield string like "8.2%" → 8.2.
 * @param {string} str
 * @returns {number}
 */
function parseYield(str) {
  return parseFloat(String(str).replace(/%/g, "")) || 0;
}

/**
 * Sort a copy of `list` according to the sort column + direction in `filters`.
 *
 * Supported columns: "amount", "yield", "maturity".
 * Direction: "asc" | "desc".
 *
 * @param {Array}  list
 * @param {object} filters
 * @returns {Array}
 */
export function applySortToList(list, filters) {
  if (!Array.isArray(list) || list.length === 0) return list;

  const { column, dir } = parseSortState(filters);
  if (!column) return list;

  const multiplier = dir === "asc" ? 1 : -1;

  return [...list].sort((a, b) => {
    let diff = 0;
    if (column === "amount") {
      diff = parseAmount(a.amount) - parseAmount(b.amount);
    } else if (column === "yield") {
      diff = parseYield(a.yield) - parseYield(b.yield);
    } else if (column === "maturity") {
      diff = new Date(a.dueDate) - new Date(b.dueDate);
    }
    return multiplier * diff;
  });
}

/**
 * InvestMarketplace – main component for the invest page.
 *
 * Fetches invoices via `loadInvoices`, renders them PAGE_SIZE at a time,
 * and exposes a "Load more" control to append the next batch.  Paging
 * resets whenever a new invoice set arrives so filter changes stay
 * non-breaking.
 *
 * @param {object}   props
 * @param {Function} [props.loadInvoices] - Async function that resolves to an
 *   invoice array.  Defaults to the mock loader; injectable for testing.
 * @returns {JSX.Element}
 */
export function InvestMarketplace({ loadInvoices = fetchInvestableInvoices }) {
  const searchParams = useSearchParams();
  const searchParamsValue = searchParams ?? new URLSearchParams();

  const [invoices, setInvoices] = useState(null); // null = loading
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  // Tracks the invoices reference paging was last reset for. Compared during
  // render (rather than in an effect) per the React-recommended pattern for
  // resetting state when a prop/value changes: https://react.dev/learn/you-might-not-need-an-effect
  const [pagingResetFor, setPagingResetFor] = useState(invoices);
  if (invoices !== pagingResetFor) {
    setPagingResetFor(invoices);
    setVisibleCount(PAGE_SIZE);
  }

  /** Ref forwarded to the "Load more" button for focus management. */
  const loadMoreRef = useRef(null);

  // Sync state changes back to the URL using replace (no history entry)
  const syncToUrl = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (sortOption) params.set("sort", sortOption);
    if (activeFilters.length) params.set("filters", activeFilters.join(","));
    const query = params.toString();
    router.replace(query ? `?${query}` : "/invest");
  };

  // Effect: update URL whenever relevant state changes
  useEffect(() => {
    let active = true;

    const announceLoadCompletion = async () => {
      try {
        const nextInvoices = await loadInvoices({ signal: controller.signal });

        if (!isActive) return;

        const normalizedInvoices = Array.isArray(nextInvoices) ? nextInvoices : [];

        setInvoices(normalizedInvoices);
        setStatusMessage(getInvoiceLoadAnnouncement(normalizedInvoices));
      } catch {
        if (!isActive) return;

        setInvoices(null);
        setLoadError(copy.invest.errorDescription);
        setStatusMessage(copy.invest.errorStatus);
      }
    };

    void announceLoadCompletion();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [loadInvoices]);

  // ── Load-more handler ─────────────────────────────────────────────────────
  /**
   * Appends the next PAGE_SIZE items and updates the live-region status.
   * Focus is moved back to the "Load more" button (if it still exists) so
   * keyboard users do not lose their place in the page.
   */
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => {
      const next = Math.min(prev + normalizedPagination.pageSize, filteredInvoices.length || prev);
      const total = filteredInvoices.length;
      setStatusMessage(getPaginationAnnouncement(next, total));
      return next;
    });

    // Restore focus on next tick so the button is still in the DOM when we focus it.
    setTimeout(() => {
      loadMoreRef.current?.focus();
    }, 0);
  }, [filteredInvoices, normalizedPagination.pageSize]);

  const visibleInvoices = filteredInvoices.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <Link href="/" className="inline-block py-3 text-xl font-semibold tracking-tight text-cyan-400 hover:underline">
          ← LiquiFact
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Invest</h1>
        <p className="text-slate-400 mb-8">
          Browse tokenized invoices and fund them. Estimated yield is shown for educational purposes; actual payment is received at invoice maturity.
        </p>
      </div>

        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <InvoiceSearch value={searchQuery} onChange={handleSearchChange} />
            <InvoiceFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
        </div>

        {invoices === null ? (
          <InvoiceListSkeleton rows={3} />
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-500">
            No investable invoices. Connect wallet to see the marketplace.
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {invoices.map((inv) => (
                <li key={inv.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Link
                      href={`/invest/${inv.id}`}
                      className="font-medium text-slate-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded"
                    >
                      {inv.issuer}
                    </Link>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-cyan-900/60 text-cyan-300">
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm text-slate-400">
                    <span>{inv.currency}&nbsp;{inv.amount}</span>
                    <span>Est. yield&nbsp;{inv.yield}</span>
                    <span>Maturity&nbsp;{inv.dueDate}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-400">
              Note: Yield references are educational only and reflect on-chain basis-point assumptions. Invoice contracts settle at maturity.
            </div>
          </>
        )}
      </main>
    </div>
  );
}
