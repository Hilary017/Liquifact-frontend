import Link from "next/link";
import ErrorBanner from "../../components/ErrorBanner";
import UploadZone, { FileConstraintNotice } from "../../components/UploadZone";
import { copy } from "../copy/en";

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-block py-3 text-xl font-semibold tracking-tight text-cyan-400 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 rounded"
        >
          ← LiquiFact
        </Link>
        <button
          type="button"
          className="rounded-full bg-cyan-500/20 text-cyan-400 px-4 py-3 text-sm font-medium hover:bg-cyan-500/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Connect Wallet
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">{copy.invoices.title}</h1>
        <p className="text-slate-400 mb-8">
          {copy.invoices.subtext}
        </p>
        <FileConstraintNotice />
        <UploadZone />
        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/30 p-8 text-center text-slate-500">
          {copy.invoices.emptyState}
        </div>
      </main>
    </div>
  );
}
