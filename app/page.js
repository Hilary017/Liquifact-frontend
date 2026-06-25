"use client";

import { useState } from 'react';
import Link from 'next/link';
import NavMenu from '../components/NavMenu';
import { copy } from './copy/en';
import { getHealth } from '../lib/api/health';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkApi = async () => {
    setLoading(true);

    try {
      const result = await getHealth(API_URL);
      setHealth(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavMenu />

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{copy.home.heroTitle}</h1>
        <p className="text-slate-400 text-lg mb-12 max-w-2xl">{copy.home.heroSub}</p>

        <div className="grid gap-6 sm:grid-cols-2 mb-12">
          <Link
            href="/invoices"
            className="block rounded-xl border border-slate-700 bg-slate-900/50 p-6 hover:border-cyan-500/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <h2 className="text-lg font-semibold text-cyan-400 mb-2">{copy.home.boxBusinessTitle}</h2>
            <p className="text-slate-400 text-sm">{copy.home.boxBusinessSub}</p>
          </Link>
          <Link
            href="/invest"
            className="block rounded-xl border border-slate-700 bg-slate-900/50 p-6 hover:border-cyan-500/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <h2 className="text-lg font-semibold text-cyan-400 mb-2">{copy.home.boxInvestTitle}</h2>
            <p className="text-slate-400 text-sm">{copy.home.boxInvestSub}</p>
          </Link>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h2 className="text-sm font-medium text-slate-400 mb-2">{copy.home.apiStatus}</h2>
          <button
            type="button"
            onClick={checkApi}
            disabled={loading}
            className="rounded-lg cursor-pointer bg-slate-800 px-4 py-3 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {loading ? copy.home.checking : copy.home.checkApiHealth}
          </button>
          {!loading && health && (
            <>
              <p role="status" aria-live="polite">
                Status: {health?.status ?? "Not checked"}
              </p>

              <p>{health.message}</p>

              {health.details && (
                <details>
                  <summary>View details</summary>

                  <pre>
                    {JSON.stringify(health.details, null, 2)}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
