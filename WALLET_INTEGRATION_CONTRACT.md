# Wallet Integration Contract

## Overview

This document outlines the contract for implementing actual Stellar wallet integration in the Liquifact frontend. The current UI implementation uses mock data and states for development and testing.

## Current Implementation Status

- ✅ UI state machine with 6 connection states
- ✅ Accessibility features (ARIA labels, screen reader support)
- ✅ Responsive design
- ✅ Helper text and error messaging
- ✅ Visual status indicators
- ✅ Persistent inline error banner for ERROR/WRONG_NETWORK states
- ❌ Actual wallet connection logic (mocked)

## Wallet States

```javascript
const WALLET_STATES = {
  DISCONNECTED: "disconnected", // Initial state, wallet not connected
  CONNECTING: "connecting", // Connection in progress
  CONNECTED: "connected", // Successfully connected
  ERROR: "error", // Connection failed
  WRONG_NETWORK: "wrong_network", // Connected to wrong network
  NO_WALLET: "no_wallet", // No wallet detected
};
```

## Required Implementation

### 1. Wallet Detection

- Check for installed Stellar wallets (Freighter, Albedo, etc.)
- Update `NO_WALLET` state based on detection

### 2. Connection Logic

Replace the mock `connectWallet()` function with actual wallet integration:

```javascript
const connectWallet = async () => {
  // TODO: Implement actual wallet connection
  // 1. Detect available wallets
  // 2. Request connection
  // 3. Get account info
  // 4. Verify network (public vs testnet)
  // 5. Handle errors appropriately
};
```

### 3. Wallet Data Structure

Expected wallet data shape:

```javascript
const walletData = {
  address: "G...", // Stellar public key
  network: "public", // 'public' or 'testnet'
  balance: "1,234.56 XLM", // Formatted balance string
  walletType: "freighter", // Wallet provider name
};
```

### 4. Network Verification

- Check if connected wallet is on correct network (public mainnet)
- Update `WRONG_NETWORK` state if on testnet
- Provide network switching guidance

### 5. Error Handling

- Handle wallet rejection (user cancels)
- Handle network errors
- Handle insufficient permissions
- Update `ERROR` state with appropriate messages

## Supported Wallets

Target wallets for integration:

1. **Freighter** (primary)
2. **Albedo** (secondary)
3. **Rabet** (tertiary)

## Integration Points

### Component Interface

`WalletStatus` is a presentational consumer of `useWallet()` from `WalletProvider`. The shared hook exposes:

- `state` - Current connection state
- `walletData` - Connected wallet information (balance is runtime-only, not persisted)
- `connect()` - Initiate connection (returns `{ outcome, message? }`)
- `disconnect()` - Terminate connection and clear persisted snapshot

### Error Banner Lifecycle

When the wallet enters `ERROR` or `WRONG_NETWORK` states:

1. **Display**: An inline error banner (`role="alert"`, `aria-live="assertive"`) is rendered above the main wallet status UI
2. **Content**: The banner displays the specific error message (e.g., "Failed to connect to wallet. Please try again." or "Wallet is connected to testnet. Please switch to public network.")
3. **Persistence**: Unlike the auto-dismissing toast notification, the banner remains visible as long as the wallet is in an error state
4. **Clearing**: The banner is removed when:
   - User retries and the connection succeeds (→ CONNECTED state)
   - User retries and reaches a different error state (error message updates)
   - User performs another action that transitions the wallet state

### Error Messaging Strategy

- **Toast**: Provides immediate, prominent feedback when an error occurs (auto-dismisses after a few seconds)
- **Inline Banner**: Provides persistent visibility for users who may have missed the toast or need to reference the error
- **SR-only Status**: Announces the error to screen reader users without duplicating the visible banner

This multi-layered approach ensures:

- Immediate notice via toast
- Persistent reference via inline banner
- Accessible announcements for screen readers

### Global State Management

`WalletProvider` (see `components/WalletProvider.jsx`) is the **single source of truth** for wallet state. It is mounted once in `app/layout.js` and persists a minimal, non-sensitive snapshot to `localStorage` so the UI can rehydrate after reload.

```javascript
// Persisted snapshot shape (liquifact-wallet-snapshot)
{
  version: 1,
  state: 'connected',
  address: 'GABC...XYZ123', // truncated only
  network: 'public'
}
```

Never persist balances, private keys, or full signing material. `WalletStatus` consumes `useWallet()` from `WalletProvider`.

> **Note:** `components/WalletContext.jsx` is a deprecated compatibility shim that re-exports everything from `WalletProvider.jsx`. All new code should import directly from `@/components/WalletProvider`.

Use global state for:

- Wallet connection status across app
- Transaction signing
- Network operations

## Security Considerations

- Validate Stellar addresses
- Verify network before transactions
- Secure storage of connection state
- Handle wallet disconnection gracefully

## Testing Requirements

- Test all wallet states
- Test connection flow end-to-end
- Test error scenarios
- Test network switching
- Test multiple wallet types

## Dependencies

Add required wallet SDKs:

```bash
npm install @stellar/freighter-api
# Other wallet SDKs as needed
```

## Next Steps

1. Install wallet SDKs
2. Implement actual connection logic
3. Add transaction signing capabilities
4. Test with real wallets
5. Update documentation with real wallet flows
