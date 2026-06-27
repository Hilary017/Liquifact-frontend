import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import { getInvoiceLoadAnnouncement, InvestMarketplace, default as InvestPage } from "../page";
import { getInvoiceById, loadMockInvoices } from "../lib";

jest.mock("next/link", () => {
  function MockLink({ href, children, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return {
    __esModule: true,
    default: MockLink,
  };
});

jest.mock("../../lib/api/invoices", () => ({
  fetchInvestableInvoices: jest.fn(() => Promise.resolve([
    {
      id: 'inv-001',
      issuer: 'Acme Supplies Ltd',
      amount: '12,500',
      currency: 'USD',
      dueDate: '2026-06-15',
      yield: '8.2%',
      status: 'Open',
    },
    {
      id: 'inv-002',
      issuer: 'Bright Logistics GmbH',
      amount: '7,800',
      currency: 'EUR',
      dueDate: '2026-07-01',
      yield: '7.5%',
      status: 'Open',
    },
    {
      id: 'inv-003',
      issuer: 'Sunrise Exports Pte',
      amount: '22,000',
      currency: 'USD',
      dueDate: '2026-05-30',
      yield: '9.1%',
      status: 'Open',
    },
  ])),
}));

function createDeferredLoader(invoices, delayMs = 0) {
  return jest.fn(
    () =>
      new Promise((resolve) => {
        setTimeout(() => resolve(invoices), delayMs);
      })
  );
}

function createPendingLoader() {
  return jest.fn(() => new Promise(() => {}));
}

async function flushTimers(delayMs = 0) {
  await act(async () => {
    jest.advanceTimersByTime(delayMs);
    await Promise.resolve();
  });
}

describe("InvestMarketplace", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("keeps the skeleton busy state while invoices are still loading", () => {
    render(<InvestMarketplace loadInvoices={createPendingLoader()} />);

    const skeleton = screen.getByRole("list", {
      name: /loading investable invoices/i,
    });

    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("announces the loaded invoice count exactly once after the list resolves", async () => {
    const invoices = [
      {
        id: "inv-001",
        issuer: "Acme Supplies Ltd",
        amount: "12,500",
        currency: "USD",
        dueDate: "2026-06-15",
        yield: "8.2%",
        status: "Open",
      },
      {
        id: "inv-002",
        issuer: "Bright Logistics GmbH",
        amount: "7,800",
        currency: "EUR",
        dueDate: "2026-07-01",
        yield: "7.5%",
        status: "Open",
      },
      {
        id: "inv-003",
        issuer: "Sunrise Exports Pte",
        amount: "22,000",
        currency: "USD",
        dueDate: "2026-05-30",
        yield: "9.1%",
        status: "Open",
      },
    ];

    const loadInvoices = createDeferredLoader(invoices, 100);
    const { rerender } = render(<InvestMarketplace loadInvoices={loadInvoices} />);

    expect(screen.getByRole("list", { name: /loading investable invoices/i })).toHaveAttribute(
      "aria-busy",
      "true"
    );

    await flushTimers(100);

    expect(screen.getByRole("status")).toHaveTextContent("3 investable invoices loaded");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(loadInvoices).toHaveBeenCalledTimes(1);

    rerender(<InvestMarketplace loadInvoices={loadInvoices} />);

    expect(loadInvoices).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("3 investable invoices loaded");
  });

  it("renders each invoice as a focusable link to its detail route", async () => {
    const invoices = [
      {
        id: "inv-001",
        issuer: "Acme Supplies Ltd",
        amount: "12,500",
        currency: "USD",
        dueDate: "2026-06-15",
        yield: "8.2%",
        status: "Open",
      },
      {
        id: "inv-002",
        issuer: "Bright Logistics GmbH",
        amount: "7,800",
        currency: "EUR",
        dueDate: "2026-07-01",
        yield: "7.5%",
        status: "Open",
      },
    ];

    render(<InvestMarketplace loadInvoices={createDeferredLoader(invoices, 0)} />);
    await flushTimers(0);

    const links = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href").startsWith("/invest/"));
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/invest/inv-001");
    expect(links[1]).toHaveAttribute("href", "/invest/inv-002");

    links[0].focus();
    expect(links[0]).toHaveFocus();
  });

  it("announces the empty marketplace state when no invoices load", async () => {
    const loadInvoices = createDeferredLoader([], 100);

    render(<InvestMarketplace loadInvoices={loadInvoices} />);

    await flushTimers(100);

    expect(screen.getByRole("status")).toHaveTextContent("No invoices available");
    expect(
      screen.getByText(/No investable invoices\. Connect wallet to see the marketplace\./i)
    ).toBeInTheDocument();
  });

  it("announces load errors through an alert and live region", async () => {
    const loadInvoices = jest.fn(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("boom")), 50);
        })
    );

    render(<InvestMarketplace loadInvoices={loadInvoices} />);

    await flushTimers(50);

    expect(screen.getByRole("status")).toHaveTextContent("Unable to load investable invoices.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load investable invoices right now."
    );
  });

  it("ignores stale successful load results after the component unmounts", async () => {
    const loadInvoices = jest.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        })
    );

    const { unmount } = render(<InvestMarketplace loadInvoices={loadInvoices} />);
    unmount();

    await flushTimers(100);

    expect(loadInvoices).toHaveBeenCalledTimes(1);
  });

  it("ignores stale error load results after the component unmounts", async () => {
    const loadInvoices = jest.fn(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("boom")), 100);
        })
    );

    const { unmount } = render(<InvestMarketplace loadInvoices={loadInvoices} />);
    unmount();

    await flushTimers(100);

    expect(loadInvoices).toHaveBeenCalledTimes(1);
  });
});

describe("getInvoiceLoadAnnouncement", () => {
  it("returns the expected announcement for loaded and empty states", () => {
    expect(getInvoiceLoadAnnouncement([])).toBe("No invoices available");
    expect(getInvoiceLoadAnnouncement([{ id: "1" }, { id: "2" }])).toBe(
      "2 investable invoices loaded"
    );
  });
});

describe("InvestPage", () => {
  let originalFetch: typeof global.fetch;
 
  beforeEach(() => {
    jest.useFakeTimers();
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([
        {
          id: "inv-001",
          issuer: "Acme Supplies Ltd",
          amount: "12,500",
          currency: "USD",
          dueDate: "2026-06-15",
          yield: "8.2%",
          status: "Open",
        },
        {
          id: "inv-002",
          issuer: "Bright Logistics GmbH",
          amount: "7,800",
          currency: "EUR",
          dueDate: "2026-07-01",
          yield: "7.5%",
          status: "Open",
        },
        {
          id: "inv-003",
          issuer: "Sunrise Exports Pte",
          amount: "22,000",
          currency: "USD",
          dueDate: "2026-05-30",
          yield: "9.1%",
          status: "Open",
        },
      ]),
    } as Response);
  });
 
  afterEach(() => {
    global.fetch = originalFetch;
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
 
  it("renders the marketplace page via the default export", async () => {
    render(<InvestPage />);
    await flushTimers(0);
 
    expect(screen.getByRole("heading", { name: /^invest$/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});

describe("lib helpers", () => {
  it("resolves an invoice by id or returns undefined for unknown ids", () => {
    expect(getInvoiceById("inv-001")).toMatchObject({ id: "inv-001" });
    expect(getInvoiceById("missing")).toBeUndefined();
  });

  it("loads all mock invoices", async () => {
    const invoices = await loadMockInvoices();
    expect(invoices).toHaveLength(3);
  });
});
