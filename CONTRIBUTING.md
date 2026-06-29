# Contributing to LiquiFact Frontend

Thanks for improving the LiquiFact frontend. This guide keeps contribution setup, review expectations, and campaign workflow in one place.

## Local Setup

Use Node.js 20 and npm 9 or newer.

```bash
npm ci
cp .env.local.example .env.local # optional
npm run dev
```

The app runs at `http://localhost:3000`. Set `NEXT_PUBLIC_API_URL` in `.env.local` when testing against a non-default backend.

## Branches and Commits

Create branches from `main` using a focused name:

```text
<type>/<area>-<issue-number>-<short-slug>
```

Examples:

```text
docs/community-106-contributing-templates
fix/invoices-42-empty-state
feature/wallet-18-connect-flow
```

Use conventional commit style where practical, such as `docs: add contributor templates` or `fix: handle upload errors`.

## Checks

Run the checks that match your change before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

CI currently runs `npm ci`, `npm run lint`, and `npm test --silent` on pull requests to `main`. Run `npm run build` locally for UI or routing changes because the build command is part of the documented workflow even when a PR only changes a small surface.

## Formatting

The project uses **Prettier** to enforce a consistent code style.

- Run `npm run format` to reformat the entire codebase.
- CI includes a `format:check` step (`npm run format:check`) that fails if any file is not properly formatted.
- The configuration lives in `.prettierrc` and `.prettierignore`.
- This gate ensures that all contributions adhere to the same style before merging.

## Testing and Accessibility

The repo uses Jest, React Testing Library, `@testing-library/user-event`, and `jest-axe` for component and accessibility checks.

- Prefer user-facing role, label, and text assertions.
- Cover loading, empty, success, and error states when touching UI flows.
- Keep `jest-axe` checks for components that render interactive or landmark content.
- Use Playwright only for end-to-end smoke paths that need browser behavior.

## UI Guidelines

Follow the existing App Router structure under `app/` and reuse shared components under `components/` before adding new primitives. Keep Tailwind classes consistent with nearby pages, preserve keyboard focus behavior, and do not commit generated build output.

## Pull Request Checklist

Before requesting review, confirm:

- The PR references the issue with `Closes #<issue-number>`.
- Lint and tests were run, or the reason is documented.
- UI changes include accessible labels, focus states, and relevant tests.
- Documentation was updated for setup, workflow, or behavior changes.
- No secrets, `.env` files, wallet keys, or generated artifacts were committed.

## Community and Campaign

This repository is part of the GrantFox OSS / Official Campaign. Use the LiquiFact Discord linked in campaign issues for coordination, review questions, and reward follow-up after eligible merged work.
