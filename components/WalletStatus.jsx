'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';
import { copy } from '../app/copy/en';

// Wallet connection states
const WALLET_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  WRONG_NETWORK: 'wrong_network',
  NO_WALLET: 'no_wallet',
};

// Mock wallet data for UI development
const mockWalletData = {
  address: 'GABC...XYZ123',
  network: 'public',
  balance: '1,234.56 XLM',
};

export default function WalletStatus() {
  const [walletState, setWalletState] = useState(WALLET_STATES.DISCONNECTED);
  const [walletData, setWalletData] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();

  const connectWallet = async () => {
    setWalletState(WALLET_STATES.CONNECTING);
    setError(null);

    // Mock connection process - replace with actual wallet integration
    setTimeout(() => {
      // Simulate different scenarios for testing
      const scenarios = ['success', 'error', 'wrong_network'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

      switch (scenario) {
        case 'success':
          setWalletState(WALLET_STATES.CONNECTED);
          setWalletData(mockWalletData);
          toast.success(copy.wallet.toastConnectedMsg, copy.wallet.toastConnectedTitle);
          break;
        case 'error':
          setWalletState(WALLET_STATES.ERROR);
          setError(copy.wallet.errorConnect);
          toast.error(copy.wallet.toastErrorMsg, copy.wallet.toastErrorTitle);
          break;
        case 'wrong_network':
          setWalletState(WALLET_STATES.WRONG_NETWORK);
          setError(copy.wallet.errorWrongNetwork);
          toast.error(copy.wallet.toastWrongNetworkMsg, copy.wallet.toastWrongNetworkTitle);
          break;
      }
    }, 1500);
  };

  const disconnectWallet = () => {
    setWalletState(WALLET_STATES.DISCONNECTED);
    setWalletData(null);
    setError(null);
  };

  const getStateConfig = (state) => {
    switch (state) {
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
          buttonText: copy.wallet.connectingButton,
          buttonVariant: 'loading',
          helperText: copy.wallet.helperConnecting,
          disabled: true,
          showAddress: false,
        };

      case WALLET_STATES.CONNECTED:
        return {
          buttonText: copy.wallet.disconnectButton,
          buttonVariant: 'secondary',
          helperText: copy.wallet.helperConnected.replace('{network}', walletData?.network || 'public'),
          disabled: false,
          showAddress: true,
        };

      case WALLET_STATES.ERROR:
        return {
          buttonText: copy.wallet.retryButton,
          buttonVariant: 'primary',
          helperText: error || copy.wallet.helperError,
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

  const config = getStateConfig(walletState);

  const getButtonStyles = (variant) => {
    const baseStyles =
      'rounded-full px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950';

    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 focus:ring-cyan-500 ${config.disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

      case 'secondary':
        return `${baseStyles} border border-slate-600 text-slate-300 hover:bg-slate-800 focus:ring-slate-500`;

      case 'loading':
        return `${baseStyles} bg-cyan-500/30 text-cyan-300 cursor-wait`;

      case 'warning':
        return `${baseStyles} bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 focus:ring-amber-500`;

      case 'external':
        return `${baseStyles} bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 focus:ring-violet-500`;

      default:
        return getButtonStyles('primary');
    }
  };

  const handleClick = () => {
    switch (walletState) {
      case WALLET_STATES.DISCONNECTED:
      case WALLET_STATES.ERROR:
      case WALLET_STATES.WRONG_NETWORK:
        connectWallet();
        break;

      case WALLET_STATES.CONNECTED:
        disconnectWallet();
        break;

      case WALLET_STATES.NO_WALLET:
        window.open('https://www.stellar.org/wallets', '_blank');
        break;

      default:
        break;
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div
          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
            walletState === WALLET_STATES.CONNECTED
              ? 'bg-green-500'
              : walletState === WALLET_STATES.CONNECTING
                ? 'bg-yellow-500 animate-pulse'
                : walletState === WALLET_STATES.ERROR || walletState === WALLET_STATES.WRONG_NETWORK
                  ? 'bg-red-500'
                  : 'bg-slate-600'
          }`}
          aria-hidden="true"
        />

        {/* Wallet address or helper text */}
        {config.showAddress && walletData ? (
          <div className="flex flex-col">
            <span className="text-sm font-mono text-slate-300">{walletData.address}</span>
            <span className="text-xs text-slate-500">{walletData.balance}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400 max-w-xs">{config.helperText}</span>
        )}
      </div>

      <Button
        variant={config.variant}
        loading={config.loading}
        disabled={config.disabled}
        onClick={handleClick}
        aria-label={config.buttonText}
        aria-describedby="wallet-helper-text"
      >
        {walletState === WALLET_STATES.CONNECTING && (
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

      <div className="sr-only" role="status" aria-live="polite">
        Wallet status:
        {' '}
        {walletState}
        {walletData?.address && `. Connected as ${walletData.address}`}
        {error && `. Error: ${error}`}
      </div>

      <div id="wallet-helper-text" className="sr-only">
        {config.helperText}
      </div>
    </div>
  );
}

export { WALLET_STATES };