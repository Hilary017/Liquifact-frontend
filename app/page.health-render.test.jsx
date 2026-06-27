import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "./page";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

jest.mock("../components/WalletStatusLazy", () => ({
  __esModule: true,
  default: function MockWalletStatusLazy() {
    return <button type="button">Connect Wallet</button>;
  },
}));

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

afterEach(() => {
  jest.restoreAllMocks();
});

function mockFetchOnce(responseBody, ok = true) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValueOnce(responseBody),
  });
}

async function clickCheckHealth() {
  fireEvent.click(screen.getByRole("button", { name: /check backend health/i }));
  await waitFor(() => expect(screen.queryByText(/checking/i)).not.toBeInTheDocument());
}

describe("Home health render", () => {
  it("renders status badge and message, and payload inside details", async () => {
    mockFetchOnce({ status: "ok", message: "All good", version: "1.2.3" });
    render(<Home />);

    await clickCheckHealth();

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Backend is healthy")).toBeInTheDocument();

    const details = document.querySelector("details");
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute("open");

    const pre = document.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre.textContent).toContain("All good");
    expect(pre.textContent).toContain("1.2.3");
  });

  it("renders payload as text content, not HTML", async () => {
    mockFetchOnce({ status: "ok" });
    render(<Home />);

    await clickCheckHealth();

    const pre = document.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre).not.toHaveAttribute("dangerouslySetInnerHTML");
  });

  it("truncates payloads that are longer than the default limit", async () => {
    const largePayload = {
      status: "ok",
      data: "x".repeat(5000),
    };
    mockFetchOnce(largePayload);
    render(<Home />);

    await clickCheckHealth();

    const pre = document.querySelector("pre");
    expect(pre.textContent).toMatch(/…\(truncated\)$/);
  });

  it("handles deeply nested payloads without error", async () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: "deep" } } } } } } };
    mockFetchOnce(deep);
    render(<Home />);

    await clickCheckHealth();

    const pre = document.querySelector("pre");
    expect(pre.textContent).toContain("[Depth limit reached]");
  });

  it("handles a normal healthy payload end-to-end", async () => {
    mockFetchOnce({ status: "ok", message: "healthy", version: "2.0.0" });
    render(<Home />);

    await clickCheckHealth();

    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Backend is healthy")).toBeInTheDocument();

    const pre = document.querySelector("pre");
    expect(pre.textContent).toContain("healthy");
    expect(pre.textContent).toContain("2.0.0");
  });

  it("does not render health section before check", () => {
    render(<Home />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/view details/i)).not.toBeInTheDocument();
  });
});
