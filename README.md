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

| Command            | Description                     |
|-------------------|---------------------------------|
| `npm run dev`     | Start dev server (Turbopack)   |
| `npm run lint`    | Run ESLint                      |
| `npm test`        | Run accessibility tests (Jest) |
| `npm run build`   | Production build                |
| `npm run start`   | Start production server         |

Default: http://localhost:3000. The home page can check API health at `NEXT_PUBLIC_API_URL` (default http://localhost:3001).

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

---

## Design Tokens

Global tokens are defined in `app/globals.css` and used across all components.

| Token             | Value     | Tailwind equivalent |
|-------------------|-----------|--------------------|
| `--color-bg`      | `#0f0f0f` | `slate-950`        |
| `--color-primary` | `#06b6d4` | `cyan-400`         |

Font: **Geist** is loaded via `next/font/google` (see `app/layout.js`). Headings use `font-bold`; body copy uses the default weight.

---

## Testing

See [TESTING.md](TESTING.md) for the full guide covering Jest unit/accessibility tests and Playwright end‑to‑end setup.

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

## Development

| Command         | Description                |
|-----------------|----------------------------|
| `npm run dev`   | Start dev server (Turbopack) |
| `npm run build` | Production build           |
| `npm run start` | Start production server   |
| `npm run lint`  | Run ESLint                 |
| `npm run test:e2e` | Run Playwright smoke tests |

Default: [http://localhost:3000](http://localhost:3000). The home page can check API health at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

### Marketplace search

The Invest page (`app/invest/page.js`) includes an issuer search field above the invoice list. Typing in the field filters invoices by case-insensitive substring match on `issuer`. Input is debounced at **200ms** to avoid thrashing on every keystroke. When a filter is active, the `aria-live` status region announces the match count (e.g. "2 of 3 invoices match"). A distinct "no matches" state is shown when the filter yields zero results, separate from the empty-marketplace state.

---

## Project structure

```
liquifact-frontend/
├── app/
│   ├── layout.js      # Root layout, LiquiFact metadata
│   ├── page.js        # Home (wallet CTA, API health check)
│   ├── invoices/      # Invoices placeholder page
│   └── invest/       # Invest placeholder page
├── public/
├── .env.local.example
├── eslint.config.mjs
└── package.json
```

Tech: **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**.

---

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

- **Lint** — `npm run lint`
- **Build** — `npm run build`

Keep both passing before opening a PR.

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

See [COMPONENTS.md](COMPONENTS.md) for the full component library reference — props, accessibility notes, and usage examples for every shared component (`ErrorBanner`, `Footer`, `InvoiceListSkeleton`, `ToastProvider`, `UploadZone`, `WalletStatus`).

## Design Tokens

- **Colors**
  - `--color-bg`: `#0f0f0f` (slate‑950)
  - `--color-primary`: `#06b6d4` (cyan‑400)

- **Typography**
  - Font family: **Geist** – imported via `@fontsource/geist`.
  - Headings use `font‑bold`, body uses `font‑regular`.

## Testing

See [TESTING.md](TESTING.md) for the full guide covering Jest unit/accessibility tests and Playwright end-to-end setup.

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

## License

MIT (see root LiquiFact project for full license).
