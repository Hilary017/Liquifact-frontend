"use client";

import Button from '@/components/Button';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import ErrorBanner from "@/components/ErrorBanner";
import InvoiceListSkeleton from "@/components/InvoiceListSkeleton";
import WalletStatus from "@/components/WalletStatus";
import { useWallet, WALLET_STATES } from "@/components/WalletContext";
import { copy } from "../../copy/en";
import { getInvoiceById } from "../lib";

// DEV-only delay (ms) to make the skeleton visible during local development.
const DEV_DELAY = process.env.NODE_ENV === "development" ? 800 : 0;

function loadInvoiceById(id) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(getInvoiceById(id)), DEV_DELAY);
  });
}

export function InvoiceDetail({ loadInvoice = loadInvoiceById }) {
  const params = useParams();
  const id = params?.id;
  const [invoice, setInvoice] = useState(null); // null = loading
  const [loadError, setLoadError] = useState("");
  const { state: walletState, connect } = useWallet();

  useEffect(() => {
    if (!id) {
      return;
    }

    let isActive = true;

    const load = async () => {
      try {
        const inv = await loadInvoice(id);

        if (!isActive) {
          return;
        }

        if (!inv) {
          notFound();
          return;
        }

        setInvoice(inv);
      } catch {
        if (!isActive) {
          return;
        }

        setLoadError("Unable to load invoice details right now.");
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [id, loadInvoice]);

  if (!id) {
    return notFound();
  }

  const handleFund = () => {
    if (walletState === WALLET_STATES.DISCONNECTED) {
      connect();
    }
  };

  const isFundingDisabled =
    walletState === WALLET_STATES.CONNECTING || walletState === WALLET_STATES.NO_WALLET;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-block py-3 text-xl font-semibold tracking-tight text-cyan-400 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded"
        >
          â† LiquiFact
        </Link>
        <WalletStatus />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/invest"
          className="inline-block mb-6 text-sm text-slate-400 hover:text-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded"
          aria-label="Back to marketplace"
        >
          â† Back to marketplace
        </Link>

        <h1 className="text-2xl font-bold mb-2">Invoice details</h1>
        <p className="text-slate-400 mb-8">Review the invoice terms before funding.</p>

        {loadError ? (
          <ErrorBanner
            variant="error"
            title="Unable to load invoice details"
            description={loadError}
            previewLabel="Invoice detail"
          />
        ) : invoice === null ? (
          <InvoiceListSkeleton rows={1} />
        ) : (
          <>
            <section
              aria-labelledby="invoice-summary-heading"
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 mb-6"
            >
              <h2 id="invoice-summary-heading" className="text-xl font-semibold mb-4">
                {invoice.issuer}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Amount</dt>
                  <dd className="text-slate-100">
                    {invoice.currency} {invoice.amount}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Estimated yield</dt>
                  <dd className="text-slate-100">{invoice.yield}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Maturity date</dt>
                  <dd className="text-slate-100">{invoice.dueDate}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="text-slate-100">{invoice.status}</dd>
                </div>
              </dl>
            </section>

            <button
              type="button"
              onClick={handleFund}
              disabled={isFundingDisabled}
              className="rounded-full bg-cyan-500/20 text-cyan-400 px-6 py-3 text-sm font-medium hover:bg-cyan-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Fund this invoice"
            >
              Fund this invoice
            </button>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-300">
              Note: Yield references are educational only and reflect on-chain basis-point
              assumptions. Invoice contracts settle at maturity. Funding commits principal and is
              subject to wallet approval.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function InvoiceDetailPage() {
  return <InvoiceDetail />;
}
