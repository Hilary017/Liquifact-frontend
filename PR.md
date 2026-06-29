# feat: validate and centralize NEXT_PUBLIC_API_URL configuration

Closes #100

## Summary

`NEXT_PUBLIC_API_URL` was read inline (`process.env.NEXT_PUBLIC_API_URL || "…"`)
across several modules and concatenated directly into `fetch()` URLs and the CSP
`connect-src` origin, with no scheme check. A misconfigured or hostile value
(e.g. `javascript:…`, `data:…`, `file:…`) would parse fine and flow straight
into requests.

This PR hardens and centralizes the browser-facing env config in
`lib/config/env.js`, adds **scheme enforcement**, freezes the config object, and
routes every consumer through the helper.

## Changes

- **`lib/config/env.js`**
  - Added `validateUrl()` — parses each URL var via `new URL(...)` **and**
    requires an `http:`/`https:` scheme. Disallowed schemes (`javascript:`,
    `data:`, `file:`, `ftp:`, …) are rejected with a safe, no-stack error.
  - `loadEnv()` now returns an **`Object.freeze`d** config so it can't be
    mutated at runtime.
  - Expanded JSDoc documenting the validation rules and the frozen return type.
- **Consumers** — replaced inline `process.env` reads with the helper:
  - `app/page.js`, `components/UploadZone.jsx` → import the frozen `env` singleton.
  - `lib/api/invoices.js`, `components/WalletProvider.jsx` → call `loadEnv()` at
    point of use so a bad value fails loudly at request/connection time.
- **Docs**
  - `README.md` — documented the http/https scheme rule, the frozen object, the
    consumer list, and the `NEXT_PUBLIC_STELLAR_NETWORK` (`testnet`/`public`) rule.
  - `.env.local.example` — annotated each var with its validation rule.
- **Tests** (`lib/config/env.test.tsx`) — added cases for disallowed schemes
  (`javascript:`, `data:`, `file:`, `ftp:`), https acceptance, trailing-slash,
  empty-string-as-unset, and config immutability (frozen + mutation throws).

## Validation rules

| Variable | Rule |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Well-formed `new URL(...)`, scheme **must** be `http:`/`https:`. Default `http://localhost:3001`. |
| `NEXT_PUBLIC_SITE_URL` | Same URL + scheme rule. Default `http://localhost:3000`. |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Optional; if set must be `testnet` or `public`. Empty string = unset. |

Invalid values fail the build early with a consolidated, grep-friendly message:

```
[env] Environment misconfiguration — fix before deploying:
  • NEXT_PUBLIC_API_URL: "javascript:alert(1)" uses a disallowed scheme "javascript:" — only http/https are permitted
  • NEXT_PUBLIC_STELLAR_NETWORK: "mainnet" must be one of [testnet, public]
```

## Testing

Impacted suites pass (`jest --config jest.config.js`):

```
PASS components/WalletProvider.test.tsx
PASS lib/config/env.test.tsx
PASS lib/api/invoices.test.ts

Test Suites: 3 passed, 3 total
Tests:       59 passed, 59 total
```

`npx eslint` is clean on every file this PR touches.

### Pre-existing issues (not introduced here)

- The repo's `node_modules` was uninstalled; `npm install` was required and a
  missing `@testing-library/dom` peer dep had to be added to run the React suites.
- `components/UploadZone.jsx` (on `main`, line ~363) exports an **undefined**
  `MAX_UPLOAD_BYTES`, which makes Babel/ESLint fail to parse that file and blocks
  a full `npm run build` / whole-repo `npm test`. This is unrelated to this PR
  and should be fixed separately; the UploadZone change here (one import line)
  is otherwise lint-clean.

## Notes for reviewers

- `NEXT_PUBLIC_*` values are inlined by Next.js at build time and shipped to the
  browser — no secrets belong in this file. The loader only handles public config.
- Error messages echo only the (already public) offending value and never a
  stack trace, keeping CI logs safe to share.
