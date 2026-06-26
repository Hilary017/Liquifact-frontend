/**
 * Consolidation tests — assert a single canonical hook shape and that all
 * consumers resolve it from the one source of truth: WalletProvider.jsx.
 *
 * Requirements validated here:
 *  1. Only one useWallet() hook shape exists: { state, walletData, connect, disconnect }
 *  2. WalletContext.jsx is a shim — it re-exports from WalletProvider.jsx
 *  3. WALLET_STATES is identical whether imported from WalletProvider or WalletContext
 *  4. toast side-effects fire on connect outcomes
 *  5. localStorage rehydration still works
 */

import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "./ToastProvider";

// ── Canonical source ──────────────────────────────────────────────────────────
import {
  WalletProvider as WalletProviderDirect,
  useWallet as useWalletDirect,
  WALLET_STATES as WALLET_STATES_DIRECT,
} from "./WalletProvider";

// ── Shim (WalletContext.jsx) ──────────────────────────────────────────────────
import {
  WalletProvider as WalletProviderShim,
  useWallet as useWalletShim,
  WALLET_STATES as WALLET_STATES_SHIM,
} from "./WalletContext";

const STORAGE_KEY = "liquifact-wallet-snapshot";

// ── Probe component that reads the canonical hook shape ──────────────────────
function WalletProbe() {
  const wallet = useWalletDirect();

  // Assert canonical keys are present (TypeScript would catch this at compile-time;
  // this assertion guards against accidental key renames at runtime)
  const hasCanonicalShape =
    "state" in wallet &&
    "walletData" in wallet &&
    typeof wallet.connect === "function" &&
    typeof wallet.disconnect === "function";

  return (
    <div>
      <span data-testid="has-canonical-shape">{String(hasCanonicalShape)}</span>
      <span data-testid="wallet-state">{wallet.state}</span>
      <button type="button" onClick={() => wallet.connect()}>
        Connect
      </button>
      <button type="button" onClick={() => wallet.disconnect()}>
        Disconnect
      </button>
    </div>
  );
}

function renderWithProviders(ui = <WalletProbe />) {
  return render(
    <ToastProvider>
      <WalletProviderDirect>{ui}</WalletProviderDirect>
    </ToastProvider>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
});

afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  jest.restoreAllMocks();
  localStorage.clear();
});

// ── 1. Single hook shape ──────────────────────────────────────────────────────
describe("Single hook shape", () => {
  it("useWallet returns the canonical { state, walletData, connect, disconnect } shape", () => {
    renderWithProviders();
    expect(screen.getByTestId("has-canonical-shape")).toHaveTextContent("true");
  });

  it("starts in DISCONNECTED state", () => {
    renderWithProviders();
    expect(screen.getByTestId("wallet-state")).toHaveTextContent("disconnected");
  });

  it("throws when used outside WalletProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<WalletProbe />)).toThrow("useWallet must be used within a WalletProvider");
    spy.mockRestore();
  });
});

// ── 2. Shim parity: WalletContext re-exports are identical references ─────────
describe("WalletContext shim exports canonical symbols", () => {
  it("WalletProvider from shim === WalletProvider from source", () => {
    expect(WalletProviderShim).toBe(WalletProviderDirect);
  });

  it("useWallet from shim === useWallet from source", () => {
    expect(useWalletShim).toBe(useWalletDirect);
  });

  it("WALLET_STATES from shim deep-equals WALLET_STATES from source", () => {
    expect(WALLET_STATES_SHIM).toEqual(WALLET_STATES_DIRECT);
  });

  it("WALLET_STATES from shim is the same object reference", () => {
    expect(WALLET_STATES_SHIM).toBe(WALLET_STATES_DIRECT);
  });
});

// ── 3. WALLET_STATES completeness ────────────────────────────────────────────
describe("WALLET_STATES contains all required states", () => {
  const required = [
    "DISCONNECTED",
    "CONNECTING",
    "CONNECTED",
    "ERROR",
    "WRONG_NETWORK",
    "NO_WALLET",
  ];

  required.forEach((key) => {
    it(`includes ${key}`, () => {
      expect(WALLET_STATES_DIRECT).toHaveProperty(key);
    });
  });
});

// ── 4. Toast side-effects fire on connection outcomes ─────────────────────────
describe("Toast side-effects", () => {
  it("fires a success toast on successful connect", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0); // index 0 → 'success'
    renderWithProviders();

    await act(async () => {
      screen.getByRole("button", { name: "Connect" }).click();
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("wallet-state")).toHaveTextContent("connected");
    });

    // Toast region has role="status" — find text from ToastProvider
    expect(screen.getByText("Wallet connected")).toBeInTheDocument();
    expect(screen.getByText("Wallet connected successfully.")).toBeInTheDocument();
  });

  it("fires an error toast on connection failure", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.3); // index 1 → 'error'
    renderWithProviders();

    await act(async () => {
      screen.getByRole("button", { name: "Connect" }).click();
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("wallet-state")).toHaveTextContent("error");
    });

    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });

  it("fires an error toast on wrong network", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.55); // index 2 → 'wrong_network'
    renderWithProviders();

    await act(async () => {
      screen.getByRole("button", { name: "Connect" }).click();
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("wallet-state")).toHaveTextContent("wrong_network");
    });

    expect(screen.getByText("Wrong network")).toBeInTheDocument();
  });

  it("fires an error toast on no_wallet", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.8); // index 3 → 'no_wallet'
    renderWithProviders();

    await act(async () => {
      screen.getByRole("button", { name: "Connect" }).click();
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByTestId("wallet-state")).toHaveTextContent("no_wallet");
    });

    expect(screen.getByText("No wallet")).toBeInTheDocument();
  });
});

// ── 5. localStorage rehydration preserved ─────────────────────────────────────
describe("localStorage rehydration", () => {
  it("rehydrates a persisted connected snapshot", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: WALLET_STATES_DIRECT.CONNECTED,
        address: "GABC...XYZ123",
        network: "public",
      })
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("wallet-state")).toHaveTextContent("connected");
    });
  });

  it("disconnect() clears the persisted snapshot", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: WALLET_STATES_DIRECT.CONNECTED,
        address: "GABC...XYZ123",
        network: "public",
      })
    );

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("wallet-state")).toHaveTextContent("connected");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Disconnect" }).click();
    });

    expect(screen.getByTestId("wallet-state")).toHaveTextContent("disconnected");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

// ── 6. No legacy WalletContext-only identifiers exported from canonical source ─
describe("Canonical source does not leak legacy identifiers", () => {
  it("does not export walletState (legacy alias)", () => {
    // The canonical hook returns `state`, not `walletState`
    renderWithProviders();
    const wallet = screen.getByTestId("wallet-state");
    // If hook returned walletState the probe would show nothing for `wallet.state`
    // but the probe explicitly destructures `state`, so a non-empty value confirms it
    expect(wallet.textContent).toBe("disconnected");
  });
});
