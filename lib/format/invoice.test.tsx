import { formatAmount, formatYield } from "@/lib/format/invoice";

describe("Invoice format helpers", () => {
  test("formatAmount produces locale‑aware string", () => {
    const value = 12500;
    const expected = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
    expect(formatAmount(value)).toBe(expected);
  });

  test("formatYield adds percent sign", () => {
    expect(formatYield(8.2)).toBe("8.2%");
    expect(formatYield(7)).toBe("7%");
  });

  test("numeric sorting works for invoice fixtures", () => {
    const invoices = [
      { id: "a", amountValue: 22000 },
      { id: "b", amountValue: 12500 },
      { id: "c", amountValue: 7800 },
    ];
    const sorted = [...invoices].sort((x, y) => x.amountValue - y.amountValue);
    expect(sorted.map((i) => i.id)).toEqual(["c", "b", "a"]);
  });
});
