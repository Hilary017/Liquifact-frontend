# LiquiFact Frontend

Web app for **LiquiFact** — the global invoice liquidity network on Stellar. Next.js dashboard for SMEs (upload invoices, get liquidity) and investors (fund tokenized invoices, earn yield). Stellar wallet integration is planned.

Part of the LiquiFact stack: **frontend** (this repo) | **backend** (Express API) | **contracts** (Soroban).

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 9+

---

## Setup

1. **Clone the repo**

   ```bash
   git clone <this-repo-url>
   cd liquifact-frontend
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Configure environment** (optional)

   ```bash
   cp .env.local.example .env.local
   # Set NEXT_PUBLIC_API_URL if the API is not at http://localhost:3001
   ```

---

## Development

| Command            | Description                                 |
| ------------------ | ------------------------------------------- |
| `npm run dev`      | Start dev server (Turbopack)                |
| `npm run lint`     | Run ESLint                                  |
| `npm test`         | Run Jest/jsdom unit and accessibility tests |
| `npm run build`    | Production build                            |
| `npm run start`    | Start production server                     |
| `npm run test:e2e` | Run Playwright smoke tests                  |

### Environment variables

| Variable                      | Required | Default                 | Used by                                                          |
| ----------------------------- | -------- | ----------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`         | No       | `http://localhost:3001` | [app/page.js](app/page.js)                                       |
| `NEXT_PUBLIC_STELLAR_NETWORK` | No       | Unset                   | [WALLET_INTEGRATION_CONTRACT.md](WALLET_INTEGRATION_CONTRACT.md) |

`NEXT_PUBLIC_*` values are inlined by Next.js at **build time** and shipped to the browser. **Never store secrets here.**

#### Build-time validation

All `NEXT_PUBLIC_*` variables are validated by [`lib/config/env.js`](lib/config/env.js) when the module is first imported. If any variable is set to an invalid value (e.g. a malformed URL or an unsupported `STELLAR_NETWORK` value), the build fails immediately with a message listing every problem:

```
[env] Environment misconfiguration — fix before deploying:
  • NEXT_PUBLIC_API_URL: "not-a-url" is not a valid URL
  • NEXT_PUBLIC_STELLAR_NETWORK: "mainnet" must be one of [testnet, public]
```

Unset variables fall back to their defaults and do **not** cause a build error.

---

## Project structure

```text
liquifact-frontend/
├─ app/
│   ├─ layout.js            # Root layout, LiquiFact metadata (imports Geist via next/font/google)
│   ├─ page.js              # Home (wallet CTA, API health check)
│   ├─ copy/                # Localized copy strings (e.g., en.js)
│   ├─ invoices/            # Invoices placeholder page
│   └─ invest/              # Invest placeholder page
├─ components/               # Shared UI components
│   ├─ ErrorBanner.jsx
│   ├─ Footer.jsx
│   ├─ InvoiceListSkeleton.jsx
│   ├─ ToastProvider.jsx
│   ├─ UploadZone.jsx
│   └─ WalletStatus.jsx
├─ public/                  # Static assets
├─ tests/                    # Jest / Playwright test suites
├─ .github/workflows/ci.yml # CI pipeline (lint + accessibility tests)
├─ .env.local.example
├─ eslint.config.mjs
├─ jest.config.js
├─ jest.setup.js
├─ next.config.mjs
├─ playwright.config.mjs
└─ package.json
```

Tech: **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**.

---

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

- **Lint** – `npm run lint`
- **Test Accessibility** – `npm test --silent`

Both jobs must pass before a PR can be merged.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor workflow, branch naming convention, local checks, and accessibility expectations.

1. **Fork** the repo and clone your fork.
2. **Create a branch** from `main`: `git checkout -b feature/your-feature` or `fix/your-fix`.
3. **Setup**: `npm ci`, optionally `cp .env.local.example .env.local`.
4. **Make changes**:
   - Follow existing patterns under `app/` and `components/`.
   - Run `npm run lint` and `npm test` locally.
5. **Commit** with clear messages (e.g., `feat: add X`, `fix: Y`).
6. **Push** to your fork and open a **Pull Request** to `main`.
7. Wait for CI and address review feedback.

We welcome UI improvements, new pages (e.g., invoice upload, marketplace), and Stellar wallet integration aligned with the LiquiFact product.

---

## UI Components

See [COMPONENTS.md](COMPONENTS.md) for the full component library reference — props, accessibility notes, and usage examples for every shared component (`ErrorBanner`, `Footer`, `InvoiceListSkeleton`, `ToastProvider`, `UploadZone`, `WalletStatus`).

The `Footer` component now renders real destination links sourced from `app/copy/en.js`, including external documentation, system status, contact support, and a Discord community link with secure `target="_blank" rel="noopener noreferrer"` handling.

---

## Design Tokens

Global tokens are defined in `app/globals.css` and used across all components. For a comprehensive, detailed list of all colors, spacing, radii, and typography tokens, see the [Design Token Reference](docs/design-tokens.md) document.

| Token             | Value     | Tailwind equivalent |
| ----------------- | --------- | ------------------- |
| `--color-bg`      | `#020617` | `slate-950`         |
| `--color-primary` | `#22d3ee` | `cyan-400`          |

Font: **Geist** is loaded via `next/font/google` (see `app/layout.js`). Headings use `font-bold`; body copy uses the default weight.

---

## Testing

See [TESTING.md](TESTING.md) for the full guide covering Jest unit/accessibility tests and Playwright end‑to‑end setup.

- `components/ToastProvider.test.tsx` covers the toast lifecycle: auto-dismiss, hover pause/resume, manual close, live-region accessibility, unmount cleanup, and `useToast` guard behavior.

### Notes about newly added tests

- `app/page.test.tsx` — Unit tests covering the Home page API health check interaction (success, network error, and loading/disabled button states). These tests mock `global.fetch` and use `@testing-library/user-event` for interaction. They are intended to improve coverage for the home page health-check flow.
- `components/ToastProvider.dedupe.test.tsx` — Covers the bounded toast queue, duplicate collapse, timer refresh, hover pause/resume, and cleanup on unmount. The visible stack is capped to three so repeat errors do not cover the viewport.

---

## Contracts

- [WALLET_INTEGRATION_CONTRACT.md](WALLET_INTEGRATION_CONTRACT.md)
- [FILTER_CONTRACTS.md](FILTER_CONTRACTS.md)

---

## License

MIT (see root LiquiFact project for full license).

Web app for **LiquiFact** — the global invoice liquidity network on Stellar. Next.js dashboard for SMEs (upload invoices, get liquidity) and investors (fund tokenized invoices, earn yield). Stellar wallet integration is planned.

Part of the LiquiFact stack: **frontend** (this repo) | **backend** (Express API) | **contracts** (Soroban).

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 9+

---

## Setup

1. **Clone the repo**

   ```bash
   git clone <this-repo-url>
   cd liquifact-frontend
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Configure environment** (optional)

   ```bash
   cp .env.local.example .env.local
   # Set NEXT_PUBLIC_API_URL if the API is not at http://localhost:3001
   ```

---

## API Integration

For frontend/backend contract details see:

[docs/api-integration.md](docs/api-integration.md)

---

## Development

| Command            | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `npm run dev`      | Start dev server (Turbopack)                            |
| `npm run lint`     | Run ESLint                                              |
| `npm test`         | Run Jest/jsdom unit and accessibility tests             |
| `npm run build`    | Production build                                        |
| `npm run start`    | Start production server                                 |
| `npm run test:e2e` | Run Playwright smoke tests (toast & invest marketplace) |

### Environment variables

| Variable                      | Required | Default                 | Used by                                                          |
| ----------------------------- | -------- | ----------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`         | No       | `http://localhost:3001` | [app/page.js](app/page.js)                                       |
| `NEXT_PUBLIC_STELLAR_NETWORK` | No       | Unset                   | [WALLET_INTEGRATION_CONTRACT.md](WALLET_INTEGRATION_CONTRACT.md) |

`NEXT_PUBLIC_*` values are inlined at build time and must never contain secrets. See [`lib/config/env.js`](lib/config/env.js) for validation rules and defaults.

The invoices page header also uses the shared `NavMenu` component, replacing the old bespoke header so navigation and wallet entry stay consistent across routes.

### Marketplace search & filtering

The Invest page (`app/invest/page.js`) includes an issuer-name search field and filter panel above the invoice list.

| Feature | Details |
|---------|----------|
| **Search component** | `components/InvoiceSearch.jsx` — controlled text input |
| **Filter panel** | `components/InvoiceFilters.jsx` — yield, risk, maturity, and currency filters |
| **Debounce** | `200 ms` — filtering waits for settled input before updating results |
| **Match strategy** | Case-insensitive substring match on the `issuer` field |
| **Screen-reader announcements** | An `aria-live="polite"` region announces the result count on every filter change (e.g. *"2 of 3 invoices match"*) |
| **No-match state** | A distinct empty state is shown when filters produce zero results, separate from the empty-marketplace state |
| **Pagination** | `components/Pagination.jsx` — page controls appear when filtered results exceed `PAGE_SIZE` (default 10) |

---

## Project structure

```
liquifact-frontend/
├── app/
│   ├── layout.js           # Root layout, LiquiFact metadata
│   ├── page.js             # Home (wallet CTA, API health check)
│   ├── copy/en.js          # Centralised UI copy
│   ├── invoices/           # SME invoice upload page
│   └── invest/             # Investor marketplace
│       ├── page.js         # Marketplace list with search, filters & pagination
│       ├── loading.js      # Marketplace skeleton
│       ├── lib.js          # Mock invoice data + loadMockInvoices helper
│       └── [id]/           # Invoice detail + funding CTA
│           ├── page.js     # Full invoice details
│           ├── loading.js  # Detail skeleton
│           └── not-found.js # Unknown invoice fallback
├── components/
│   ├── Button.jsx          # Reusable button with variant styles
│   ├── ErrorBanner.jsx     # Accessible error state banner
│   ├── Footer.jsx          # Site-wide footer with copy-driven links
│   ├── InvoiceFilters.jsx  # Yield / risk / maturity / currency filter panel
│   ├── InvoiceList.jsx     # Invoice table with loading / error / empty states
│   ├── InvoiceListSkeleton.jsx # aria-busy skeleton loader for invoice lists
│   ├── InvoiceSearch.jsx   # Controlled issuer-name search input
│   ├── NavMenu.jsx         # Responsive site navigation header
│   ├── Pagination.jsx      # Page controls for large result sets
│   ├── ToastProvider.jsx   # Toast notification system
│   ├── UploadZone.jsx      # Invoice PDF upload + validation
│   ├── WalletProvider.jsx  # App-wide wallet state provider
│   ├── WalletStatus.jsx    # Wallet connection / address display
│   └── WalletStatusLazy.jsx # next/dynamic wrapper (ssr: false)
├── lib/
│   ├── api/invoices.js     # Invoice API helpers
│   └── format/safeJson.js  # Depth-limited JSON formatter
├── public/
├── .env.local.example
├── eslint.config.mjs
└── package.json
```

Tech: **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**.

---

## Accessibility

### Skip-to-content link

A visually-hidden "Skip to content" link is the first focusable element on every page. It becomes visible when focused (first Tab press) and jumps the keyboard user past the navigation header directly to `<main id="main-content">`.

All interactive elements (nav links, card links, buttons) use a consistent `focus-visible` cyan outline that matches the brand's primary colour. The utility classes are defined in `app/globals.css`:

- `.skip-link` — positions and reveals the skip link on focus
- `.focus-ring` — reusable `focus-visible` outline for custom interactive elements

### Reduced-motion support

Users who enable **prefers-reduced-motion** in their OS or browser settings receive a
motion-safe experience automatically. A `@media (prefers-reduced-motion: reduce)` block
in `app/globals.css` disables `animate-spin` (spinners) and `animate-pulse` (skeleton
loaders) globally. Skeleton shapes and spinner SVGs remain visible — only the animation
is removed. ARIA semantics (`aria-busy`, `role="status"`, `aria-live`) are unaffected,
so screen-reader users always hear loading announcements regardless of motion preference.

To verify manually: open DevTools → Rendering tab → set **"Emulate CSS media feature
prefers-reduced-motion"** to `reduce`, then navigate to `/invoices` or `/invest` and
confirm skeletons are visible without shimmer and spinners are static.

---

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

- **Lockfile check** — asserts `package-lock.json` is in sync with `package.json`
- **Lint** — `npm run lint`
- **Build** — `npm run build`

Keep all checks passing before opening a PR.

To reproduce the lockfile check locally:

```bash
npm install --package-lock-only --ignore-scripts
git diff --exit-code package-lock.json  # exits 1 if drifted
```

---

## Dependency updates

Dependabot opens weekly PRs on Monday to keep npm packages and GitHub Actions current.

PRs are grouped to limit noise:

- **nextjs-react** — `next`, `react`, `react-dom`, and their `@types` packages together (coordinated bumps).
- **dev-tooling** — all remaining `devDependencies` in one PR.
- **github-actions** — action version bumps in a separate PR.

**Reviewing a Dependabot PR**

1. Check the CI run passes (lockfile check + lint + build).
2. Scan the changelog/release notes linked in the PR description for breaking changes.
3. For `nextjs-react` bumps, do a quick smoke test (`npm run dev`) locally.
4. Approve and merge — **do not enable auto-merge**; every dependency bump requires a human reviewer.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor workflow, branch naming convention, local checks, and accessibility expectations. Also see our [Accessibility Statement](docs/accessibility.md).

1. **Fork** the repo and clone your fork.
2. **Create a branch** from `main`: `git checkout -b feature/your-feature` or `fix/your-fix`.
3. **Setup**: `npm ci`, optionally `cp .env.local.example .env.local`.
4. **Make changes**:
   - Follow existing patterns under `app/`.
   - Run `npm run lint` and `npm run build` locally.
5. **Commit** with clear messages (e.g. `feat: add X`, `fix: Y`).
6. **Push** to your fork and open a **Pull Request** to `main`.
7. Wait for CI and address review feedback.

We welcome UI improvements, new pages (e.g. invoice upload, marketplace), and Stellar wallet integration aligned with the LiquiFact product.

## UI Components

See [COMPONENTS.md](COMPONENTS.md) for the full component library reference — props, accessibility notes, and usage examples for every shared component (`ErrorBanner`, `Footer`, `InvoiceListSkeleton`, `ToastProvider`, `UploadZone`, `WalletProvider`, `WalletStatus`).

## Invoice List

The invoices page now renders an SME invoice table below `UploadZone` using `InvoiceList`.

- `InvoiceList` accepts an injectable `loadInvoices` prop so data loading can be mocked during tests and swapped for a backend API later.
- While invoices are loading, it renders `InvoiceListSkeleton` and exposes a polite `aria-live` status region for assistive technology.
- If no invoices are returned, it shows `copy.invoices.emptyState` text.
- If invoice loading fails, an accessible `ErrorBanner` is displayed with localized fallback copy.
- After `UploadZone` successfully uploads a document, `onUploadSuccess` appends a new optimistic invoice entry immediately without requiring a manual browser refresh.

### Wallet connection (`WalletProvider`)

Wallet state is shared app-wide via `WalletProvider`, mounted in `app/layout.js` inside `ToastProvider`. Any client component can read connection state with `useWallet()`:

```jsx
import { useWallet } from "@/components/WalletProvider";

function FundInvoiceButton() {
  const { state, walletData, connect, disconnect } = useWallet();

  if (state !== "connected") {
    return (
      <button type="button" onClick={() => connect()}>
        Connect wallet
      </button>
    );
  }

  return <span>Ready to fund as {walletData.address}</span>;
}
```

**Persistence:** On successful connect, a minimal snapshot is saved to `localStorage` under `liquifact-wallet-snapshot`:

| Field                  | Persisted | Notes                                              |
| ---------------------- | --------- | -------------------------------------------------- |
| `version`              | Yes       | Schema version (`1`)                               |
| `state`                | Yes       | Only `connected` is restored                       |
| `address`              | Yes       | Truncated display form only (e.g. `GABC...XYZ123`) |
| `network`              | Yes       | `public` or `testnet`                              |
| `balance`              | **No**    | Fetched live after real wallet integration         |
| Private keys / secrets | **Never** | Rejected on read if detected                       |

The provider rehydrates from storage **after mount** (SSR-safe). `disconnect()` clears storage immediately. See [WALLET_INTEGRATION_CONTRACT.md](WALLET_INTEGRATION_CONTRACT.md) for the full integration contract.

### NavMenu

`components/NavMenu.jsx` — Responsive site-wide header navigation used on every page.

**Props**

| Prop            | Type       | Default            | Description                                      |
| --------------- | ---------- | ------------------ | ------------------------------------------------ |
| `walletLabel`   | `string`   | `'Connect Wallet'` | Label text rendered inside the wallet button     |
| `onWalletClick` | `function` | `undefined`        | Callback fired when the wallet button is clicked |

**Behaviour**

- **Desktop (≥ `md` breakpoint):** Home, Invoices, and Invest links render inline in the header row alongside the wallet button.
- **Mobile (< `md` breakpoint):** Nav links are hidden behind a hamburger toggle (☰). Clicking the toggle reveals a dropdown menu below the header bar.
- The active route is detected automatically via `usePathname` and marked with `aria-current="page"` on the matching link.
- The menu closes on **Escape** (with focus returned to the toggle button), on any navigation event (pathname change), or when the toggle is clicked again.
- Passes `jest-axe` accessibility checks in both open and closed states. The toggle exposes `aria-expanded` and `aria-controls` so assistive technologies can correctly announce the disclosure state.

**Usage**

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

## Design Tokens

Global tokens are defined in `app/globals.css` and used across all components. For a comprehensive, detailed list of all colors, spacing, radii, and typography tokens, see the [Design Token Reference](docs/design-tokens.md) document.

- **Colors**
  - `--color-bg`: `#020617` (slate‑950)
  - `--color-primary`: `#22d3ee` (cyan‑400)

- **Typography**
  - Font family: **Geist** – imported via `@fontsource/geist`.
  - Headings use `font‑bold`, body uses `font‑regular`.

## Testing

See [TESTING.md](TESTING.md) for the full guide covering Jest unit/accessibility tests and Playwright end-to-end setup.

## Backend Health Check

The home page health check now:

- Uses an 8 second timeout.
- Aborts hung requests.
- Safely handles HTML and malformed JSON responses.
- Reports one of the following status states with distinct visual treatments:
  - **Connected** (green badge with ✓ icon) — Backend is healthy and responding correctly
  - **Degraded** (amber badge with ⚠ icon) — Backend responded but with an error status (e.g., HTTP 500)
  - **Unreachable** (red badge with ✕ icon) — Backend could not be reached or request timed out

- Provides a detailed disclosure for raw responses behind an expandable `<details>` element
- Status changes are announced politely via `aria-live="polite"` for accessibility
- Badges include both color and text/icons (not color-only) to meet accessibility requirements

## Contracts

- [WALLET_INTEGRATION_CONTRACT.md](WALLET_INTEGRATION_CONTRACT.md)
- [FILTER_CONTRACTS.md](FILTER_CONTRACTS.md)

---

## Security

- **Bounded health rendering** — The home page displays the backend `/health` response
  through a bounded pipeline: recognised fields (`status`, `message`, `version`) are
  extracted and shown in a structured summary. The full payload is hidden behind a
  collapsible `<details>` element and stringified via a depth-limited (max 5 levels),
  length-truncated (max 2000 characters) formatter (`lib/format/safeJson.js`).
  This prevents DoS from giant or deeply nested attacker-controlled payloads.

### HTTP security headers & Content-Security-Policy

Every response carries a baseline set of security headers, attached via the
`headers()` function in [`next.config.mjs`](next.config.mjs). The values are built by
[`lib/securityHeaders.mjs`](lib/securityHeaders.mjs) (a small pure module so the policy
can be unit-tested and later reused by middleware for per-request nonces). Coverage is
asserted in [`security/headers.test.tsx`](security/headers.test.tsx).

| Header                       | Value                                                     | Purpose                                                        |
| ---------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| `Content-Security-Policy`    | see below                                                 | Primary defence against XSS / data injection                   |
| `X-Content-Type-Options`     | `nosniff`                                                 | Stops MIME-sniffing away from the declared type                |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                         | Avoids leaking invoice/wallet IDs in the `Referer`             |
| `X-Frame-Options`            | `DENY`                                                    | Legacy clickjacking protection (complements `frame-ancestors`) |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=(), payment=(), …` | Disables unused powerful browser features                      |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains; preload`            | Forces HTTPS (ignored over plain http/localhost)               |
| `Cross-Origin-Opener-Policy` | `same-origin`                                             | Isolates the browsing context group                            |

**Content-Security-Policy directives** (each is annotated in `lib/securityHeaders.mjs`):

| Directive                                 | Value                                                       | Why                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`                             | `'self'`                                                    | Deny-by-default for anything not listed below                                                                                                                                                                                                                                                                  |
| `script-src`                              | `'self' 'unsafe-inline'` (+ `'unsafe-eval'` in dev only)    | Next.js App Router injects an inline bootstrap script. `'unsafe-eval'` is added **only** under `next dev` for React Fast Refresh and never ships to production                                                                                                                                                 |
| `style-src`                               | `'self' 'unsafe-inline' https://fonts.googleapis.com`       | `'unsafe-inline'` is required because **next/font** and Tailwind/Next inject inline `<style>` tags and `style` attributes (critical CSS + font variables) that are generated per build and cannot be hashed ahead of time. This relaxation is scoped to styles only — scripts stay far more tightly controlled |
| `font-src`                                | `'self' https://fonts.gstatic.com data:`                    | Geist is self-hosted by `next/font` at build time; the Google Fonts host and `data:` are defensive fallbacks                                                                                                                                                                                                   |
| `connect-src`                             | `'self' <NEXT_PUBLIC_API_URL origin>` (+ `ws: wss:` in dev) | **Allow-lists the backend API origin** so the home page health check and future `fetch()` calls are not blocked. `ws:`/`wss:` are added only in dev for Hot Module Replacement                                                                                                                                 |
| `img-src`                                 | `'self' data: blob:`                                        | Inline/generated images and the favicon                                                                                                                                                                                                                                                                        |
| `frame-ancestors`                         | `'none'`                                                    | Blocks the app from being framed (clickjacking)                                                                                                                                                                                                                                                                |
| `base-uri` / `object-src` / `form-action` | `'self'` / `'none'` / `'self'`                              | Prevent `<base>` hijacking, plugins, and off-origin form posts                                                                                                                                                                                                                                                 |

The backend origin is read from `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).
If you point the app at a different backend, that origin is automatically added to
`connect-src` — no manual CSP edit needed.

#### Verifying the headers at runtime

```bash
npm run build && npm run start
# in another shell:
curl -sI http://localhost:3000 | grep -i -E 'content-security-policy|x-frame|referrer|permissions|content-type-options'
```

Load each page (`/`, `/invoices`, `/invest`) with DevTools open and confirm there are
**no CSP violation messages** in the console, that the Geist font renders, and that the
**Check API Health** button still reaches the backend.

#### Threat-model note

These headers harden the app ahead of wallet and API integration that will handle
financial data. The CSP is the main mitigation for **cross-site scripting** — even if
attacker-controlled markup reaches the DOM, it cannot load off-origin scripts, exfiltrate
data to an unlisted host (`connect-src`), or be framed for clickjacking (`frame-ancestors`).
`nosniff` and `Referrer-Policy` close common information-leak / content-confusion vectors.
The known residual is `'unsafe-inline'` for **styles** (not scripts): CSS-only injection
remains possible, which is low-impact compared to script execution. The planned next step
is to move to per-request **nonces** via `middleware.js`, which would let us drop
`'unsafe-inline'` from `script-src` entirely.

## License

MIT (see root LiquiFact project for full license).

### Code-splitting: WalletStatus

`WalletStatus` is lazy-loaded via `next/dynamic` (`ssr: false`) so the wallet
chunk (including the upcoming Stellar/Freighter SDK) is **not** shipped in the
initial JS bundle for routes that do not need immediate wallet access
(e.g. the static home page).

| Route       | Before (kB) | After (kB) | Δ     |
| ----------- | ----------- | ---------- | ----- |
| `/` (home)  | ~X kb       | ~X kb      | –Y kb |
| `/invoices` | ~X kb       | ~X kb      | –Y kb |
| `/invest`   | ~X kb       | ~X kb      | –Y kb |

_Run `npm run build` and inspect `.next/static/chunks` to verify. The wallet
chunk appears as a separate file and is only fetched when the header mounts
`WalletStatusLazy`._

**Why `ssr: false`?** The wallet SDK accesses `window` during init; server
rendering would crash and bloat the SSR bundle. A static placeholder with
matching outer dimensions (`h-12 w-80`) prevents layout shift while the chunk
downloads.

**Placeholder → component swap** is handled by `next/dynamic` automatically.
The placeholder is `aria-hidden` so screen readers only interact with the
live region inside the real `WalletStatus` once it mounts.
