import InvoiceListSkeleton from "../../components/InvoiceListSkeleton";

export default function InvestLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" aria-busy="true">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="inline-block py-3 text-xl font-semibold tracking-tight text-transparent bg-slate-700 rounded w-28 animate-pulse">
          ← LiquiFact
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="h-7 w-24 rounded bg-slate-700 animate-pulse mb-2" />
        <div className="h-4 w-full max-w-xl rounded bg-slate-800 animate-pulse mb-2" />
        <div className="h-4 w-3/4 max-w-lg rounded bg-slate-800 animate-pulse mb-8" />

        <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-32 rounded-lg bg-slate-800 animate-pulse" />
            ))}
          </div>
        </div>

        <InvoiceListSkeleton rows={3} />
      </main>
    </div>
  );
}
