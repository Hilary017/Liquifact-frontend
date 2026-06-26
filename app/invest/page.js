// client directive
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import ErrorBanner from "@/components/ErrorBanner";
import InvoiceCard from "@/components/InvoiceCard";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import Pagination from "@/components/Pagination";
import InvoiceFilters, { DEFAULT_FILTERS, parseSortState } from "@/components/InvoiceFilters";
import { copy } from "../copy/en";
import { fetchInvestableInvoices } from "../../lib/api/invoices";
import InvoiceSearch from "@/components/InvoiceSearch";
import InvoiceFilters, { DEFAULT_FILTERS, hasActiveFilters } from "@/components/InvoiceFilters";

export const PAGE_SIZE = 10;

/**
 * Mock invoice data – replace with real API call once the backend endpoint
 * is available (follow-up: link backend issue here).
 *
 * Contract per item: { id, issuer, amount, currency, dueDate, yield, status }
 * NOTE: yield values are illustrative; contracts use on-chain basis points and actual settlement is at maturity.
 */
const MOCK_INVOICES = [
  {
    id: "inv-001",
    issuer: "Acme Supplies Ltd",
    amount: "12,500",
    currency: "USD",
    dueDate: "2026-06-15",
    yield: "8.2%",
    status: "Open",
  },
  {
    id: "inv-002",
    issuer: "Bright Logistics GmbH",
    amount: "7,800",
    currency: "EUR",
    dueDate: "2026-07-01",
    yield: "7.5%",
    status: "Open",
  },
  {
    id: "inv-003",
    issuer: "Sunrise Exports Pte",
    amount: "22,000",
    currency: "USD",
    dueDate: "2026-05-30",
    yield: "9.1%",
    status: "Open",
  },
];

// DEV-only delay (ms) to make the skeleton visible during local development.
const DEV_DELAY = process.env.NODE_ENV === "development" ? 1500 : 0;

export function getInvoiceLoadAnnouncement(
  invoices,
  { filterActive = false, filteredCount = 0 } = {}
) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return "No invoices available";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [invoices, setInvoices] = useState(null); // null = loading
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusMessage, setStatusMessage] = useState("");
  const [paginationAnnouncement, setPaginationAnnouncement] = useState("");
  const [loadError, setLoadError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const initialSearch = searchParams.get("search") || "";
  const initialFilters = { ...DEFAULT_FILTERS };
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    if (searchParams.has(key)) {
      initialFilters[key] = searchParams.get(key) || "";
    }
  }

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const [filters, setFilters] = useState(initialFilters);

  /** Ref forwarded to the "Load more" button for focus management. */
  const loadMoreRef = useRef(null);

  // ──────────────────────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
  }, []);

  // ── Load-more handler ──────────────────────────────────────────────────────
  /**
   * Appends the next PAGE_SIZE items and updates the live-region status.
   * Focus is moved back to the "Load more" button (if it still exists) so
   * keyboard users do not lose their place in the page.
   */
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => {
      const next = Math.min(prev + PAGE_SIZE, filteredInvoices.length || prev);
      const total = filteredInvoices.length;
      setPaginationAnnouncement(getPaginationAnnouncement(next, total));
      return next;
    });

    // Restore focus on next tick so the button is still in the DOM when we focus it.
    setTimeout(() => {
      loadMoreRef.current?.focus();
    }, 0);
  }, [invoices]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const allInvoices = Array.isArray(invoices) ? invoices : [];

  const filteredInvoices = (() => {
    let list = allInvoices;

    // Text search
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
      list = list.filter(
        (inv) =>
          inv.issuer?.toLowerCase().includes(q) ||
          inv.id?.toLowerCase().includes(q),
      );
    }

    // Currency filter
    if (filters.currency) {
      list = list.filter((inv) => inv.currency === filters.currency);
    }

    // Yield range filter
    if (filters.yieldMin !== "") {
      const min = parseFloat(filters.yieldMin);
      list = list.filter((inv) => parseYield(inv.yield) >= min);
    }
    if (filters.yieldMax !== "") {
      const max = parseFloat(filters.yieldMax);
      list = list.filter((inv) => parseYield(inv.yield) <= max);
    }

    // Maturity date range filter
    if (filters.maturityFrom) {
      list = list.filter((inv) => inv.dueDate >= filters.maturityFrom);
    }
    if (filters.maturityTo) {
      list = list.filter((inv) => inv.dueDate <= filters.maturityTo);
    }

    // Sort with direction
    list = applySortToList(list, filters);

    return list;
  })();

  const visibleInvoices = filteredInvoices.slice(0, visibleCount);

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

        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <InvoiceFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={() => setFilters(DEFAULT_FILTERS)}
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
        ) : allInvoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-300">
            {copy.invest.emptyState}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-300">
            No invoices match your filters.
          </div>
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
                      <span className="font-medium text-slate-100">{inv.issuer}</span>
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
              Note: Yield references are educational only and reflect on-chain basis-point
              assumptions. Invoice contracts settle at maturity.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function InvestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvestMarketplace />
    </Suspense>
  );
}
