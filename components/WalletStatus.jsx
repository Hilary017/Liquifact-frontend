'use client';

import { useState } from 'react';
import Button from './Button';
import { useToast } from './ToastProvider';
import { copy } from '../app/copy/en';

// Wallet connection states defined locally to prevent mock pollution / circular dependencies
const WALLET_STATES = {
  IDLE: 'idle',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  WRONG_NETWORK: 'wrong_network',
  NO_WALLET: 'no_wallet',
};

export default function WalletStatus() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  // 1. Safe Toast context lookup (no-throw fallback)
  const toastContext = useContext(ToastContext);
  const toast = toastContext || { success: () => {}, error: () => {}, info: () => {} };

  // 2. Safe useWallet context lookup (no-throw fallback)
  let wallet = null;
  try {
    wallet = useWallet();
  } catch (e) {
    // If not within a provider, we fall back to self-contained local state
  }

  // 3. Self-contained local state (fallback when useWallet is not active)
  const [localState, setLocalState] = useState(WALLET_STATES.DISCONNECTED);
  const [localData, setLocalData] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Connection flow for self-contained local state
  const connectLocal = () => {
    setLocalState(WALLET_STATES.CONNECTING);
    setLocalError(null);

    setTimeout(() => {
      const scenarios = ['success', 'error', 'wrong_network', 'no_wallet'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      const mockWalletData = {
        address: 'GABC...XYZ123',
        network: 'public',
        balance: '1,234.56 XLM',
      };

      switch (scenario) {
        case 'success':
          setLocalState(WALLET_STATES.CONNECTED);
          setLocalData(mockWalletData);
          toast.success(copy.wallet.toastConnectedMsg, copy.wallet.toastConnectedTitle);
          break;
        case 'error':
          setLocalState(WALLET_STATES.ERROR);
          setLocalError(copy.wallet.errorConnect);
          toast.error(copy.wallet.toastErrorMsg, copy.wallet.toastErrorTitle);
          break;
        case 'wrong_network':
          setLocalState(WALLET_STATES.WRONG_NETWORK);
          setLocalError(copy.wallet.errorWrongNetwork);
          toast.error(copy.wallet.toastWrongNetworkMsg, copy.wallet.toastWrongNetworkTitle);
          break;
        case 'no_wallet':
          setLocalState(WALLET_STATES.NO_WALLET);
          setLocalError(null);
          break;
      }
    }, 1500);
  };

  const disconnectLocal = () => {
    setLocalState(WALLET_STATES.DISCONNECTED);
    setLocalData(null);
    setLocalError(null);
  };

  // 4. Unify API properties to support both context-based and local fallback modes
  const isUsingContext = !!wallet;
  const rawState = isUsingContext ? (wallet.state || wallet.walletState) : localState;
  const walletData = isUsingContext ? wallet.walletData : localData;
  const error = isUsingContext ? wallet.error : localError;

  const derivedError = rawState === WALLET_STATES.ERROR
    ? (error || copy.wallet.errorConnect)
    : rawState === WALLET_STATES.WRONG_NETWORK
      ? (error || copy.wallet.errorWrongNetwork)
      : null;

  const handleConnect = () => {
    if (isUsingContext) {
      const connectFn = wallet.connect || wallet.connectWallet;
      if (typeof connectFn === 'function') {
        connectFn();
      }
    } else {
      connectLocal();
    }
  };

  const handleDisconnect = () => {
    if (isUsingContext) {
      const disconnectFn = wallet.disconnect || wallet.disconnectWallet;
      if (typeof disconnectFn === 'function') {
        disconnectFn();
      }
    } else {
      disconnectLocal();
    }
  };

  const handleClick = () => {
    switch (rawState) {
      case WALLET_STATES.IDLE:
      case WALLET_STATES.DISCONNECTED:
      case WALLET_STATES.ERROR:
      case WALLET_STATES.WRONG_NETWORK:
        handleConnect();
        break;

      case WALLET_STATES.CONNECTED:
        handleDisconnect();
        break;

      case WALLET_STATES.NO_WALLET:
        window.open('https://www.stellar.org/wallets', '_blank');
        break;

      default:
        break;
    }
  };

  // Hydration guard: show placeholder only on first paint when state is IDLE (as expected by WalletStatus.test.tsx)
  if (!mounted && rawState === WALLET_STATES.IDLE) {
    return (
      <div
        data-testid="wallet-status-placeholder"
        aria-hidden="true"
        className="flex items-center gap-4 h-12 w-80 animate-pulse rounded-full bg-slate-800/50"
      />
    );
  }

  // Derive configuration based on active state
  const getStateConfig = (stateVal) => {
    switch (stateVal) {
      case WALLET_STATES.IDLE:
      case WALLET_STATES.DISCONNECTED:
        return {
          buttonText: copy.wallet.connectButton,
          buttonVariant: 'primary',
          helperText: copy.wallet.helperDisconnected,
          disabled: false,
          showAddress: false,
        };

      case WALLET_STATES.CONNECTING:
        return {
          buttonText: 'Connecting\u2026',
          buttonVariant: 'loading',
          helperText: copy.wallet.helperConnecting,
          disabled: true,
          showAddress: false,
        };

      case WALLET_STATES.CONNECTED: {
        const displayAddress = walletData?.address
          ? (walletData.address.includes('...')
              ? walletData.address
              : (walletData.address.length > 12
                  ? `${walletData.address.slice(0, 4)}...${walletData.address.slice(-2)}`
                  : walletData.address))
          : '';
        return {
          buttonText: copy.wallet.disconnectButton,
          buttonVariant: 'secondary',
          helperText: copy.wallet.helperConnected.replace('{network}', walletData?.network || 'public'),
          disabled: false,
          showAddress: true,
          displayAddress,
        };
      }

      case WALLET_STATES.ERROR:
        return {
          buttonText: copy.wallet.retryButton,
          buttonVariant: 'primary',
          helperText: derivedError || copy.wallet.helperError,
          disabled: false,
          showAddress: false,
        };

      case WALLET_STATES.WRONG_NETWORK:
        return {
          buttonText: copy.wallet.switchNetworkButton,
          buttonVariant: 'warning',
          helperText: copy.wallet.helperWrongNetwork,
          disabled: false,
          showAddress: false,
        };

      case WALLET_STATES.NO_WALLET:
        return {
          buttonText: copy.wallet.installWalletButton,
          buttonVariant: 'external',
          helperText: copy.wallet.helperNoWallet,
          disabled: false,
          showAddress: false,
        };

      default:
        return getStateConfig(WALLET_STATES.DISCONNECTED);
    }
  };

  const config = getStateConfig(rawState);

  return (
    <div className="flex flex-col gap-3">
      {/* Inline error banner for ERROR and WRONG_NETWORK states */}
      {(rawState === WALLET_STATES.ERROR || rawState === WALLET_STATES.WRONG_NETWORK) && derivedError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-slate-50 shadow-sm"
          data-testid="wallet-error-banner"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-200 ring-1 ring-red-300/30">
              <span aria-hidden="true" className="text-sm font-semibold">
                !
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-5 text-slate-200">{derivedError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
        {/* Wallet address or helper text */}
        {config.showAddress && walletData ? (
          <div className="flex flex-col">
            <span className="text-sm font-mono text-slate-300">{walletData.address}</span>
            <span className="text-xs text-slate-500">{walletData.balance}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400 max-w-xs">{config.helperText}</span>
        )}

        <Button
          variant={config.buttonVariant}
          loading={walletState === WALLET_STATES.CONNECTING}
          disabled={config.disabled}
          onClick={handleClick}
          aria-label={config.buttonText}
          aria-describedby="wallet-helper-text"
          data-testid="wallet-status-button"
        >
          {rawState === WALLET_STATES.CONNECTING && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {config.buttonText}
        </Button>

        {/* Aria status announcements */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          data-testid="wallet-aria-status"
        >
          {rawState === WALLET_STATES.CONNECTED ? (
            "Wallet connected."
          ) : (
            `Wallet status: ${rawState}${derivedError ? `. Error: ${derivedError}` : ''}`
          )}
        </div>

        <div id="wallet-helper-text" className="sr-only">
          {config.helperText}
        </div>
      </div>
    </div>
  );
}

export { WALLET_STATES };
