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
});
