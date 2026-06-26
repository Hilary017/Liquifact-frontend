/**
 * @file lib/types/invoice.js
 * Single source of truth for the invoice data shape used across the marketplace,
 * invoice list, skeleton, and API client.
 */

/**
 * @typedef {Object} Invoice
 * @property {string}  id        - Unique invoice identifier (e.g. "INV-001")
 * @property {string}  issuer    - Name of the invoice issuer / SME
 * @property {number}  amount    - Invoice face value
 * @property {string}  currency  - ISO 4217 currency code (e.g. "USDC")
 * @property {string}  dueDate   - ISO 8601 date string (e.g. "2025-09-30")
 * @property {number}  yield     - Expected annual yield as a percentage (e.g. 8.5)
 * @property {string}  status    - One of: "available" | "funded" | "pending"
 */

/**
 * Valid invoice status values.
 * @readonly
 * @enum {string}
 */
export const INVOICE_STATUS = /** @type {const} */ ({
  AVAILABLE: "available",
  FUNDED: "funded",
  PENDING: "pending",
});