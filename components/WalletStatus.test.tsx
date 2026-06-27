import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WalletStatus from './WalletStatus';
import { isFreighterConnected, connectFreighter, getFreighterNetwork } from '../lib/wallet/freighter';
import { ToastProvider } from './ToastProvider';

jest.mock('../lib/wallet/freighter', () => ({
  isFreighterConnected: jest.fn(),
  connectFreighter: jest.fn(),
  getFreighterNetwork: jest.fn(),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

async function flushTimers(delayMs: number) {
  await act(async () => {
    jest.advanceTimersByTime(delayMs);
    await Promise.resolve();
  });
}

describe.skip("WalletStatus (direct import)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = 'testnet';
  });

  const renderWithToast = (ui: React.ReactElement) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it('connects successfully', async () => {
    (isFreighterConnected as jest.Mock).mockResolvedValue(true);
    (connectFreighter as jest.Mock).mockResolvedValue('GABC...XYZ123');
    (getFreighterNetwork as jest.Mock).mockResolvedValue('testnet');

    renderWithToast(<WalletStatus />);
    
    // Initial state
    const connectBtn = screen.getByRole('button', { name: /Connect Wallet/i });
    fireEvent.click(connectBtn);

    // Connecting state
    expect(screen.getByRole('button', { name: /Connecting/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Disconnect Wallet/i })).toBeInTheDocument();
      // Should show truncated address
      expect(screen.getByText(/GABC\.\.\.XYZ123/)).toBeInTheDocument();
    });
  });

  it('shows error on user rejection', async () => {
    (isFreighterConnected as jest.Mock).mockResolvedValue(true);
    (connectFreighter as jest.Mock).mockRejectedValue(new Error('User rejected connection'));

    renderWithToast(<WalletStatus />);
    
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeInTheDocument();
      const banner = screen.getByTestId('wallet-error-banner');
      expect(banner).toHaveTextContent(/User rejected connection/);
    });
  });

  it('shows wrong network when on public instead of testnet', async () => {
    (isFreighterConnected as jest.Mock).mockResolvedValue(true);
    (connectFreighter as jest.Mock).mockResolvedValue('GABC...XYZ123');
    (getFreighterNetwork as jest.Mock).mockResolvedValue('public');
    
    renderWithToast(<WalletStatus />);
    
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Switch Network/i })).toBeInTheDocument();
      const banner = screen.getByTestId('wallet-error-banner');
      expect(banner).toHaveTextContent(/Connected to public. Please switch to testnet./);
    });
  });

  it('shows install button when wallet not found', async () => {
    (isFreighterConnected as jest.Mock).mockResolvedValue(false);

    renderWithToast(<WalletStatus />);
    
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Install Freighter/i })).toBeInTheDocument();
    });
  });
});
