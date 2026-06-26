import "@testing-library/jest-dom";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import WalletStatus, { WALLET_STATES } from "../WalletStatus";
import { ToastProvider } from "../ToastProvider";
import { WalletProvider } from "../WalletContext";

// Render with ToastProvider + WalletProvider since WalletStatus calls useWallet
// and WalletProvider calls useToast internally
function renderWalletStatus() {
  return render(
    <ToastProvider>
      <WalletProvider>
        <WalletStatus />
      </WalletProvider>
    </ToastProvider>
  );
}

// The WalletStatus sr-only status div is the first role="status" in DOM.
// The ToastProvider status container is the second.
function getWalletStatusRegion() {
  return screen.getAllByRole("status")[0];
}

function getToastRegion() {
  return screen.getAllByRole("status")[1];
}

beforeEach(() => {
  jest.useFakeTimers();
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});

afterEach(() => {
  jest.useRealTimers();
});

describe("WalletStatus — initial (disconnected) state", () => {
  it('renders "Connect Wallet" button when disconnected', () => {
    renderWalletStatus();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("shows the helper text for disconnected state", () => {
    renderWalletStatus();
    expect(
      screen.getByText("Connect your Stellar wallet to access the platform", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("button is enabled when disconnected", () => {
    renderWalletStatus();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeEnabled();
  });

  it("sr-only status region reflects disconnected state", () => {
    renderWalletStatus();
    expect(getWalletStatusRegion()).toHaveTextContent(/disconnected/i);
  });
});

describe("WalletStatus — DISCONNECTED → CONNECTING transition", () => {
  it("transitions to connecting state immediately on click", () => {
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(screen.getByRole("button", { name: /connecting/i })).toBeInTheDocument();
  });

  it("disables the button while connecting", () => {
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(screen.getByRole("button", { name: /connecting/i })).toBeDisabled();
  });

  it("shows helper text prompting wallet approval while connecting", () => {
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(
      screen.getByText("Please approve the connection in your wallet", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("sr-only status region reflects connecting state", () => {
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    expect(getWalletStatusRegion()).toHaveTextContent(/connecting/i);
  });
});

describe("WalletStatus — CONNECTING → CONNECTED (success path)", () => {
  async function connectSuccessfully() {
    jest.spyOn(Math, "random").mockReturnValue(0); // index 0 → 'success'
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
  }

  afterEach(() => jest.restoreAllMocks());

  it('shows "Disconnect" button after successful connection', async () => {
    await connectSuccessfully();
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
  });

  it("displays the wallet address after successful connection", async () => {
    await connectSuccessfully();
    expect(screen.getByText(/GABC/, { selector: "span" })).toBeInTheDocument();
  });

  it("displays the wallet balance after successful connection", async () => {
    await connectSuccessfully();
    expect(screen.getByText(/XLM/, { selector: "span" })).toBeInTheDocument();
  });

  it("fires a success toast with correct title", async () => {
    await connectSuccessfully();
    expect(within(getToastRegion()).getByText("Wallet connected")).toBeInTheDocument();
  });

  it("fires a success toast with correct message", async () => {
    await connectSuccessfully();
    expect(
      within(getToastRegion()).getByText("Wallet connected successfully.")
    ).toBeInTheDocument();
  });

  it("sr-only status region reflects connected state", async () => {
    await connectSuccessfully();
    expect(getWalletStatusRegion()).toHaveTextContent(/connected/i);
  });
});

describe("WalletStatus — CONNECTING → ERROR (error path)", () => {
  async function connectWithError() {
    jest.spyOn(Math, "random").mockReturnValue(0.4); // index 1 → 'error'
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
  }

  afterEach(() => jest.restoreAllMocks());

  it('shows "Retry Connection" button on error', async () => {
    await connectWithError();
    expect(screen.getByRole("button", { name: /retry connection/i })).toBeInTheDocument();
  });

  it("shows error helper text", async () => {
    await connectWithError();
    expect(
      screen.getByText(/failed to connect to wallet/i, { selector: "span" })
    ).toBeInTheDocument();
  });

  it("fires an error toast on connection failure", async () => {
    await connectWithError();
    expect(within(getToastRegion()).getByText(/connection failed/i)).toBeInTheDocument();
  });

  it("renders inline error banner with appropriate styling and accessibility", async () => {
    await connectWithError();
    const errorBanner = screen.getByTestId("wallet-error-banner");
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveAttribute("role", "alert");
    expect(errorBanner).toHaveAttribute("aria-live", "assertive");
  });

  it("displays error message in inline error banner", async () => {
    await connectWithError();
    const banner = screen.getByTestId("wallet-error-banner");
    expect(within(banner).getByText(/Failed to connect to wallet/)).toBeInTheDocument();
  });

  it("error banner persists when button remains visible", async () => {
    await connectWithError();
    expect(screen.getByTestId("wallet-error-banner")).toBeInTheDocument();
    // Even though toast auto-dismisses, banner should persist
    expect(screen.getByTestId("wallet-error-banner")).toBeVisible();
  });

  it("sr-only status region includes error details", async () => {
    await connectWithError();
    expect(getWalletStatusRegion()).toHaveTextContent(/error/i);
    expect(getWalletStatusRegion()).toHaveTextContent(/Failed to connect to wallet/);
  });

  it("retry button triggers another connecting attempt and clears error on success", async () => {
    await connectWithError();
    // First error banner should be visible
    expect(screen.getByTestId("wallet-error-banner")).toBeInTheDocument();

    // Mock successful retry
    jest.spyOn(Math, "random").mockReturnValue(0);
    fireEvent.click(screen.getByRole("button", { name: /retry connection/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    // Error banner should be gone after successful retry
    expect(screen.queryByTestId("wallet-error-banner")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
  });
});

describe("WalletStatus — CONNECTING → WRONG_NETWORK (wrong network path)", () => {
  async function connectWithWrongNetwork() {
    jest.spyOn(Math, "random").mockReturnValue(0.7); // index 2 → 'wrong_network'
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
  }

  afterEach(() => jest.restoreAllMocks());

  it('shows "Switch Network" button on wrong network', async () => {
    await connectWithWrongNetwork();
    expect(screen.getByRole("button", { name: /switch network/i })).toBeInTheDocument();
  });

  it("shows wrong-network helper text", async () => {
    await connectWithWrongNetwork();
    expect(
      screen.getByText("Please switch to the Stellar public network", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("fires an error toast for wrong network", async () => {
    await connectWithWrongNetwork();
    expect(within(getToastRegion()).getByText(/wrong network/i)).toBeInTheDocument();
  });

  it("renders inline error banner for wrong network state", async () => {
    await connectWithWrongNetwork();
    const errorBanner = screen.getByTestId("wallet-error-banner");
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveAttribute("role", "alert");
  });

  it("displays wrong network error message in inline error banner", async () => {
    await connectWithWrongNetwork();
    const banner = screen.getByTestId("wallet-error-banner");
    expect(within(banner).getByText(/Wallet is connected to testnet/)).toBeInTheDocument();
  });

  it("sr-only status region reflects wrong_network state and error", async () => {
    await connectWithWrongNetwork();
    expect(getWalletStatusRegion()).toHaveTextContent(/wrong_network/i);
    expect(getWalletStatusRegion()).toHaveTextContent(/Wallet is connected to testnet/);
  });

  it("error banner clears after successful reconnection from wrong network", async () => {
    await connectWithWrongNetwork();
    expect(screen.getByTestId("wallet-error-banner")).toBeInTheDocument();

    // Mock successful retry
    jest.spyOn(Math, "random").mockReturnValue(0);
    fireEvent.click(screen.getByRole("button", { name: /switch network/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    // Error banner should disappear
    expect(screen.queryByTestId("wallet-error-banner")).not.toBeInTheDocument();
  });
});

describe("WalletStatus — CONNECTED → DISCONNECTED (disconnect path)", () => {
  async function connectAndDisconnect() {
    jest.spyOn(Math, "random").mockReturnValue(0);
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    fireEvent.click(screen.getByRole("button", { name: /disconnect/i }));
  }

  afterEach(() => jest.restoreAllMocks());

  it('returns to "Connect Wallet" button after disconnect', async () => {
    await connectAndDisconnect();
    expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
  });

  it("hides wallet address after disconnect", async () => {
    await connectAndDisconnect();
    expect(screen.queryByText(/GABC/, { selector: "span" })).not.toBeInTheDocument();
  });

  it("sr-only status region reflects disconnected state after disconnect", async () => {
    await connectAndDisconnect();
    expect(getWalletStatusRegion()).toHaveTextContent(/disconnected/i);
  });
});

describe("WalletStatus — ERROR → DISCONNECTED (error then disconnect)", () => {
  async function connectWithErrorThenDisconnect() {
    jest.spyOn(Math, "random").mockReturnValue(0.4); // index 1 → 'error'
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    fireEvent.click(screen.getByRole("button", { name: /retry connection/i })); // This acts as retry in error state
  }

  afterEach(() => jest.restoreAllMocks());

  it("clears error banner when transitioning from ERROR to CONNECTING", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.4);
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    // Error banner should be visible in ERROR state
    expect(screen.getByTestId("wallet-error-banner")).toBeInTheDocument();

    // Click to retry
    fireEvent.click(screen.getByRole("button", { name: /retry connection/i }));

    // Error banner should clear when moving to CONNECTING state
    expect(screen.queryByTestId("wallet-error-banner")).not.toBeInTheDocument();
  });
});

describe("WalletStatus — WRONG_NETWORK → DISCONNECTED (wrong network then disconnect)", () => {
  async function connectWithWrongNetworkThenDisconnect() {
    jest.spyOn(Math, "random").mockReturnValue(0.7);
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
  }

  afterEach(() => jest.restoreAllMocks());

  it("error banner persists in WRONG_NETWORK until user action", async () => {
    await connectWithWrongNetworkThenDisconnect();
    expect(screen.getByTestId("wallet-error-banner")).toBeInTheDocument();
  });

  it("clears error banner after button click (switching network, simulated by retry)", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.7);
    renderWalletStatus();
    fireEvent.click(screen.getByRole("button", { name: /connect wallet/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId("wallet-error-banner")).toBeInTheDocument();

    // Simulate user retrying after switching network
    jest.spyOn(Math, "random").mockReturnValue(0);
    fireEvent.click(screen.getByRole("button", { name: /switch network/i }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    // Error banner should clear after success
    expect(screen.queryByTestId("wallet-error-banner")).not.toBeInTheDocument();
  });
});

describe("WalletStatus — EXPORTS", () => {
  it("exports WALLET_STATES with all expected state keys", () => {
    expect(WALLET_STATES).toMatchObject({
      DISCONNECTED: "disconnected",
      CONNECTING: "connecting",
      CONNECTED: "connected",
      ERROR: "error",
      WRONG_NETWORK: "wrong_network",
      NO_WALLET: "no_wallet",
    });
  });
});
