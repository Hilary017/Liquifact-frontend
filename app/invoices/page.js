"use client";
import { useState } from "react";
import { copy } from "../copy/en";
import NavMenu from "../../components/NavMenu";
import UploadZone from "../../components/UploadZone";
import { useState } from "react";
import InvoiceList from "../../components/InvoiceList";

export default function InvoicesPage() {
  const [optimisticInvoices, setOptimisticInvoices] = useState([]);

  const handleUploadSuccess = (invoice) => {
    setOptimisticInvoices((current) => [invoice, ...current]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Reuse the shared site header so invoices matches the rest of the app. */}
      <NavMenu />
      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-6">{copy.invoices.title}</h1>
        <p className="text-slate-400 mb-8">{copy.invoices.subtext}</p>
        <UploadZone onUploadSuccess={handleUploadSuccess} />
        <div className="mt-10">
          <InvoiceList optimisticInvoices={optimisticInvoices} />
        </div>
      </main>
    </div>
  );
}
