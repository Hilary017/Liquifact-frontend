"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import ErrorBanner from "../../components/ErrorBanner";
import InvoiceListSkeleton from "../../components/InvoiceListSkeleton";
import InvoiceSearch from "../../components/InvoiceSearch";
import NavMenu from "../../components/NavMenu";
import InvoiceFilters, { DEFAULT_FILTERS, hasActiveFilters } from "../../components/InvoiceFilters";
import { copy } from "../copy/en";
import { loadMockInvoices } from "./lib";

export function getInvoiceLoadAnnouncement(invoices, { filterActive, filteredCount } = {}) {
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

export function InvestMarketplace({ loadInvoices = loadMockInvoices }) {
  const [invoices, setInvoices] = useState(null); // null = loading
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    let isActive = true;

    const announceLoadCompletion = async () => {
      try {
        const nextInvoices = await loadInvoices();

        if (!isActive) {
          return;
        }

        const normalizedInvoices = Array.isArray(nextInvoices) ? nextInvoices : [];

        setInvoices(normalizedInvoices);
      } catch {
        if (!isActive) {
          return;
        }

        setInvoices([]);
        setLoadError("Unable to load investable invoices right now.");
      }
    };

    void announceLoadCompletion();

    return () => {
      isActive = false;
    };
  }, [loadInvoices]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredInvoices = useMemo(() => {
    if (!Array.isArray(invoices)) return [];

    let result = invoices;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim().toLowerCase();
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
  }, [invoices, debouncedQuery, filters]);

  const filterActive =
    hasActiveFilters(filters) || Boolean(debouncedQuery.trim());

  const statusMessage = (() => {
    if (invoices === null) return "";
    if (loadError) return "Unable to load investable invoices.";
    return getInvoiceLoadAnnouncement(invoices, {
      filterActive,
      filteredCount: filteredInvoices.length,
    });
  })();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavMenu />

      <main className="max-w-4xl mx-auto px-6 py-12">
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
              onFilterChange={setFilters}
              onClearFilters={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
        </div>

        {loadError ? (
          <ErrorBanner variant="error" title="Unable to load investable invoices" description={loadError} previewLabel="Marketplace status" />
        ) : invoices === null ? (
          <InvoiceListSkeleton rows={3} />
        ) : invoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-300">{copy.invest.emptyState}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-300">No invoices match your filters.</div>
        ) : (
          <>
            <ul className="space-y-4">
              {filteredInvoices.map((inv) => (
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
