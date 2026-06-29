// lib/api/invoices.js
import { loadEnv } from "../config/env";

/**
 * Fetch investable invoices from the backend API.
 *
 * @param {Object} options
 * @param {AbortSignal} [options.signal] - Optional AbortSignal to cancel the request.
 * @returns {Promise<Array<Object>>} Resolves to an array of normalized invoice objects.
 * @throws {Error} Throws when the network request fails, the response status is not OK,
 *                 or when the response payload is not an array.
 */
export async function fetchInvestableInvoices({ signal } = {}) {
  // Validate at call time so a misconfigured base URL fails loudly here rather
  // than being concatenated blindly into the request.
  const baseUrl = loadEnv().apiUrl;
  const url = `${baseUrl.replace(/\/+$/, "")}/invoices`;

  const response = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.status} ${response.statusText}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (e) {
    throw new Error("Response is not valid JSON");
  }

  if (!Array.isArray(payload)) {
    throw new Error("Invoice payload is not an array");
  }

  // Normalize each invoice to the UI contract, guarding against missing fields.
  const normalized = payload.map((inv) => {
    const {
      id = null,
      issuer = null,
      amount = null,
      currency = null,
      dueDate = null,
      yield: invYield = null,
      status = null,
    } = inv || {};
    return { id, issuer, amount, currency, dueDate, yield: invYield, status };
  });

  return normalized;
}
