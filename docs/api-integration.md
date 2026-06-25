# Frontend API Integration Contract

## Purpose

This document explains how the LiquiFact frontend communicates with the Express backend, outlines the relationship between the two, describes the current mocked state of the application, and serves as the official integration contract for future backend development.

## Base URL Configuration

The frontend determines the backend API URL using the `NEXT_PUBLIC_API_URL` environment variable.

Example configuration in local development:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

In the codebase, this is typically read as follows:
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
fetch(`${API_URL}/health`);
```

This variable should be overridden in staging and production environments to point to the respective backend deployment URLs.

## Relationship to FILTER_CONTRACTS.md

For details regarding query parameter conventions and filter controls implementation, please reference the [FILTER_CONTRACTS.md](../FILTER_CONTRACTS.md) document.

This document focuses on the HTTP payloads, endpoint contracts, and data models for frontend-backend communication.

---

## Current Implementation

The endpoints listed in this section reflect the existing code paths that are actively used in the frontend application today.

### Health Check
> Status: Implemented Today

**Method:** `GET /health`

**Purpose:** Validate backend availability. This is currently invoked on the homepage to display the API status.

**Example request:**
```http
GET /health
```

**Example success response:**
```json
{
  "status": "ok"
}
```

### Upload Invoice
> Status: Implemented Today

**Method:** `POST /invoices`

**Purpose:** Upload and queue an invoice file for tokenization. This is actively used in the `UploadZone` component.

**Request:**
```http
Content-Type: multipart/form-data
```
**Fields:**
- `invoice`: `<invoice document (PDF)>`

**Example using curl:**
```bash
curl -X POST -F "invoice=@invoice.pdf" http://localhost:3001/invoices
```

**Example success response:**
```json
{
  "message": "Upload successful",
  "tokenizationDelay": 1500
}
```

---
## Mock Data Wiring

The frontend currently uses mock invoice data during development. The fixtures are defined in `app/invest/lib.js` which populates the global `window.__TEST_MOCK_INVOICES__` array. This array is consumed by the investment marketplace components to render invoices without a real backend. The `UploadZone.jsx` component posts to `${API_URL}/invoices`, but the response is simulated by the mock layer.

### Source
- **Fixture source**: `app/invest/lib.js` defines `window.__TEST_MOCK_INVOICES__`.
- **Health helper**: `lib/api/health.js` provides a real fetch wrapper for the health check.

### Consumption
- Components import the mock via `import '@/app/invest/lib'` which populates the global variable.
- The mock is used in the investment marketplace pages to display invoice listings.

### Environment Hook
- The mock is activated when `NEXT_PUBLIC_API_URL` points to the default `http://localhost:3001` and no real backend is reachable.

---

## Invoice Resource Contract

The canonical invoice object used in the frontend UI requires the following shape to render correctly in the investment marketplace.

**Canonical object example:**
```json
{
  "id": "inv-001",
  "issuer": "Acme Supplies Ltd",
  "amount": "12,500",
  "currency": "USD",
  "dueDate": "2026-06-15",
  "yield": "8.2%",
  "status": "Open"
}
```

**Field Details:**

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | String | Yes | Unique identifier for the invoice |
| `issuer` | String | Yes | Name of the issuing entity |
| `amount` | String/Numeric | Yes | The invoice amount (formatted string with commas in mock, can adapt to numeric in future) |
| `currency` | String | Yes | ISO currency code (e.g., USD, EUR) |
| `dueDate` | String | Yes | Maturity date in ISO-8601 format (YYYY-MM-DD) |
| `yield` | String/Numeric | Yes | Estimated yield percentage |
| `status` | String | Yes | Current state of the invoice. Documented value in UI mock: "Open" |

*Note: The frontend currently renders the `amount` and `yield` as strings, but a robust API integration should ideally provide these as numbers (e.g. `amount: 12500`, `yield: 8.2`) leaving formatting to the frontend presentation layer. For now, strings are shown based on the current mocked state.*

---

## Planned Backend Endpoints

These endpoints are **not** fully wired into the frontend today but represent the expected integration contract for the marketplace and invoice listings.

### Retrieve Invoices
> Status: Planned Future Integration

**Method:** `GET /invoices`

**Purpose:** Retrieve invoice listings for the investment marketplace.

**Query params:** Reference [FILTER_CONTRACTS.md](../FILTER_CONTRACTS.md) for supported filter and sort parameters.

**Example request:**
```http
GET /invoices?status=Open&page=1
```

**Example success response:**
```json
{
  "data": [
    {
      "id": "inv-001",
      "issuer": "Acme Supplies Ltd",
      "amount": "12,500",
      "currency": "USD",
      "dueDate": "2026-06-15",
      "yield": "8.2%",
      "status": "Open"
    }
  ],
  "meta": {
    "page": 1,
    "total": 1
  }
}
```

### Retrieve Single Invoice
> Status: Planned Future Integration

**Method:** `GET /invoices/:id`

**Purpose:** Retrieve details for a single invoice.

**Example request:**
```http
GET /invoices/inv-001
```

**Example success response:**
```json
{
  "data": {
    "id": "inv-001",
    "issuer": "Acme Supplies Ltd",
    "amount": "12,500",
    "currency": "USD",
    "dueDate": "2026-06-15",
    "yield": "8.2%",
    "status": "Open"
  }
}
```

---

## Error Handling Contract

The frontend relies on standard error responses and HTTP status codes to surface issues to users appropriately.

### Standard Error Response Shape

APIs should return error responses matching the following structure:

```json
{
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "Invoice not found"
  }
}
```

**Optional Validation Error Shape:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": {
      "field": "invoice"
    }
  }
}
```
*(Alternatively, simple `{"message": "Upload failed"}` is supported for compatibility with current `UploadZone` logic.)*

### HTTP Status Codes

| HTTP Status | Meaning | Frontend Behavior |
|-------------|---------|-------------------|
| `400` | Bad Request / Validation | Show validation details or standard error message |
| `401` | Unauthorized | Prompt login or wallet connection |
| `403` | Forbidden | Show access denied message |
| `404` | Not Found | Show not found state |
| `422` | Unprocessable Entity | Highlight invalid fields (e.g., in upload forms) |
| `429` | Too Many Requests | Show rate limit warning, encourage retry later |
| `500` | Internal Server Error | Show generic failure message |
| `503` | Service Unavailable | Show temporary outage message |

### Frontend Error Surfacing Guidance

The application uses two distinct components to display errors to users:

- **ErrorBanner**: Use for persistent page-level failures. Network failures, failed page initialization (like an inability to load the invoice marketplace), or when the backend is entirely unavailable should use `ErrorBanner`.
- **ToastProvider**: Use for transient user actions and mutation outcomes. If an upload succeeded or failed, or for brief retry notifications, use `ToastProvider` via the `useToast` hook.

---

## Network Failure Scenarios

Handling network-level and unpredictable failures is critical to maintaining a robust user experience:

- **Timeout / Offline**: If a request times out or the user is offline, an `ErrorBanner` should notify the user of the network disconnection, ideally with a prompt to check their connection and reload.
- **Invalid JSON**: If the backend returns malformed JSON or an unexpected HTML response (such as from a proxy error), the frontend parser will fail. These should be caught as generic parsing errors and handled as persistent page-level failures (`ErrorBanner`).
- **Unreachable Backend**: Triggered when the server is down or `NEXT_PUBLIC_API_URL` points to an invalid host. The `Check API Health` feature will catch this gracefully, but data-fetching pages like the marketplace will need to render a fallback error state (`ErrorBanner`).
- **Missing `NEXT_PUBLIC_API_URL`**: The app defaults to `http://localhost:3001` if this variable is unset. If the local backend is not running, it will result in an "Unreachable Backend" scenario.

---

## Contract Version

**Version:** v1.0
**Last updated:** Documentation Update

This contract reflects the mocked frontend state as of today and sets the baseline for the upcoming full backend integration.
