import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { ToastProvider } from './ToastProvider';

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockOpen = jest.fn();

jest.mock('./WalletProvider', () => ({
  ...jest.requireActual('./WalletProvider'),
  useWallet: jest.fn(),
}));

import { useWallet } from './WalletProvider';
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

describe('WalletStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.open for the install wallet flow
    Object.defineProperty(window, 'open', { value: mockOpen, writable: true });
  });

  it('shows "Connect Wallet" when disconnected', async () => {
    mockWalletState(WALLET_STATES.DISCONNECTED);
    render(<WalletStatus />);
    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument();
  });
}

  it('shows "Install Wallet" button when no wallet is detected', () => {
    mockWalletState(WALLET_STATES.NO_WALLET);
    render(<WalletStatus />);
    expect(screen.getByRole('button', { name: 'Install Stellar Wallet' })).toBeInTheDocument();
  });

  it('shows truncated address when connected', async () => {
    mockWalletState(WALLET_STATES.CONNECTED, {
      address: 'GABC...XYZ123',
    });
    render(<WalletStatus />);
    expect(screen.getByText('GABC...XYZ123')).toBeInTheDocument();
  });

  it('shows "Connecting…" when connecting', async () => {
    mockWalletState(WALLET_STATES.CONNECTING);
    render(<WalletStatus />);
    const button = screen.getByRole('button', { name: 'Connecting...' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('calls connect on click when disconnected', async () => {
    const user = userEvent.setup();
    mockWalletState(WALLET_STATES.DISCONNECTED);
    render(<WalletStatus />);
    await user.click(screen.getByRole('button', { name: 'Connect Wallet' }));
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('opens install page on click when in NO_WALLET state', async () => {
    const user = userEvent.setup();
    mockWalletState(WALLET_STATES.NO_WALLET);
    render(
      <ToastProvider>
        <WalletStatus />
      </ToastProvider>,
    );

    const button = screen.getByRole('button', { name: 'Install Stellar Wallet' });
    await user.click(button);
    expect(mockOpen).toHaveBeenCalledWith('https://www.stellar.org/wallets', '_blank', 'noopener,noreferrer');
  });

  it('calls disconnect on click when connected', async () => {
    const user = userEvent.setup();
    mockWalletState(WALLET_STATES.CONNECTED, {
      address: 'GABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ',
    });
    render(<WalletStatus />);
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('announces status to screen readers', async () => {
    mockWalletState(WALLET_STATES.CONNECTED, { address: 'GABC...XYZ' });
    render(<WalletStatus />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Wallet status: connected. Connected as GABC...XYZ');
  });

  it('has no accessibility violations', async () => {
    mockWalletState(WALLET_STATES.DISCONNECTED);
    const { container } = render(<WalletStatus />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('exports stable WALLET_STATES', () => {
    expect(WALLET_STATES.DISCONNECTED).toBe('disconnected');
    expect(WALLET_STATES.CONNECTING).toBe('connecting');
    expect(WALLET_STATES.CONNECTED).toBe('connected');
    expect(WALLET_STATES.ERROR).toBe('error');
    expect(WALLET_STATES.WRONG_NETWORK).toBe('wrong_network');
    expect(WALLET_STATES.NO_WALLET).toBe('no_wallet');
  });
});
