import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();

jest.mock('./WalletContext', () => ({
  useWallet: jest.fn(),
}));

import { useWallet } from './WalletContext';
import WalletStatus, { WALLET_STATES } from './WalletStatus';

expect.extend(toHaveNoViolations);

function mockWalletState(state: string, walletData: any = null) {
  (useWallet as jest.Mock).mockReturnValue({
    state,
    walletData,
    connect: mockConnect,
    disconnect: mockDisconnect,
  });
}

describe('WalletStatus (direct import)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders placeholder on first paint to avoid hydration mismatch', () => {
    mockWalletState(WALLET_STATES.IDLE);
    render(<WalletStatus />);
    expect(screen.getByTestId('wallet-status-placeholder')).toBeInTheDocument();
  });

  it('switches from placeholder to real UI after mount', async () => {
    mockWalletState(WALLET_STATES.IDLE);
    render(<WalletStatus />);

    await waitFor(() => {
      expect(screen.queryByTestId('wallet-status-placeholder')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('wallet-status-button')).toBeInTheDocument();
  });

  it('shows "Connect Wallet" when idle', async () => {
    mockWalletState(WALLET_STATES.IDLE);
    render(<WalletStatus />);

    await waitFor(() => {
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  it('shows truncated address when connected', async () => {
    mockWalletState(WALLET_STATES.CONNECTED, {
      address: 'GABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ',
    });
    render(<WalletStatus />);

    await waitFor(() => {
      expect(screen.getByText(/GABC\.\.\.YZ/)).toBeInTheDocument();
    });
  });

  it('shows "Connecting…" when connecting', async () => {
    mockWalletState(WALLET_STATES.CONNECTING);
    render(<WalletStatus />);

    await waitFor(() => {
      expect(screen.getByText('Connecting…')).toBeInTheDocument();
    });
    expect(screen.getByTestId('wallet-status-button')).toBeDisabled();
  });

  it('calls connect on click when idle', async () => {
    const user = userEvent.setup();
    mockWalletState(WALLET_STATES.IDLE);
    render(<WalletStatus />);

    await waitFor(() => {
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('wallet-status-button'));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('calls disconnect on click when connected', async () => {
    const user = userEvent.setup();
    mockWalletState(WALLET_STATES.CONNECTED, {
      address: 'GABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ',
    });
    render(<WalletStatus />);

    await waitFor(() => {
      expect(screen.getByText(/GABC\.\.\.YZ/)).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('wallet-status-button'));
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('announces status to screen readers', async () => {
    mockWalletState(WALLET_STATES.CONNECTED, { address: 'GABC...XYZ' });
    render(<WalletStatus />);

    await waitFor(() => {
      const status = screen.getByTestId('wallet-aria-status');
      expect(status).toHaveTextContent('Wallet connected.');
    });
  });

  it('has no accessibility violations', async () => {
    mockWalletState(WALLET_STATES.IDLE);
    const { container } = render(<WalletStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('wallet-status-button')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exports stable WALLET_STATES', () => {
    expect(WALLET_STATES.IDLE).toBe('idle');
    expect(WALLET_STATES.CONNECTING).toBe('connecting');
    expect(WALLET_STATES.CONNECTED).toBe('connected');
    expect(WALLET_STATES.ERROR).toBe('error');
  });
});