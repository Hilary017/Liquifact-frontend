/**
 * @file components/InvoiceCard.test.tsx
 * Unit + accessibility tests for the shared InvoiceCard component.
 * Target: ≥ 95% branch coverage for InvoiceCard.jsx
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import InvoiceCard from "./InvoiceCard";

expect.extend(toHaveNoViolations);

// Next.js Link renders an <a> in tests; mock it simply.
jest.mock("next/link", () => {
  const Link = ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
  Link.displayName = "Link";
  return Link;
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_INVOICE = {
  id: "INV-001",
  issuer: "Acme Corp",
  amount: 50000,
  currency: "USDC",
  dueDate: "2025-09-30",
  yield: 8.5,
  status: "available",
};

function renderCard(overrides = {}) {
  const invoice = { ...BASE_INVOICE, ...overrides };
  return render(<InvoiceCard invoice={invoice} />);
}

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

describe("InvoiceCard — basic rendering", () => {
  it("renders the issuer name", () => {
    renderCard();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders the invoice id", () => {
    renderCard();
    expect(screen.getByText("INV-001")).toBeInTheDocument();
  });

  it("renders the formatted amount and currency", () => {
    renderCard();
    expect(screen.getByText("50,000.00 USDC")).toBeInTheDocument();
  });

  it("renders the yield percentage", () => {
    renderCard();
    expect(screen.getByText("8.5%")).toBeInTheDocument();
  });

  it("renders the formatted due date", () => {
    renderCard();
    // "Sep 30, 2025" or locale-equivalent
    expect(screen.getByText(/sep.+30.+2025/i)).toBeInTheDocument();
  });

  it("renders a status badge with the correct label", () => {
    renderCard({ status: "available" });
    expect(screen.getByRole("status", { hidden: true })).toHaveTextContent("Available");
  });

  it("links to the invoice detail page", () => {
    renderCard({ id: "INV-042" });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/invest/INV-042");
  });
});

// ---------------------------------------------------------------------------
// Status variants
// ---------------------------------------------------------------------------

describe("InvoiceCard — status variants", () => {
  it.each([
    ["available", "Available"],
    ["funded", "Funded"],
    ["pending", "Pending"],
  ])("renders status '%s' as '%s'", (status, label) => {
    renderCard({ status });
    expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(label);
  });

  it("falls back to pending styling for unknown status values", () => {
    renderCard({ status: "unknown-value" });
    // Should not throw and should still render a badge
    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases — missing optional fields
// ---------------------------------------------------------------------------

describe("InvoiceCard — missing optional fields", () => {
  it("renders em-dash when amount is missing", () => {
    renderCard({ amount: undefined });
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders em-dash when dueDate is missing", () => {
    // amount is set so only dueDate produces '—'
    renderCard({ dueDate: undefined });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("renders em-dash when yield is missing", () => {
    renderCard({ yield: undefined });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("renders fallback text when issuer is missing", () => {
    renderCard({ issuer: undefined });
    expect(screen.getByText(/unknown issuer/i)).toBeInTheDocument();
  });

  it("handles null amount gracefully", () => {
    renderCard({ amount: null as any });
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("handles an invalid date string without throwing", () => {
    renderCard({ dueDate: "not-a-date" });
    // Should render the raw string as fallback
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Long issuer names
// ---------------------------------------------------------------------------

describe("InvoiceCard — long issuer names", () => {
  it("renders without layout-breaking for a very long issuer name", () => {
    const longName = "A".repeat(120);
    renderCard({ issuer: longName });
    expect(screen.getByText(longName)).toBeInTheDocument();
    // The containing element should have a truncate class
    expect(screen.getByText(longName)).toHaveClass("truncate");
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe("InvoiceCard — accessibility", () => {
  it("has no axe violations for a complete invoice", async () => {
    const { container } = renderCard();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no axe violations when optional fields are missing", async () => {
    const { container } = renderCard({
      issuer: undefined,
      amount: undefined,
      dueDate: undefined,
      yield: undefined,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has an accessible aria-label on the link describing the invoice", () => {
    renderCard();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label");
    expect(link.getAttribute("aria-label")).toMatch(/acme corp/i);
    expect(link.getAttribute("aria-label")).toMatch(/available/i);
  });

  it("status badge has role='status' and an aria-label", () => {
    renderCard({ status: "funded" });
    const badge = screen.getByRole("status", { hidden: true });
    expect(badge).toHaveAttribute("aria-label", "Status: Funded");
  });
});

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

describe("InvoiceCard — snapshot", () => {
  it("matches snapshot for a complete invoice", () => {
    const { asFragment } = renderCard();
    expect(asFragment()).toMatchSnapshot();
  });
});