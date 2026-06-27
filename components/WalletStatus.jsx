"use client";

import { useWallet, WALLET_STATES } from "./WalletProvider";

import { copy } from "../app/copy/en";
import { TRUSTED_WALLET_INSTALL_URL } from "../app/copy/constants";
import Spinner from "./Spinner";

// Wallet connection states
// This is now imported from WalletProvider, but kept here for export stability
const DEPRECATED_WALLET_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
  WRONG_NETWORK: "wrong_network",
  NO_WALLET: "no_wallet",
};

// Mock wallet data for UI development
const mockWalletData = {
  address: "GABC...XYZ123",
  network: "public",
  balance: "1,234.56 XLM",
};

export default function WalletStatus() {
  // Always call the hook unconditionally to satisfy the Rules of Hooks.
  // WalletProvider will be present in the app/tests that render this component.
  const { state, walletData, connect, disconnect } = useWallet();



  /**
   * Safely opens the trusted wallet installation URL in a new tab,
   * mitigating reverse-tabnabbing vulnerabilities by using 'noopener'.
   *
   * This function validates that the URL uses the 'https:' protocol before
   * opening it.
   */
  const handleInstallWallet = () => {
    try {
      const url = new URL(TRUSTED_WALLET_INSTALL_URL);
      // Enforce a strict protocol check, rejecting anything that is not 'https:'.
      if (url.protocol !== "https:") {
        console.error("Blocked insecure wallet installation URL:", url.href);
        return;
      }

      // Invoke window.open() with security features to block reverse-tabnabbing.
      const newWindow = window.open(url.href, "_blank", "noopener,noreferrer");

      // Defensive fallback to protect legacy runtime engines.
      if (newWindow) {
        newWindow.opener = null;
      }
    } catch (e) {
      console.error(
        "Invalid wallet installation URL:",
        TRUSTED_WALLET_INSTALL_URL,
        e,
      );
    }
  };

  const handleClick = () => {
    switch (state) {
      case WALLET_STATES.DISCONNECTED:
      case WALLET_STATES.ERROR:
      case WALLET_STATES.WRONG_NETWORK:
        void connect();
        break;

      case WALLET_STATES.CONNECTED:
        disconnect();
        break;

      case WALLET_STATES.NO_WALLET:
        handleInstallWallet();
        break;

      default:
        break;
    }
  };

  const getButtonText = () => {
    switch (state) {
      case WALLET_STATES.DISCONNECTED:
        return copy.wallet.connectButton;
      case WALLET_STATES.CONNECTING:
        return copy.wallet.connectingButton;
      case WALLET_STATES.CONNECTED:
        return copy.wallet.disconnectButton;
      case WALLET_STATES.ERROR:
        return copy.wallet.retryButton;
      case WALLET_STATES.WRONG_NETWORK:
        return copy.wallet.switchNetworkButton;
      case WALLET_STATES.NO_WALLET:
        return copy.wallet.installWalletButton;
      default:
        return copy.wallet.connectButton;
    }
  };

  const getHelperText = () => {
    switch (state) {
      case WALLET_STATES.DISCONNECTED:
        return copy.wallet.helperDisconnected;
      case WALLET_STATES.CONNECTING:
        return copy.wallet.helperConnecting;
      case WALLET_STATES.CONNECTED:
        return copy.wallet.helperConnected.replace(
          "{network}",
          walletData?.network || "public",
        );
      case WALLET_STATES.ERROR:
        return copy.wallet.helperError;
      case WALLET_STATES.WRONG_NETWORK:
        return copy.wallet.helperWrongNetwork;
      case WALLET_STATES.NO_WALLET:
        return copy.wallet.helperNoWallet;
      default:
        return copy.wallet.helperDisconnected;
    }
  };

  const buttonText = getButtonText();
  const helperText = getHelperText();
  const isConnecting = state === WALLET_STATES.CONNECTING;
  const isDisabled = isConnecting;

  return (
    <div className="flex items-center gap-4">
      <div
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${
          state === WALLET_STATES.CONNECTED ? "bg-emerald-400" : "bg-slate-600"
        } ${isConnecting ? "animate-pulse bg-amber-400" : ""}`}
      />
      <div className="flex flex-col text-left">
        {state === WALLET_STATES.CONNECTED && walletData ? (
          <>
            <span className="text-sm font-mono text-slate-300">
              {walletData.address}
            </span>
            {walletData.balance && (
              <span className="text-xs text-slate-500">
                {walletData.balance}
              </span>
            )}
          </>
        ) : (
          <span
            id="wallet-helper-text"
            className="text-sm text-slate-400 max-w-xs"
          >
            {helperText}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={
          state === WALLET_STATES.NO_WALLET
            ? "Install Stellar Wallet"
            : buttonText
        }
        aria-describedby="wallet-helper-text"
        className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-700/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting && <Spinner className="-ml-1 mr-2" />}
        {buttonText}
      </button>
      <div className="sr-only" role="status" aria-live="polite">
        Wallet status: {state}
        {walletData?.address && `. Connected as ${walletData.address}`}
      </div>
    </div>
  );
}

export { DEPRECATED_WALLET_STATES as WALLET_STATES };
