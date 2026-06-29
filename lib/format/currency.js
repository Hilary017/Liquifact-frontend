const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'USD';
const INVALID_VALUE_FALLBACK = '—';

function normalizeNumericValue(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/,/g, '').replace(/%$/, '');

    if (normalized === '') {
      return null;
    }

    const numericValue = Number(normalized);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function createFormatter(locale, options) {
  try {
    return new Intl.NumberFormat(locale || DEFAULT_LOCALE, options);
  } catch {
    return new Intl.NumberFormat(DEFAULT_LOCALE, options);
  }
}

/**
 * Format a numeric value as currency using locale-aware grouping.
 *
 * Invalid, null, undefined, or NaN values return a display-safe fallback.
 *
 * @param {number|string|null|undefined} value
 * @param {object} [options]
 * @param {string} [options.currency='USD']
 * @param {string} [options.locale='en-US']
 * @returns {string}
 */
export function formatCurrency(
  value,
  { currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE } = {},
) {
  const numericValue = normalizeNumericValue(value);

  if (numericValue === null) {
    return INVALID_VALUE_FALLBACK;
  }

  const currencyCode =
    typeof currency === 'string' && currency.trim()
      ? currency.trim().toUpperCase()
      : DEFAULT_CURRENCY;

  try {
    return createFormatter(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
    }).format(numericValue);
  } catch {
    return createFormatter(locale, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
    }).format(numericValue);
  }
}

/**
 * Format a numeric amount with locale-aware grouping and no currency symbol.
 *
 * Invalid, null, undefined, or NaN values return a display-safe fallback.
 *
 * @param {number|string|null|undefined} value
 * @param {object} [options]
 * @param {string} [options.locale='en-US']
 * @param {number} [options.minimumFractionDigits=0]
 * @param {number} [options.maximumFractionDigits=2]
 * @returns {string}
 */
export function formatAmount(
  value,
  {
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = {},
) {
  const numericValue = normalizeNumericValue(value);

  if (numericValue === null) {
    return INVALID_VALUE_FALLBACK;
  }

  return createFormatter(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}

export { DEFAULT_CURRENCY, DEFAULT_LOCALE, INVALID_VALUE_FALLBACK };
