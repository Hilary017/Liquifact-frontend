'use client';

import { useEffect, useMemo, useState } from 'react';
import ErrorBanner from './ErrorBanner';
import InvoiceListSkeleton from './InvoiceListSkeleton';
import { copy } from '../app/copy/en';

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
    issuer: 'Acme Supplies Ltd',
    amount: '12,500',
    currency: 'USD',
    dueDate: '2026-06-15',
    yield: '8.2%',
    status: INVOICE_STATUSES.TOKENIZED,
  },
  {
    id: 'inv-1002',
    issuer: 'Bright Logistics GmbH',
    amount: '7,800',
    currency: 'EUR',
    dueDate: '2026-07-01',
    yield: '7.5%',
    status: INVOICE_STATUSES.FUNDED,
  },
];

function loadMockInvoices() {
  return Promise.resolve(MOCK_INVOICES);
}

function getInvoiceAnnouncement(items) {
  if (!Array.isArray(items)) {
    return '';
  }

  if (items.length === 0) {
    return 'No invoices are currently available.';
  }

  return `${items.length} invoice${items.length === 1 ? '' : 's'} available.`;
}

function mergeInvoices(optimisticInvoices, loadedInvoices) {
  const mergedById = new Map();

  (optimisticInvoices ?? []).forEach((invoice) => {
    mergedById.set(invoice.id, invoice);
  });

  (loadedInvoices ?? []).forEach((invoice) => {
    if (!mergedById.has(invoice.id)) {
      mergedById.set(invoice.id, invoice);
    }
  });

  return Array.from(mergedById.values());
}

/**
 * InvoiceList — renders a SME invoice list with accessible loading,
 * empty, and error states.
 *
 * @param {object} props
 * @param {Function} [props.loadInvoices] - Async loader that resolves to an
 *   invoice array. Defaults to a mock loader for local development.
 * @param {Array<object>} [props.optimisticInvoices] - Newly submitted invoices
 *   that should appear immediately while backend syncs.
 * @returns {JSX.Element}
 */
export default function InvoiceList({
  loadInvoices = loadMockInvoices,
  optimisticInvoices = [],
}) {
  const [invoices, setInvoices] = useState(null);
  const [loadError, setLoadError] = useState('');

  const mergedInvoices = useMemo(
    () => mergeInvoices(optimisticInvoices, invoices ?? []),
    [optimisticInvoices, invoices]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await loadInvoices();
        if (!active) return;

        const normalized = Array.isArray(result) ? result : [];
        setInvoices(normalized);
      } catch (error) {
        if (!active) return;

        setLoadError(
          copy.invoices.errorDescription || 'Unable to load invoices.'
        );
        setInvoices([]);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [loadInvoices]);

  const statusMessage = loadError
    ? 'Invoice list failed to load.'
    : invoices === null
      ? 'Loading invoices.'
      : getInvoiceAnnouncement(mergedInvoices);

  if (loadError) {
    return (
      <div className="space-y-6">
        <ErrorBanner
          title={copy.invoices.errorTitle || 'Unable to load invoices'}
          description={loadError}
          previewLabel="Invoice list status"
        />
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {statusMessage}
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
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      STATUS_STYLES[statusValue]
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
