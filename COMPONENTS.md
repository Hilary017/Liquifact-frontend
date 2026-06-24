# Component Library Reference

Shared UI components for the LiquiFact frontend. All components live under `components/`.

---

## Table of Contents

- [ErrorBanner](#errorbanner)
- [Footer](#footer)
- [InvoiceListSkeleton](#invoicelistskeleton)
- [NavMenu](#navmenu)
- [ToastProvider / useToast](#toastprovider--usetoast)
- [UploadZone](#uploadzone)
- [WalletStatus](#walletstatus)

---

## ErrorBanner

Displays a structured error message with a variant label, title, description, optional details, and an optional action button.

**File:** `components/ErrorBanner.jsx`

### Props

| Prop           | Type       | Default          | Description                                             |
| -------------- | ---------- | ---------------- | ------------------------------------------------------- |
| `variant`      | `string`   | `"server"`       | `"server"` or `"validation"` — controls the label shown |
| `title`        | `string`   | —                | Bold heading for the error                              |
| `description`  | `string`   | —                | Short explanatory text                                  |
| `details`      | `string`   | —                | Optional secondary detail text                          |
| `actionLabel`  | `string`   | —                | Button label; omit to hide the action button            |
| `onAction`     | `function` | —                | Callback when the action button is clicked              |
| `previewLabel` | `string`   | `"Preview only"` | Badge text shown next to the variant label              |

### Accessibility

- Renders with `role="alert"` and `aria-live="assertive"` so screen readers announce errors immediately.
- Action button includes `focus:ring` for keyboard visibility.

### Example

```jsx
<ErrorBanner
  variant="server"
  title="Could not load invoices"
  description="The API returned an unexpected error."
  details="Status 500 — please try again."
  actionLabel="Retry"
  onAction={() => refetch()}
/>
```

---

## Footer

Site footer with navigation links (Docs, System Status, Contact Support). Links are sourced from the `app/copy/en.js` copy file.

**File:** `components/Footer.jsx`

### Props

None.

### Example

```jsx
<Footer />
```

---

## InvoiceListSkeleton

Animated placeholder list rendered while invoice data is loading. Mirrors the shape of the real invoice card layout.

**File:** `components/InvoiceListSkeleton.jsx`

### Props

| Prop   | Type     | Default | Description                       |
| ------ | -------- | ------- | --------------------------------- |
| `rows` | `number` | `3`     | Number of skeleton rows to render |

### Accessibility

- `<ul>` has `aria-busy="true"` and `aria-label="Loading investable invoices"` so screen readers announce the loading state.
- Replace with real content once data resolves; remove or set `aria-busy="false"` at that point.

### Example

```jsx
// default 3 rows
<InvoiceListSkeleton />

// custom row count
<InvoiceListSkeleton rows={5} />
```

---

## NavMenu

Responsive site-wide header navigation used on every page.

**File:** `components/NavMenu.jsx`

### Props

| Prop            | Type       | Default            | Description                                      |
| --------------- | ---------- | ------------------ | ------------------------------------------------ |
| `walletLabel`   | `string`   | `'Connect Wallet'` | Label text rendered inside the wallet button     |
| `onWalletClick` | `function` | —                  | Callback fired when the wallet button is clicked |

### Behaviour

- **Desktop (≥ `md` breakpoint):** Home, Invoices, and Invest links render inline in the header row alongside the wallet button.
- **Mobile (< `md` breakpoint):** Nav links are hidden behind a hamburger toggle (☰). Clicking the toggle reveals a dropdown menu below the header bar.
- The active route is detected automatically via `usePathname` and marked with `aria-current="page"` on the matching link.
- The menu closes on **Escape** (focus returns to the toggle button), on any navigation event (pathname change), or when the toggle is clicked again.

### Accessibility

- Toggle button exposes `aria-expanded` and `aria-controls` so assistive technologies announce the disclosure state.
- All links carry `aria-current="page"` on the active route.
- Passes `jest-axe` checks in both open and closed states.
- All interactive elements have visible `focus-visible` outlines using the cyan-400 design token.

### Example

```jsx
import NavMenu from "@/components/NavMenu";

// Drop-in replacement for the static <header> on any page
export default function MyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavMenu />
      <main>...</main>
    </div>
  );
}

// With Stellar wallet integration
<NavMenu walletLabel="Freighter" onWalletClick={handleConnectWallet} />;
```

---

## ToastProvider / useToast

Context-based toast notification system. Wrap your app (or the relevant subtree) with `ToastProvider`, then call `useToast()` anywhere inside to fire toasts.

**File:** `components/ToastProvider.jsx`

### `<ToastProvider>`

| Prop       | Type        | Description        |
| ---------- | ----------- | ------------------ |
| `children` | `ReactNode` | Subtree to provide |

### `useToast()` return value

| Method                     | Description                |
| -------------------------- | -------------------------- |
| `success(message, title?)` | Show a green success toast |
| `error(message, title?)`   | Show a red error toast     |
| `info(message, title?)`    | Show a cyan info toast     |

### Behaviour

- Toasts auto-dismiss after **5 seconds**.
- Hovering a toast pauses the dismiss timer; leaving resumes it.
- Multiple toasts stack vertically; newest appears at the top.
- The toast container uses `aria-live="polite"` and `role="status"`.

### Example

```jsx
// app/layout.js or equivalent root
import { ToastProvider } from "@/components/ToastProvider";

export default function RootLayout({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}

// Anywhere inside the tree
import { useToast } from "@/components/ToastProvider";

function SaveButton() {
  const toast = useToast();
  return <button onClick={() => toast.success("Changes saved.", "Saved")}>Save</button>;
}
```

---

## UploadZone

Drag-and-drop (or click-to-browse) PDF invoice upload form. Validates the file client-side, then POSTs it to `POST /invoices` on the configured API.

**File:** `components/UploadZone.jsx`

### Props

None — API endpoint is read from `NEXT_PUBLIC_API_URL` (falls back to `http://localhost:3001`).

### Exported constants

| Export             | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `FILE_CONSTRAINTS` | Object with `accept`, `mimeType`, `maxSizeMb`, `maxSizeBytes`   |
| `Spinner`          | Small inline SVG spinner used internally; re-exported for reuse |

### Upload states

| State        | Description                                             |
| ------------ | ------------------------------------------------------- |
| `idle`       | Waiting for a file or ready to submit                   |
| `uploading`  | `fetch` in progress; submit button disabled             |
| `tokenizing` | Upload succeeded; waiting for server tokenization delay |
| `success`    | Invoice queued; informational status shown              |

### Validation rules

- **Type:** only `application/pdf` accepted; any other MIME type is rejected.
- **Size:** file must be ≤ 10 MB.

### Accessibility

- Drop zone renders as `role="button"` with `tabIndex={0}`; activates on `Enter` and `Space`.
- Errors use `role="alert"` with `aria-live="assertive"`.
- Progress messages use `role="status"` with `aria-live="polite"`.
- Upload button carries `aria-disabled` in addition to the native `disabled` attribute.

### Example

```jsx
import UploadZone from "@/components/UploadZone";

export default function InvoicePage() {
  return (
    <main>
      <h1>Upload Invoice</h1>
      <UploadZone />
    </main>
  );
}
```

---

## WalletStatus

Stellar wallet connection UI. Shows a status indicator dot, wallet address / helper text, and an action button whose label adapts to the current connection state.

**File:** `components/WalletStatus.jsx`

> **Note:** Wallet connection is currently mocked for UI development. Replace the `connectWallet` internals with real Freighter / wallet-kit calls when integrating. See [WALLET_INTEGRATION_CONTRACT.md](WALLET_INTEGRATION_CONTRACT.md).

### Props

None — all state is managed internally.

### Connection states

| State           | Dot colour     | Button label     | Description                              |
| --------------- | -------------- | ---------------- | ---------------------------------------- |
| `disconnected`  | Grey           | Connect Wallet   | Initial state; no wallet linked          |
| `connecting`    | Yellow (pulse) | Connecting…      | Awaiting wallet approval                 |
| `connected`     | Green          | Disconnect       | Wallet linked; address and balance shown |
| `error`         | Red            | Retry Connection | Connection attempt failed                |
| `wrong_network` | Red            | Switch Network   | Wallet is on testnet instead of public   |
| `no_wallet`     | Grey           | Install Wallet   | No Stellar wallet extension detected     |

### Exported constants

| Export          | Description                          |
| --------------- | ------------------------------------ |
| `WALLET_STATES` | Object of all state string constants |

### Accessibility

- Status dot is `aria-hidden`; the `sr-only` live region (`aria-live="polite"`, `role="status"`) announces state changes to screen readers.
- Action button has `aria-label` matching the visible button text.
- Button links `aria-describedby` to a hidden helper-text element.

### Example

```jsx
import WalletStatus from "@/components/WalletStatus";

// Renders within a ToastProvider (required for connection toasts)
<WalletStatus />;
```

---

## Design tokens

Global tokens defined in `app/globals.css` and used across all components.

| Token             | Value     | Tailwind equivalent |
| ----------------- | --------- | ------------------- |
| `--color-bg`      | `#0f0f0f` | `slate-950`         |
| `--color-primary` | `#06b6d4` | `cyan-400`          |

Font: **Geist** via `@fontsource/geist`. Headings use `font-bold`; body copy uses the default weight.
