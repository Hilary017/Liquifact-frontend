// client directive
"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import ErrorBanner from "@/components/ErrorBanner";
import InvoiceCard from "@/components/InvoiceCard";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import Pagination from "@/components/Pagination";
import InvoiceSearch from "@/components/InvoiceSearch";
import InvoiceFilters, { DEFAULT_FILTERS, hasActiveFilters } from "@/components/InvoiceFilters";
import { copy } from "../copy/en";
import { fetchInvestableInvoices } from "../../lib/api/invoices";
import InvoiceSearch from '@/components/InvoiceSearch';
import InvoiceFilters, { DEFAULT_FILTERS } from '@/components/InvoiceFilters';
import useInvoiceFilters from '../../lib/hooks/useInvoiceFilters';

export const PAGE_SIZE = 10;

const DEV_DELAY = process.env.NODE_ENV === "development" ? 1500 : 0;

export function getInvoiceLoadAnnouncement(
  invoices,
  { filterActive = false, filteredCount = 0 } = {},
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

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;

    if (debouncedQuery) {
      if (params.get("search") !== debouncedQuery) {
        params.set("search", debouncedQuery);
        changed = true;
      }
    } else if (params.has("search")) {
      params.delete("search");
      changed = true;
    }

    for (const key of Object.keys(DEFAULT_FILTERS)) {
      if (filters[key]) {
        if (params.get(key) !== filters[key]) {
          params.set(key, filters[key]);
          changed = true;
        }
      } else if (params.has(key)) {
        params.delete(key);
        changed = true;
      }
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [debouncedQuery, filters, pathname, router, searchParams]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const allInvoices = invoices || [];
  
  let filteredInvoices = allInvoices.filter((inv) => {
    if (debouncedQuery && !inv.issuer.toLowerCase().includes(debouncedQuery.toLowerCase())) {
      return false;
    }
    if (filters.yieldMin && parseFloat(inv.yield) < parseFloat(filters.yieldMin)) {
      return false;
    }
    if (filters.yieldMax && parseFloat(inv.yield) > parseFloat(filters.yieldMax)) {
      return false;
    }
    if (filters.currency && inv.currency !== filters.currency) {
      return false;
    }
    if (filters.maturityFrom && new Date(inv.dueDate) < new Date(filters.maturityFrom)) {
      return false;
    }
    if (filters.maturityTo && new Date(inv.dueDate) > new Date(filters.maturityTo)) {
      return false;
    }
    return true;
  });

  if (filters.sort) {
    filteredInvoices = [...filteredInvoices].sort((a, b) => {
      const yieldA = parseFloat(a.yield) || 0;
      const yieldB = parseFloat(b.yield) || 0;
      const amountA = parseFloat(a.amount.replace(/,/g, '')) || 0;
      const amountB = parseFloat(b.amount.replace(/,/g, '')) || 0;

      switch (filters.sort) {
        case 'yield_desc': return yieldB - yieldA;
        case 'yield_asc': return yieldA - yieldB;
        case 'amount_desc': return amountB - amountA;
        case 'amount_asc': return amountA - amountB;
        case 'maturity_asc': return a.dueDate.localeCompare(b.dueDate);
        case 'maturity_desc': return b.dueDate.localeCompare(a.dueDate);
        default: return 0;
      }
    });
  }

  const visibleInvoices = filteredInvoices.slice(0, visibleCount);

  useEffect(() => {
    if (invoices !== null) {
      const isFiltered = debouncedQuery !== "" || hasActiveFilters(filters);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatusMessage(getInvoiceLoadAnnouncement(allInvoices, { filterActive: isFiltered, filteredCount: filteredInvoices.length }));
    }
  }, [invoices, debouncedQuery, filters, allInvoices, filteredInvoices.length]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => {
      const next = Math.min(prev + PAGE_SIZE, filteredInvoices.length);
      return next;
    });

    // Restore focus on next tick so the button is still in the DOM when we focus it.
    setTimeout(() => {
      loadMoreRef.current?.focus();
    }, 0);
  };

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
            <InvoiceSearch
              value={searchQuery}
              onChange={setSearchQuery}
            />
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
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvestMarketplace />
    </Suspense>
  );
}
