import { render } from "@testing-library/react";
import InvoiceListSkeleton from "./InvoiceListSkeleton";

describe("InvoiceListSkeleton", () => {
  it("renders default 3 rows", () => {
    const { container } = render(<InvoiceListSkeleton />);
    const list = container.querySelector("ul");
    expect(list).toBeTruthy();
    expect(list.children).toHaveLength(3);
  });

  it("renders custom number of rows", () => {
    const { container } = render(<InvoiceListSkeleton rows={5} />);
    const list = container.querySelector("ul");
    expect(list.children).toHaveLength(5);
  });

  it("has aria-busy true", () => {
    const { container } = render(<InvoiceListSkeleton />);
    expect(
      container.querySelector("ul").getAttribute("aria-busy")
    ).toBe("true");
  });

  it("has descriptive aria-label", () => {
    const { container } = render(<InvoiceListSkeleton />);
    expect(
      container.querySelector("ul").getAttribute("aria-label")
    ).toBe("Loading investable invoices");
  });

  it("each row has animate-pulse class", () => {
    const { container } = render(<InvoiceListSkeleton rows={2} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item.className).toContain("animate-pulse");
    });
  });

  it("verifies the stable, deterministic key strategy for list items", () => {
    const element = InvoiceListSkeleton({ rows: 4 });
    const listItems = element.props.children;
    expect(listItems).toHaveLength(4);
    listItems.forEach((item, i) => {
      expect(item.key).toBe(`skeleton-row-${i}`);
    });
  });
});

