import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import InvoiceList from "./InvoiceList";
import { copy } from "../app/copy/en";

describe("InvoiceList", () => {
  it("renders invoices and status badges on successful load", async () => {
    const loader = jest.fn().mockResolvedValue([
      {
        id: "inv-001",
        issuer: "Test Supplier",
        amount: "1,200",
        currency: "USD",
        dueDate: "2026-10-01",
        yield: "6.5%",
        status: "Tokenized",
      },
      {
        id: "inv-002",
        issuer: "Another LLC",
        amount: "3,500",
        currency: "EUR",
        dueDate: "2026-11-15",
        yield: "5.0%",
        status: "Settled",
      },
    ]);

    render(<InvoiceList loadInvoices={loader} />);

    await waitFor(() => expect(screen.getByText("Test Supplier")).toBeInTheDocument());

    expect(screen.getByRole("heading", { name: /your invoices/i })).toBeInTheDocument();
    expect(screen.getByText("Another LLC")).toBeInTheDocument();
    expect(screen.getByText("Tokenized")).toBeInTheDocument();
    expect(screen.getByText("Settled")).toBeInTheDocument();
  });

  it("renders empty state when loader returns no invoices", async () => {
    const loader = jest.fn().mockResolvedValue([]);

    render(<InvoiceList loadInvoices={loader} />);

    await waitFor(() => expect(screen.getByText(copy.invoices.emptyState)).toBeInTheDocument());
  });

  it("renders ErrorBanner when loader rejects", async () => {
    const loader = jest.fn().mockRejectedValue(new Error("Network failure"));

    render(<InvoiceList loadInvoices={loader} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText(/unable to load invoices/i)).toBeInTheDocument();
  });

  it("optimistically appends a new invoice when optimisticInvoices changes", async () => {
    const loader = jest.fn().mockResolvedValue([
      {
        id: "inv-003",
        issuer: "Stable Cargo",
        amount: "9,000",
        currency: "USD",
        dueDate: "2026-09-20",
        yield: "4.5%",
        status: "Funded",
      },
    ]);

    const { rerender } = render(<InvoiceList loadInvoices={loader} optimisticInvoices={[]} />);

    await waitFor(() => expect(screen.getByText("Stable Cargo")).toBeInTheDocument());

    rerender(
      <InvoiceList
        loadInvoices={loader}
        optimisticInvoices={[
          {
            id: "upload-123",
            issuer: "New Upload.pdf",
            amount: "Pending",
            currency: "USD",
            dueDate: "Pending",
            yield: "Pending",
            status: "Pending tokenization",
          },
        ]}
      />
    );

    await waitFor(() => expect(screen.getByText("New Upload.pdf")).toBeInTheDocument());
    expect(screen.getByText("Pending tokenization")).toBeInTheDocument();
  });
});
