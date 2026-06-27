# Component Library Reference

Shared UI components for the LiquiFact frontend. All components live under `components/`.

---

## Table of Contents

- [EmptyState](#emptystate)
- [ErrorBanner](#errorbanner)
- [Footer](#footer)
- [InvoiceList](#invoicelist)
- [InvoiceListSkeleton](#invoicelistskeleton)
- [NavMenu](#navmenu)
- [ThemeToggle](#themetoggle)
- [ToastProvider / useToast](#toastprovider--usetoast)
- [UploadZone](#uploadzone)
- [WalletStatus](#walletstatus)

---

## EmptyState

A reusable empty-state panel with an icon slot, heading, description, and an action element. Used whenever a list or page region has no content to show.

**File:** `components/EmptyState.jsx`

### Named exports

| Export                     | Description                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `default` (`EmptyState`)   | The reusable empty-state container component                                         |
| `InvoiceEmptyIllustration` | Decorative inline SVG of an empty document tray; always rendered with `aria-hidden` |

### Props (`EmptyState`)

| Prop          | Type        | Default | Description                                                                                        |
| ------------- | ----------- | ------- | -------------------------------------------------------------------------------------------------- |
| `title`       | `string`    | —       | **Required.** Heading text shown in the panel (rendered as `<h3>`)                                 |
| `description` | `string`    | —       | Optional supporting paragraph below the title                                                      |
| `icon`        | `ReactNode` | —       | Decorative icon or SVG placed above the title. SVGs should include `aria-hidden="true"`            |
| `action`      | `ReactNode` | —       | CTA element (link or button) rendered below the description                                        |
| `className`   | `string`    | `''`    | Additional Tailwind classes forwarded to the root `<div>` alongside the component's default styles |

### Accessibility

- The `icon` slot is purely decorative — always pass `aria-hidden="true"` and `focusable="false"` on the SVG.
- The action element must be a focusable element (`<a>` or `<button>`). Include `focus-visible:outline` classes to meet WCAG 2.1 §2.4.11.
- The title is rendered as `<h3>` — ensure the surrounding page hierarchy is correct (usually inside a `<section>` headed by `<h2>`).

### Example

```jsx
import EmptyState, { InvoiceEmptyIllustration } from '@/components/EmptyState';

<EmptyState
  icon={<InvoiceEmptyIllustration />}
  title="No invoices yet"
  description="Upload your first invoice to get started."
  action={
    <a
      href="#invoice-upload-btn"
      className="rounded-xl border border-cyan-700 bg-cyan-900/30 px-5 py-2.5 text-sm font-semibold text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
    >
      Upload your first invoice
    </a>
  }
/>
```

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

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `links` | `Array<{label:string, href:string, external?:boolean}>` | `undefined` (uses default links) | Optional custom links array. Allows passing internal links (with `external: false`) to render via Next `Link`.

> **Note:** When `external` is omitted or set to `true`, the link is rendered as a normal `<a>` with `target="_blank"` and `rel="noopener noreferrer"` for security.

### Example

```jsx
<Footer />

// Custom internal link example
<Footer
  links={[{ label: 'Home', href: '/', external: false }]}
/>
```

---

## InvoiceList

Renders the SME invoice list with loading, empty, and error states. Each card that includes an `issuerAddress` field shows a truncated Stellar address with an inline copy button.

**File:** `components/InvoiceList.jsx`

### Props

| Prop                 | Type       | Default          | Description                                                                 |
| -------------------- | ---------- | ---------------- | --------------------------------------------------------------------------- |
| `loadInvoices`       | `function` | `loadMockInvoices` | Async loader that resolves to an invoice array                            |
| `optimisticInvoices` | `array`    | `[]`             | Newly submitted invoices to prepend optimistically before the API responds |

### Invoice object shape

| Field           | Type     | Required | Description                                                     |
| --------------- | -------- | -------- | --------------------------------------------------------------- |
| `id`            | `string` | Yes      | Unique identifier                                               |
| `issuer`        | `string` | Yes      | Display name (company name)                                     |
| `issuerAddress` | `string` | No       | Stellar public key; when present, shown truncated with copy button |
| `amount`        | `string` | Yes      | Formatted amount string                                         |
| `currency`      | `string` | Yes      | ISO currency code                                               |
| `dueDate`       | `string` | Yes      | ISO-8601 due date                                               |
| `yield`         | `string` | Yes      | Estimated yield percentage                                      |
| `status`        | `string` | Yes      | One of: `Pending tokenization`, `Tokenized`, `Funded`, `Settled` |

### Copy-issuer-address button

When `invoice.issuerAddress` is set, each card renders:

- A **truncated** address in head/tail form (`GABCDE…34DE`) via `lib/format/truncateAddress.js`
- A **copy button** that writes the **full** address to the clipboard
- A **"Copied!"** confirmation that appears for 2 seconds after a successful copy, announced via `aria-live="polite"`
- A **guarded fallback** using `document.execCommand('copy')` when `navigator.clipboard` is unavailable
- Clipboard failures are **silent** — no error banner or toast is shown

### Accessibility

- `role="status"` + `aria-live="polite"` on the "Copied!" confirmation region
- Copy button `aria-label` includes the truncated address and updates to `"Copied!"` on success
- `title` attribute on the truncated span exposes the full address as a tooltip
- `aria-label` on the truncated address span reads the full address for screen readers
- Copy button is `type="button"` to prevent accidental form submission

### Example

```jsx
import InvoiceList from '@/components/InvoiceList';

// With API loader
<InvoiceList loadInvoices={fetchInvoicesFromApi} />

// With optimistic invoice after upload
<InvoiceList
  loadInvoices={fetchInvoicesFromApi}
  optimisticInvoices={[{
    id: 'upload-xyz',
    issuer: 'My Company',
    issuerAddress: 'GABCDE1234FGHIJ5678KLMNO9012PQRST3456UVWXY7890ZABC1234DE',
    amount: 'Pending',
    currency: 'USD',
    dueDate: 'Pending',
    yield: 'Pending',
    status: 'Pending tokenization',
  }]}
/>
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
| `MAX_UPLOAD_BYTES` | Numeric constant limiting file size to 10 MB (in bytes)         |
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
- **Size:** file must be ≤ 10 MB (`MAX_UPLOAD_BYTES`). Validation is checked immediately upon file selection via `FILE_CONSTRAINTS`, and additionally enforced before the network `fetch` is triggered to ensure safety.

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

## ThemeToggle

A button that cycles through **light → dark → system** theme preferences, persists the choice to `localStorage`, and applies a `data-theme` attribute on `<html>` so CSS tokens update instantly.

**File:** `components/ThemeToggle.jsx`

### Named exports

| Export              | Description                                                                             |
| ------------------- | --------------------------------------------------------------------------------------- |
| `default` (`ThemeToggle`) | The toggle button component                                                       |
| `THEMES`            | `['light', 'dark', 'system']` — the ordered cycle                                      |
| `THEME_STORAGE_KEY` | `localStorage` key used to persist the preference                                       |
| `resolveTheme(pref)`| Maps a preference string to `'light'` or `'dark'` (resolves `'system'` via `matchMedia`) |
| `readStoredTheme()` | Reads from `localStorage`, returning `'system'` as fallback                             |
| `applyTheme(pref)`  | Sets `data-theme` on `document.documentElement`                                         |

### Props

| Prop        | Type     | Default | Description                              |
| ----------- | -------- | ------- | ---------------------------------------- |
| `className` | `string` | `''`    | Extra classes forwarded to the root `<button>` |

### How it works

1. **Pre-paint inline script** in `app/layout.js` reads `localStorage` before React hydrates and sets `data-theme` on `<html>` via `dangerouslySetInnerHTML`. This eliminates the flash of incorrect theme on first load.
2. **On mount**, the component reads the stored preference and syncs React state.
3. **On click**, cycles `system → light → dark → system`, writes to `localStorage`, and calls `applyTheme`.
4. **OS change listener**: when preference is `'system'`, a `matchMedia` listener re-applies the theme if the user toggles their OS setting.

### Theme cycle

```
system (monitor icon)  →  light (sun icon)  →  dark (moon icon)  →  system …
```

### Accessibility

- `aria-label` describes the **current** theme and the next option (e.g. `"Theme: Dark (click for System)"`).
- `aria-pressed` is `true` for explicit `light`/`dark` choices and `false` for `system`.
- All SVG icons carry `aria-hidden="true"` and `focusable="false"`.
- Button has `id="theme-toggle"` for automated testing and skip-link targeting.
- Keyboard-focusable with `focus-visible:outline` following the site ring pattern.

### CSS tokens consumed

| Token            | Dark (`[data-theme="dark"]`) | Light (`[data-theme="light"]`) |
| ---------------- | ---------------------------- | ------------------------------ |
| `--color-bg`     | `#020617` (slate-950)        | `#f8fafc` (slate-50)           |
| `--color-fg`     | `#f1f5f9` (slate-100)        | `#0f172a` (slate-900)          |
| `--color-muted`  | `#94a3b8` (slate-400)        | `#64748b` (slate-500)          |
| `--color-surface`| `#0f172a` (slate-900)        | `#ffffff` (white)              |
| `--color-border` | `#1e293b` (slate-800)        | `#e2e8f0` (slate-200)          |
| `--color-primary`| `#22d3ee` (cyan-400)         | `#0891b2` (cyan-600)           |

### Example

```jsx
import ThemeToggle from '@/components/ThemeToggle';

// Renders inside any layout — no provider required
<ThemeToggle />

// With extra positioning class
<ThemeToggle className="ml-4" />
```

---

## Design tokens

Global tokens defined in `app/globals.css` and driven by the `[data-theme]` attribute (set by `ThemeToggle`).

| Token             | Dark value          | Light value         |
| ----------------- | ------------------- | ------------------- |
| `--color-bg`      | `#020617` slate-950 | `#f8fafc` slate-50  |
| `--color-fg`      | `#f1f5f9` slate-100 | `#0f172a` slate-900 |
| `--color-primary` | `#22d3ee` cyan-400  | `#0891b2` cyan-600  |

Dark is the `:root` default (backwards-compatible). Light overrides activate via `[data-theme="light"]`.

Font: **Geist** via `next/font/google`. Headings use `font-bold`; body copy uses the default weight.
