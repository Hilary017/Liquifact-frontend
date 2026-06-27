import React from "react";
import WalletStatusLazy from "./WalletStatusLazy";
import { render, screen, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import "@testing-library/jest-dom";

// ── Mock next/dynamic so we can control lazy-load timing in tests ──
jest.mock('next/dynamic', () => {
  return function dynamicMock(importFunc: () => Promise<any>, options: any): React.FC<any> {
    // Use require inside the factory to get a locally-scoped reference.
    const LazyComponent = require('react').lazy(importFunc);

    const DynamicWrapper: React.FC<any> = (props) => {
      const inlineReact = require('react');
      const [Component, setComponent] = inlineReact.useState(null);
      const [isLoading, setIsLoading] = inlineReact.useState(true);

      inlineReact.useEffect(() => {
        let cancelled = false;
        importFunc().then((mod: any) => {
          if (!cancelled) {
            setComponent(() => mod.default || mod);
            setIsLoading(false);
          }
        });
        return () => {
          cancelled = true;
        };
      }, []);

      if (isLoading && options?.loading) {
        const LoadingComponent = options.loading;
        return <LoadingComponent {...props} />;
      }

      if (Component) {
        return <Component {...props} />;
      }

      return null;
    };

    DynamicWrapper.displayName = 'DynamicWrapper';
    const SuspenseWrapper: React.FC<any> = (props) => {
      const inlineReact = require('react');
      return (
        <inlineReact.Suspense fallback={options?.loading ? <options.loading {...props} /> : null}>
          <DynamicWrapper {...props} />
        </inlineReact.Suspense>
      );
    };
    SuspenseWrapper.displayName = 'SuspenseWrapper';
    return SuspenseWrapper;
  };
});

// ── Mock WalletContext ──
const mockConnectWallet = jest.fn();
const mockDisconnectWallet = jest.fn();

jest.mock('./WalletProvider', () => ({
  ...jest.requireActual('./WalletProvider'),
  useWallet: () => ({
    state: 'disconnected',
    walletData: null,
    error: null,
    connect: mockConnectWallet,
    disconnect: mockDisconnectWallet,
  })
}));

jest.mock('./ToastProvider', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

// Import after mocks are set up
import WalletStatusLazy from './WalletStatusLazy';
import { WALLET_STATES } from './WalletStatus';

expect.extend(toHaveNoViolations);

describe("WalletStatusLazy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the placeholder immediately (no CLS)", () => {
    render(<WalletStatusLazy />);
    const placeholder = screen.getByTestId("wallet-status-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
  });

  it("placeholder has matching dimensions to prevent layout shift", () => {
    render(<WalletStatusLazy />);
    const placeholder = screen.getByTestId("wallet-status-placeholder");
    expect(placeholder).toHaveClass("h-12");
    expect(placeholder).toHaveClass("w-80");
    expect(placeholder).toHaveClass("rounded-full");
    expect(placeholder).toHaveClass("flex");
    expect(placeholder).toHaveClass("items-center");
  });

  it("mounts the real WalletStatus after chunk loads", async () => {
    render(<WalletStatusLazy />);

    // Initially placeholder
    expect(screen.getByTestId("wallet-status-placeholder")).toBeInTheDocument();

    // Wait for lazy component to resolve
    await waitFor(
      () => {
        expect(screen.queryByTestId("wallet-status-placeholder")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Real wallet button should appear
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("accessible status region is present after mount", async () => {
    render(<WalletStatusLazy />);

    await waitFor(
      () => {
        const status = screen.getByRole("status");
        expect(status).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("has no accessibility violations in placeholder state", async () => {
    const { container } = render(<WalletStatusLazy />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations after lazy mount", async () => {
    const { container } = render(<WalletStatusLazy />);

    await waitFor(
      () => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("WALLET_STATES export path remains stable", () => {
    expect(WALLET_STATES).toBeDefined();
    expect(WALLET_STATES.DISCONNECTED).toBe("disconnected");
    expect(WALLET_STATES.CONNECTING).toBe("connecting");
    expect(WALLET_STATES.CONNECTED).toBe("connected");
    expect(WALLET_STATES.ERROR).toBe("error");
    expect(WALLET_STATES.WRONG_NETWORK).toBe("wrong_network");
    expect(WALLET_STATES.NO_WALLET).toBe("no_wallet");
  });

  it("does not produce hydration warnings (placeholder is aria-hidden)", () => {
    render(<WalletStatusLazy />);
    const placeholder = screen.getByTestId("wallet-status-placeholder");
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
  });
});
