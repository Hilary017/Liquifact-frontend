import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import {
  WalletContext,
  WalletProvider,
  WALLET_STATES,
} from './WalletProvider';
import WalletStatus, { WALLET_STATES as ReExportedStates } from './WalletStatus';

function renderWalletStatus() {
  return render(
    <ToastProvider>
      <WalletProvider>
        <WalletStatus />
      </WalletProvider>
    </ToastProvider>,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
  localStorage.clear();
  jest.restoreAllMocks();
});

describe('WalletStatus', () => {
  it('renders connect wallet in disconnected state', () => {
    renderWalletStatus();

    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
    expect(screen.getByText(/wallet status: disconnected/i)).toBeInTheDocument();
  });

  it('shows connected address after successful connect', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    renderWalletStatus();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
    });
    expect(screen.getByText('GABC...XYZ123')).toBeInTheDocument();
    expect(screen.getByText(/wallet status: connected/i)).toBeInTheDocument();
  });

  it('shows retry UI and toast on connection error', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    renderWalletStatus();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('button', { name: 'Retry Connection' })).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('shows wrong network UI on network mismatch', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);

    renderWalletStatus();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Switch Network' })).toBeInTheDocument();
    });
    expect(screen.getByText(/wallet status: wrong_network/i)).toBeInTheDocument();
    expect(screen.getByText('Wrong network')).toBeInTheDocument();
  });

  it('disconnects and returns to disconnected state', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    renderWalletStatus();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
    expect(screen.getByText(/wallet status: disconnected/i)).toBeInTheDocument();
    expect(localStorage.getItem('liquifact-wallet-snapshot')).toBeNull();
  });

  it('rehydrates connected state from storage without showing connect toast', async () => {
    localStorage.setItem(
      'liquifact-wallet-snapshot',
      JSON.stringify({
        version: 1,
        state: WALLET_STATES.CONNECTED,
        address: 'GABC...XYZ123',
        network: 'public',
      }),
    );

    renderWalletStatus();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Disconnect' })).toBeInTheDocument();
    });
    expect(screen.queryByText('Wallet connected')).not.toBeInTheDocument();
  });

  it('re-exports WALLET_STATES for external consumers', () => {
    expect(ReExportedStates).toEqual(WALLET_STATES);
  });

  it('shows install wallet UI and opens wallet directory for no_wallet state', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ToastProvider>
        <WalletContext.Provider
          value={{
            state: WALLET_STATES.NO_WALLET,
            walletData: null,
            connect: jest.fn(),
            disconnect: jest.fn(),
          }}
        >
          <WalletStatus />
        </WalletContext.Provider>
      </ToastProvider>,
    );

    expect(screen.getByRole('button', { name: 'Install Wallet' })).toBeInTheDocument();
    expect(screen.getByText(/wallet status: no_wallet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Install Wallet' }));
    expect(openSpy).toHaveBeenCalledWith('https://www.stellar.org/wallets', '_blank');

    openSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('shows connecting state while wallet connection is pending', async () => {
    renderWalletStatus();

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));

    expect(screen.getByRole('button', { name: 'Connecting...' })).toBeDisabled();
    expect(screen.getByText(/wallet status: connecting/i)).toBeInTheDocument();
  });

  it('falls back to disconnected UI for unknown wallet states', () => {
    render(
      <ToastProvider>
        <WalletContext.Provider
          value={{
            state: 'unknown_state',
            walletData: null,
            connect: jest.fn().mockResolvedValue({ outcome: 'mystery' }),
            disconnect: jest.fn(),
          }}
        >
          <WalletStatus />
        </WalletContext.Provider>
      </ToastProvider>,
    );

    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
  });

  it('ignores unknown connect outcomes without showing a toast', async () => {
    const connect = jest.fn().mockResolvedValue({ outcome: 'mystery' });

    render(
      <ToastProvider>
        <WalletContext.Provider
          value={{
            state: WALLET_STATES.DISCONNECTED,
            walletData: null,
            connect,
            disconnect: jest.fn(),
          }}
        >
          <WalletStatus />
        </WalletContext.Provider>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect Wallet' }));

    await waitFor(() => expect(connect).toHaveBeenCalled());
    expect(screen.queryByText('Wallet connected')).not.toBeInTheDocument();
    expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
  });
});
