"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ErrorBanner from "@/components/ErrorBanner";
import InvoiceFilters, {
  DEFAULT_FILTERS,
  hasActiveFilters,
} from "@/components/InvoiceFilters";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import InvoiceSearch from "@/components/InvoiceSearch";
import Pagination from "@/components/Pagination";
import {
  INVALID_VALUE_FALLBACK,
  formatAmount,
  formatCurrency,
} from "@/lib/format/currency";
import { copy } from "../copy/en";
import { loadMockInvoices } from "./lib";

export const PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 200;

function parseAmount(value) {
  const numericValue = Number(String(value ?? "").replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function filterInvoices(invoices, query, filters) {
  const normalizedQuery = query.trim().toLowerCase();

  return invoices.filter((invoice) => {
    const issuer = String(invoice.issuer ?? "").toLowerCase();
    const invoiceYield = parseAmount(invoice.yield);
    const yieldMin = filters.yieldMin === "" ? null : Number(filters.yieldMin);
    const yieldMax = filters.yieldMax === "" ? null : Number(filters.yieldMax);

    if (normalizedQuery && !issuer.includes(normalizedQuery)) {
      return false;
    }

    if (filters.currency && invoice.currency !== filters.currency) {
      return false;
    }

    if (yieldMin !== null && invoiceYield < yieldMin) {
      return false;
    }

    if (yieldMax !== null && invoiceYield > yieldMax) {
      return false;
    }

    if (filters.maturityFrom && invoice.dueDate < filters.maturityFrom) {
      return false;
    }

    if (filters.maturityTo && invoice.dueDate > filters.maturityTo) {
      return false;
    }

    return true;
  });
}

function sortInvoices(invoices, sort) {
  const sortedInvoices = [...invoices];

  switch (sort) {
    case "yield_desc":
      return sortedInvoices.sort((a, b) => parseAmount(b.yield) - parseAmount(a.yield));
    case "yield_asc":
      return sortedInvoices.sort((a, b) => parseAmount(a.yield) - parseAmount(b.yield));
    case "amount_desc":
      return sortedInvoices.sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount));
    case "amount_asc":
      return sortedInvoices.sort((a, b) => parseAmount(a.amount) - parseAmount(b.amount));
    case "maturity_asc":
      return sortedInvoices.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    case "maturity_desc":
      return sortedInvoices.sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
    default:
      return sortedInvoices;
  }
}

function formatYield(value) {
  const formattedYield = formatAmount(value);
  return formattedYield === INVALID_VALUE_FALLBACK
    ? formattedYield
    : `${formattedYield}%`;
}

export function getInvoiceLoadAnnouncement(
  invoices,
  { filterActive = false, filteredCount = 0 } = {},
) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return "No invoices available";
  }

  if (filterActive) {
    return filteredCount === 0
      ? "No invoices match"
      : `${filteredCount} of ${invoices.length} invoices match`;
  }

  return `${invoices.length} investable invoices loaded`;
}

export function getPaginationAnnouncement(shown, total) {
  return `Showing ${shown} of ${total} investable invoices`;
}

export function InvestMarketplace({ loadInvoices = loadMockInvoices }) {
  const [invoices, setInvoices] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const load = async () => {
      try {
        const nextInvoices = await loadInvoices({ signal: controller.signal });

        if (!isActive) {
          return;
        }

        const normalizedInvoices = Array.isArray(nextInvoices) ? nextInvoices : [];
        setInvoices(normalizedInvoices);
        setVisibleCount(PAGE_SIZE);
        setLoadError("");
        setStatusMessage(getInvoiceLoadAnnouncement(normalizedInvoices));
      } catch {
        if (!isActive) {
          return;
        }

        setInvoices([]);
        setLoadError(copy.invest.errorDescription);
        setStatusMessage(copy.invest.errorStatus);
      }
    };

    void load();

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

  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) {
      return [];
    }

    return sortInvoices(filterInvoices(invoices, debouncedQuery, filters), filters.sort);
  }, [debouncedQuery, filters, invoices]);

  const filtersActive =
    hasActiveFilters(filters) || debouncedQuery.trim().length > 0;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => {
      const next = Math.min(prev + PAGE_SIZE, filteredInvoices.length);
      setStatusMessage(getPaginationAnnouncement(next, filteredInvoices.length));
      return next;
    });

    setTimeout(() => {
      loadMoreRef.current?.focus();
    }, 0);
  }, [filteredInvoices.length]);

  const visibleInvoices = filteredInvoices.slice(0, visibleCount);
  const allInvoices = Array.isArray(invoices) ? invoices : [];
  const displayStatusMessage =
    Array.isArray(invoices) && filtersActive
      ? getInvoiceLoadAnnouncement(invoices, {
          filterActive: true,
          filteredCount: filteredInvoices.length,
        })
      : statusMessage;

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
          {displayStatusMessage}
        </p>

        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <InvoiceSearch
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
            <InvoiceFilters
              filters={filters}
              onFilterChange={(nextFilters) => {
                setFilters(nextFilters);
                setVisibleCount(PAGE_SIZE);
              }}
              onClearFilters={() => {
                setFilters(DEFAULT_FILTERS);
                setSearchQuery("");
                setVisibleCount(PAGE_SIZE);
              }}
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
              {visibleInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/invest/${invoice.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-cyan-500/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                    aria-label={`View details for ${invoice.issuer} invoice ${invoice.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-100">
                        {invoice.issuer}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-cyan-900/60 text-cyan-300">
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-300">
                      <span>
                        {formatCurrency(invoice.amount, {
                          currency: invoice.currency,
                        })}
                      </span>
                      <span>Est. yield {formatYield(invoice.yield)}</span>
                      <span>Maturity {invoice.dueDate}</span>
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
              Note: Yield references are educational only and reflect on-chain
              basis-point assumptions. Invoice contracts settle at maturity.
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
