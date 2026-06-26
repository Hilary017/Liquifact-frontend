// client directive
"use client";
import Button from '@/components/Button';
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ErrorBanner from "@/components/ErrorBanner";
import InvoiceCard from "@/components/InvoiceCard";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import Pagination from "@/components/Pagination";
import { copy } from "../copy/en";
import { fetchInvestableInvoices } from "../../lib/api/invoices";
import InvoiceSearch from '@/components/InvoiceSearch';
import InvoiceFilters, { DEFAULT_FILTERS } from '@/components/InvoiceFilters';
import useInvoiceFilters from '../../lib/hooks/useInvoiceFilters';

/**
 * Number of invoices rendered per page.  Export allows tests to reference
 * the same constant without hard-coding a magic number.
 */
export const PAGE_SIZE = 10;

/**
 * Search debounce delay in milliseconds.
 */
export const SEARCH_DEBOUNCE_MS = 200;

/**
 * Returns the screen-reader announcement text for the initial invoice load
 * or when the user performs a search/filter query.
 *
 * Signature / Parameters:
 * @param {Array} invoices - The full resolved invoice array from the API/mock source.
 * @param {object} [options] - Optional settings for filtered states.
 * @param {boolean} [options.filterActive=false] - True if there is an active search query or filter criteria applied.
 * @param {number} [options.filteredCount=0] - The number of invoices matching the active filters.
 * @returns {string} The polite status announcement string to be read by screen readers.
 */
export function getInvoiceLoadAnnouncement(
  invoices,
  { filterActive = false, filteredCount = 0 } = {},
) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return "No invoices available";
  }
  return `${invoices.length} investable invoices loaded`;
}

/**
 * Returns the screen-reader announcement text for the current pagination state.
 *
 * @param {number} shown - Number of invoices currently visible.
 * @param {number} total - Total number of invoices available.
 * @returns {string}
 */
export function getPaginationAnnouncement(shown, total) {
  if (total === 0) return "No invoices available";
  return `Showing ${shown} of ${total} investable invoices`;
}

/**
 * InvestMarketplace — main component for the invest page.
 *
 * Fetches invoices via `loadInvoices`, renders them PAGE_SIZE at a time,
 * and exposes a "Load more" control to append the next batch.  Paging
 * resets whenever a new invoice set arrives so filter changes (future) stay
 * non-breaking.
 *
 * @param {object}   props
 * @param {Function} [props.loadInvoices] - Async function that resolves to an
 *   invoice array.  Defaults to the mock loader; injectable for testing.
 * @returns {JSX.Element}
 */
export function InvestMarketplace({ loadInvoices = loadMockInvoices }) {
  const [invoices, setInvoices] = useState(null); // null = loading
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastAction, setLastAction] = useState("load"); // "load" | "filter" | "paginate"

  /** Ref forwarded to the "Load more" button for focus management. */
  const loadMoreRef = useRef(null);

  const allInvoices = invoices || [];
  const filteredInvoices = useInvoiceFilters(allInvoices, debouncedQuery, filters);

  // ——————————————————————————————————————————————————————————————————————————
  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const announceLoadCompletion = async () => {
      try {
        const nextInvoices = await loadInvoices({ signal: controller.signal });

        if (!isActive) return;

        const normalizedInvoices = Array.isArray(nextInvoices) ? nextInvoices : [];

        setInvoices(normalizedInvoices);
        setVisibleCount(PAGE_SIZE);
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

  // ——————————————————————————————————————————————————————————————————————————
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search input change handler
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
    setLastAction("filter");
  }, []);

  // Filter change handler
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setVisibleCount(PAGE_SIZE);
    setLastAction("filter");
  }, []);

  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setVisibleCount(PAGE_SIZE);
    setLastAction("filter");
  }, []);

  // Filter and sort computation
  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];

    let result = [...invoices];

    // 1. Search Query (Issuer name, case-insensitive)
    if (debouncedQuery.trim() !== "") {
      const q = debouncedQuery.toLowerCase();
      result = result.filter((inv) =>
        inv.issuer.toLowerCase().includes(q)
      );
    }

    // 2. Yield Minimum
    if (filters.yieldMin !== "") {
      const minVal = parseFloat(filters.yieldMin);
      result = result.filter((inv) => {
        const val = parseFloat(inv.yield);
        return !isNaN(val) && val >= minVal;
      });
    }

    // 3. Yield Maximum
    if (filters.yieldMax !== "") {
      const maxVal = parseFloat(filters.yieldMax);
      result = result.filter((inv) => {
        const val = parseFloat(inv.yield);
        return !isNaN(val) && val <= maxVal;
      });
    }

    // 4. Currency
    if (filters.currency !== "") {
      result = result.filter((inv) => inv.currency === filters.currency);
    }

    // 5. Maturity From
    if (filters.maturityFrom !== "") {
      result = result.filter((inv) => inv.dueDate >= filters.maturityFrom);
    }

    // 6. Maturity To
    if (filters.maturityTo !== "") {
      result = result.filter((inv) => inv.dueDate <= filters.maturityTo);
    }

    // 7. Sort options
    if (filters.sort === "yield_desc") {
      result.sort((a, b) => parseFloat(b.yield) - parseFloat(a.yield));
    } else if (filters.sort === "yield_asc") {
      result.sort((a, b) => parseFloat(a.yield) - parseFloat(b.yield));
    } else if (filters.sort === "amount_desc") {
      result.sort((a, b) => {
        const valA = parseFloat(a.amount.replace(/,/g, ""));
        const valB = parseFloat(b.amount.replace(/,/g, ""));
        return valB - valA;
      });
    } else if (filters.sort === "amount_asc") {
      result.sort((a, b) => {
        const valA = parseFloat(a.amount.replace(/,/g, ""));
        const valB = parseFloat(b.amount.replace(/,/g, ""));
        return valA - valB;
      });
    } else if (filters.sort === "maturity_asc") {
      result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } else if (filters.sort === "maturity_desc") {
      result.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    }

    return result;
  }, [invoices, debouncedQuery, filters]);

  // Paginated visible invoices
  const visibleInvoices = useMemo(() => {
    return filteredInvoices.slice(0, visibleCount);
  }, [filteredInvoices, visibleCount]);

  // Live status region announcements (derived during render)
  const statusMessage = useMemo(() => {
    if (loadError) {
      return copy.invest.errorStatus;
    }
    if (invoices === null) {
      return "";
    }
    if (lastAction === "paginate") {
      return getPaginationAnnouncement(visibleInvoices.length, filteredInvoices.length);
    }
    const filterActive = hasActiveFilters(filters) || debouncedQuery.trim() !== "";
    return getInvoiceLoadAnnouncement(invoices, {
      filterActive,
      filteredCount: filteredInvoices.length,
    });
  }, [invoices, debouncedQuery, filters, loadError, filteredInvoices.length, visibleInvoices.length, lastAction]);

  // —— Load-more handler ———————————————————————————————————————————————————
  /**
   * Appends the next PAGE_SIZE items and updates the live-region status.
   * Focus is moved back to the "Load more" button (if it still exists) so
   * keyboard users do not lose their place in the page.
   */
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => {
      const next = Math.min(prev + PAGE_SIZE, filteredInvoices.length);
      setStatusMessage(getPaginationAnnouncement(next, filteredInvoices.length));
      return next;
    });

    // Restore focus on next tick so the button is still in the DOM when we focus it.
    setTimeout(() => {
      loadMoreRef.current?.focus();
    }, 0);
  }, [filteredInvoices]);

  // ——————————————————————————————————————————————————————————————————————————
  const visibleInvoices = filteredInvoices.slice(0, visibleCount);

  useEffect(() => {
    if (invoices === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusMessage(getPaginationAnnouncement(visibleInvoices.length, filteredInvoices.length));
  }, [filteredInvoices, visibleInvoices.length, invoices]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <Link
          href="/"
          className="inline-block py-3 text-xl font-semibold tracking-tight text-cyan-400 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded"
        >
          {copy.layout.backToHome}
        </Link>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">{copy.invest.title}</h1>
        <p className="text-slate-400 mb-8">{copy.invest.subtext}</p>

        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {statusMessage}
        </p>

        {/* Filter Controls */}
        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <InvoiceSearch
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <InvoiceFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>

        {loadError ? (
          <ErrorBanner
            variant="error"
            title={copy.invest.errorTitle}
            description={loadError}
            previewLabel="Marketplace status"
          />
        ) : invoices === null ? (
          <InvoiceListSkeleton rows={3} />
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-300">{copy.invest.emptyState}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-300">No invoices match your filters.</div>
        ) : (
          <>
            <ul className="space-y-4">
              {visibleInvoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/invest/${inv.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-cyan-500/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                    aria-label={`View details for ${inv.issuer} invoice ${inv.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-100">
                        {inv.issuer}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-cyan-900/60 text-cyan-300">
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-300">
                      <span>
                        {inv.currency}&nbsp;{inv.amount}
                      </span>
                      <span>Est. yield&nbsp;{inv.yield}</span>
                      <span>Maturity&nbsp;{inv.dueDate}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <Pagination
              ref={loadMoreRef}
              shown={visibleInvoices.length}
              total={filteredInvoices.length}
              onLoadMore={handleLoadMore}
            />

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-300">
              Note: Yield references are educational only and reflect on-chain basis-point assumptions. Invoice contracts settle at maturity.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function InvestPage() {
  return <InvestMarketplace />;
}

