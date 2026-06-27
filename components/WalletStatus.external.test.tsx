/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider } from "./ToastProvider";
import { WalletProvider, useWallet } from "./WalletProvider";
import WalletStatus from "./WalletStatus";
import { copy } from "../app/copy/en";

function TestHarness() {
  const { state } = useWallet();
  return (
    <div>
      <div data-testid="wallet-state">{state}</div>
      <WalletStatus />
    </div>
  );
}

function renderWithProviders() {
  return render(
    <ToastProvider>
      <WalletProvider>
        <TestHarness />
      </WalletProvider>
    </ToastProvider>,
  );
}

describe("WalletStatus external navigation", () => {
  let openSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let originalUrl: string;

  beforeEach(() => {
    jest.useFakeTimers();
    openSpy = jest.spyOn(window, "open").mockImplementation();
    errorSpy = jest.spyOn(console, "error").mockImplementation();
    jest.spyOn(Math, "random").mockReturnValue(0.8); // index 3 -> 'no_wallet'
    originalUrl = copy.wallet.installWalletUrl;
  });

  afterEach(() => {
    copy.wallet.installWalletUrl = originalUrl;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  async function navigateToNoWalletState() {
    renderWithProviders();
    const button = screen.getByRole("button", { name: /connect wallet/i });
    
    // fireEvent triggers immediately without conflicting with the fake timer queue
    fireEvent.click(button);

    // Advance the mock timers forward to clear the mock delay logic safely
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
  }

  it("opens the trusted wallet URL with noopener and noreferrer", async () => {
    await navigateToNoWalletState();
    
    const installButton = screen.getByRole("button", { name: /install/i });
    fireEvent.click(installButton);

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      copy.wallet.installWalletUrl,
      "_blank",
      "noopener,noreferrer",
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("blocks an insecure (http) URL and logs an error", async () => {
    copy.wallet.installWalletUrl = "http://insecure-wallet-site.com";
    await navigateToNoWalletState();
    
    const installButton = screen.getByRole("button", { name: /install/i });
    fireEvent.click(installButton);

    expect(openSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});