'use client';

import { useEffect, useMemo, useState } from 'react';
import ErrorBanner from '../../components/ErrorBanner';
import InvoiceListSkeleton from '../../components/InvoiceListSkeleton';
import { copy } from '../copy/en';
import { fetchInvestableInvoices } from '../lib/api/invoices';

const INVOICE_STATUSES = {
  PENDING_TOKENIZATION: 'Pending tokenization',
  TOKENIZED: 'Tokenized',
  FUNDED: 'Funded',
  SETTLED: 'Settled',
};

const STATUS_STYLES = {
  [INVOICE_STATUSES.PENDING_TOKENIZATION]:
    'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20',
  [INVOICE_STATUSES.TOKENIZED]:
    'bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-400/20',
  [INVOICE_STATUSES.FUNDED]:
    'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/20',
  [INVOICE_STATUSES.SETTLED]:
    'bg-slate-800/80 text-slate-200 ring-1 ring-slate-500/20',
};

const MOCK_INVOICES = [
  {
    id: 'inv-1001',
    issuer: 'Test Supplier',
    amount: '12,500',
    currency: 'USD',
    dueDate: '2026-06-15',
    yield: '8.2%',
    status: INVOICE_STATUSES.TOKENIZED,
  },
  {
    id: 'inv-1002',
    issuer: 'Another LLC',
    amount: '7,800',
    currency: 'EUR',
    dueDate: '2026-07-01',
    yield: '7.5%',
    status: INVOICE_STATUSES.SETTLED,
  },
];

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
    let active = true;

    async function load() {
      setInvoices(null);
      setLoadError('');

      try {
        const result = await loadInvoices();
        if (!active) return;

        setInvoices(normalizedInvoices);
        setVisibleCount(PAGE_SIZE);
        setLoadError("");
        setStatusMessage(getInvoiceLoadAnnouncement(normalizedInvoices));
      } catch {
        if (!isActive) return;

        setInvoices(null);
        setLoadError(copy.invest.errorDescription);
        setStatusMessage(copy.invest.errorStatus);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [loadInvoices]);

  const statusMessage = loadError
    ? 'Invoice list failed to load.'
    : (invoices === null ? 'Loading invoices.' : getInvoiceAnnouncement(mergedInvoices));

  if (loadError) {
    return (
      <div className="space-y-6">
        <ErrorBanner
          title={copy.invoices.errorTitle || 'Unable to load invoices'}
          description={loadError}
          previewLabel="Invoice list status"
        />
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {displayStatusMessage}
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="invoice-list-heading" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="invoice-list-heading" className="text-xl font-semibold text-slate-100">
            Your invoices
          </h2>
          <p className="text-sm text-slate-400">
            Track tokenization progress for uploaded documents.
          </p>
        </div>
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {statusMessage}
        </p>
      </div>

      {invoices === null && mergedInvoices.length === 0 ? (
        <InvoiceListSkeleton rows={3} />
      ) : mergedInvoices.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-300">
          {copy.invoices.emptyState}
        </div>
      ) : (
        <ul className="space-y-4">
          {mergedInvoices.map((invoice) => {
            const statusValue =
              invoice.status in STATUS_STYLES
                ? invoice.status
                : INVOICE_STATUSES.PENDING_TOKENIZATION;
            return (
              <li
                key={invoice.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">
                      Invoice
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      {invoice.issuer}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${STATUS_STYLES[statusValue]
                      }`}
                  >
                    {statusValue}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Amount
                    </dt>
                    <dd className="mt-2 text-sm text-slate-200">
                      {invoice.currency} {invoice.amount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Estimated yield
                    </dt>
                    <dd className="mt-2 text-sm text-slate-200">{invoice.yield}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Due date
                    </dt>
                    <dd className="mt-2 text-sm text-slate-200">{invoice.dueDate}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      Reference
                    </dt>
                    <dd className="mt-2 text-sm text-slate-200">{invoice.id}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
