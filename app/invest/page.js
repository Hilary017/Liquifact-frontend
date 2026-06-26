// client directive
"use client";
import Button from "@/components/Button";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import ErrorBanner from "@/components/ErrorBanner";
import InvoiceCard from "@/components/InvoiceCard";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import Pagination from "@/components/Pagination";
import InvoiceSearch from "@/components/InvoiceSearch";
import InvoiceFilters, { DEFAULT_FILTERS, hasActiveFilters } from "@/components/InvoiceFilters";
import { copy } from "../copy/en";
import { fetchInvestableInvoices } from "../../lib/api/invoices";
import InvoiceSearch from "@/components/InvoiceSearch";
import InvoiceFilters, { DEFAULT_FILTERS, hasActiveFilters } from "@/components/InvoiceFilters";

export const PAGE_SIZE = 10;

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

export function InvestMarketplace({ loadInvoices = fetchInvestableInvoices }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [invoices, setInvoices] = useState(null); // null = loading
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusMessage, setStatusMessage] = useState("");
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

  const loadMoreRef = useRef(null);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Derived values & handlers ─────────────────────────────────────────────
  const allInvoices = Array.isArray(invoices) ? invoices : [];

  const filteredInvoices = useMemo(() => {
    let result = [...allInvoices];
    const q = debouncedQuery.trim().toLowerCase();

    if (q) {
      result = result.filter((inv) => inv.issuer.toLowerCase().includes(q));
    }

    if (filters.yieldMin !== "") {
      const min = parseFloat(filters.yieldMin);
      if (!isNaN(min)) {
        result = result.filter((inv) => {
          const y = parseFloat(inv.yield);
          return !isNaN(y) && y >= min;
        });
      }
    }

    if (filters.yieldMax !== "") {
      const max = parseFloat(filters.yieldMax);
      if (!isNaN(max)) {
        result = result.filter((inv) => {
          const y = parseFloat(inv.yield);
          return !isNaN(y) && y <= max;
        });
      }
    }

    if (filters.currency) {
      result = result.filter((inv) => inv.currency === filters.currency);
    }

    if (filters.maturityFrom) {
      const from = new Date(filters.maturityFrom);
      result = result.filter((inv) => new Date(inv.dueDate) >= from);
    }

    if (filters.maturityTo) {
      const to = new Date(filters.maturityTo);
      result = result.filter((inv) => new Date(inv.dueDate) <= to);
    }

    if (filters.sort) {
      result = [...result].sort((a, b) => {
        switch (filters.sort) {
          case "yield_desc":
            return parseFloat(b.yield) - parseFloat(a.yield);
          case "yield_asc":
            return parseFloat(a.yield) - parseFloat(b.yield);
          case "amount_desc":
            return (
              parseFloat(b.amount.replace(/,/g, "")) -
              parseFloat(a.amount.replace(/,/g, ""))
            );
          case "amount_asc":
            return (
              parseFloat(a.amount.replace(/,/g, "")) -
              parseFloat(b.amount.replace(/,/g, ""))
            );
          case "maturity_asc":
            return new Date(a.dueDate) - new Date(b.dueDate);
          case "maturity_desc":
            return new Date(b.dueDate) - new Date(a.dueDate);
          default:
            return 0;
        }
      });
    }

    return result;
  }, [allInvoices, debouncedQuery, filters]);

  const filterActive =
    hasActiveFilters(filters) || Boolean(debouncedQuery.trim());

  const baseStatusMessage =
    loadError || invoices === null
      ? loadError
        ? copy.invest.errorStatus
        : ""
      : getInvoiceLoadAnnouncement(allInvoices, {
          filterActive,
          filteredCount: filteredInvoices.length,
        });
  const statusMessage = paginationAnnouncement || baseStatusMessage;

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
    setPaginationAnnouncement("");
  }, []);

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
  }, [filteredInvoices.length]);

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
            <InvoiceSearch value={searchQuery} onChange={handleSearchChange} />
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
