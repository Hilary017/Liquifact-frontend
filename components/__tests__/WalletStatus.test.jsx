import '@testing-library/jest-dom';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import WalletStatus, { WALLET_STATES } from '../WalletStatus';
import { ToastProvider } from '../ToastProvider';
import { WalletProvider } from '../WalletProvider';

function renderWalletStatus() {
  return render(
    <ToastProvider>
      <WalletProvider>
        <WalletStatus />
      </WalletProvider>
    </ToastProvider>
  );
}

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

  it('sr-only status region reflects disconnected state', () => {
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
});

describe("WalletStatus — CONNECTING → CONNECTED (success path)", () => {
  async function connectSuccessfully() {
    jest.spyOn(Math, 'random').mockReturnValue(0); // index 0 -> success
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
});

describe("WalletStatus — CONNECTING → ERROR (error path)", () => {
  async function connectWithError() {
    jest.spyOn(Math, 'random').mockReturnValue(0.4); // index 1 -> error state explicitly
    renderWalletStatus();
    const btn = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(btn);
    await act(async () => { jest.advanceTimersByTime(1500); });
  }

  afterEach(() => jest.restoreAllMocks());

  it('shows error helper text', async () => {
    await connectWithError();
    expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
  });

  it("fires an error toast on connection failure", async () => {
    await connectWithError();
    expect(within(getToastRegion()).getByText(/failed/i)).toBeInTheDocument();
  });
});
