// lib/api/invoices.test.ts
/**
 * Tests for fetchInvestableInvoices API client.
 */

import { fetchInvestableInvoices } from "./invoices";

describe("fetchInvestableInvoices", () => {
  const originalFetch = global.fetch as any;

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("fetches invoices and returns normalized data", async () => {
    const mockData = [
      {
        id: "1",
        issuer: "Test Corp",
        amount: "1000",
        currency: "USD",
        dueDate: "2026-12-31",
        yield: "5%",
        status: "Open",
      },
    ];
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });
    (global as any).fetch = fetchMock;

    const result = await fetchInvestableInvoices();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/invoices",
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual(mockData);
  });

  it("uses NEXT_PUBLIC_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.com";
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    (global as any).fetch = fetchMock;

    await fetchInvestableInvoices();
    expect(fetchMock).toHaveBeenCalledWith("http://api.example.com/invoices", expect.any(Object));
  });

  it("throws on non‑200 response", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" });
    (global as any).fetch = fetchMock;

    await expect(fetchInvestableInvoices()).rejects.toThrow(
      "Failed to fetch invoices: 500 Server Error"
    );
  });

  it("throws on invalid JSON", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("invalid json");
      },
    });
    (global as any).fetch = fetchMock;

    await expect(fetchInvestableInvoices()).rejects.toThrow("Response is not valid JSON");
  });

  it("throws when payload is not an array", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ foo: "bar" }) });
    (global as any).fetch = fetchMock;

    await expect(fetchInvestableInvoices()).rejects.toThrow("Invoice payload is not an array");
  });

  it("passes AbortSignal to fetch", async () => {
    const controller = new AbortController();
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    (global as any).fetch = fetchMock;

    await fetchInvestableInvoices({ signal: controller.signal });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    );
  });

  // ── Field normalization & defaulting ──────────────────────────────────────
  //
  // The client maps each raw entry to the UI contract
  // { id, issuer, amount, currency, dueDate, yield, status }, defaulting every
  // missing field to null and dropping any unknown extra fields.

  const UI_FIELDS = ["id", "issuer", "amount", "currency", "dueDate", "yield", "status"] as const;

  function mockJson(payload: unknown) {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => payload });
  }

  it("defaults every missing field to null for a fully-empty object", async () => {
    mockJson([{}]);
    const [invoice] = await fetchInvestableInvoices();

    expect(Object.keys(invoice).sort()).toEqual([...UI_FIELDS].sort());
    for (const field of UI_FIELDS) {
      expect(invoice[field as keyof typeof invoice]).toBeNull();
    }
  });

  it("defaults only the missing fields on a partial object, keeping present ones", async () => {
    mockJson([{ id: "inv-1", amount: "500" }]);
    const [invoice] = await fetchInvestableInvoices();

    expect(invoice).toEqual({
      id: "inv-1",
      issuer: null,
      amount: "500",
      currency: null,
      dueDate: null,
      yield: null,
      status: null,
    });
  });

  it("maps the raw 'yield' field through to the normalized 'yield' field", async () => {
    mockJson([{ yield: "7.5%" }]);
    const [invoice] = await fetchInvestableInvoices();

    expect(invoice.yield).toBe("7.5%");
  });

  it("drops unknown extra fields not in the UI contract", async () => {
    mockJson([{ id: "inv-2", secret: "leak", __proto__hack: true, extra: 123 }]);
    const [invoice] = await fetchInvestableInvoices();

    expect(Object.keys(invoice).sort()).toEqual([...UI_FIELDS].sort());
    expect(invoice).not.toHaveProperty("secret");
    expect(invoice).not.toHaveProperty("extra");
  });

  it("treats null and non-object entries as fully-defaulted invoices", async () => {
    mockJson([null, undefined, 42, "oops"]);
    const result = await fetchInvestableInvoices();

    expect(result).toHaveLength(4);
    for (const invoice of result) {
      for (const field of UI_FIELDS) {
        expect(invoice[field as keyof typeof invoice]).toBeNull();
      }
    }
  });

  it("returns an empty array for an empty payload", async () => {
    mockJson([]);
    await expect(fetchInvestableInvoices()).resolves.toEqual([]);
  });

  it("throws the documented message when the body is a non-array object", async () => {
    mockJson({ invoices: [] });
    await expect(fetchInvestableInvoices()).rejects.toThrow("Invoice payload is not an array");
  });
});
