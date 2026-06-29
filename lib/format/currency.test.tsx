import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  INVALID_VALUE_FALLBACK,
  formatAmount,
  formatCurrency,
} from './currency';

describe('formatCurrency', () => {
  it('formats numbers with the default USD currency and locale-aware grouping', () => {
    expect(formatCurrency(12500)).toBe('$12,500');
  });

  it('accepts numeric strings that already contain grouping separators', () => {
    expect(formatCurrency('12,500.75')).toBe('$12,500.75');
  });

  it('uses the requested currency code', () => {
    expect(formatCurrency(7800, { currency: 'EUR' })).toBe('€7,800');
  });

  it('uses the requested locale', () => {
    expect(formatCurrency(12500, { currency: 'USD', locale: 'en-IN' })).toBe(
      '$12,500',
    );
    expect(formatCurrency(1250000, { currency: 'INR', locale: 'en-IN' })).toBe(
      '₹12,50,000',
    );
  });

  it('falls back when currency or locale options are invalid', () => {
    expect(formatCurrency(50, { currency: 'not-a-code' })).toBe('$50');
    expect(formatCurrency(50, { currency: 'USD', locale: 'bad-locale' })).toBe(
      '$50',
    );
    expect(formatCurrency(50.25, { currency: 'not-a-code' })).toBe('$50.25');
  });

  it('falls back to documented defaults for blank options', () => {
    expect(formatCurrency(50, { currency: '', locale: '' })).toBe('$50');
    expect(formatCurrency(50, { currency: 123 as unknown as string })).toBe(
      '$50',
    );
  });

  it('returns a safe fallback for null, undefined, empty, and NaN values', () => {
    expect(formatCurrency(null)).toBe(INVALID_VALUE_FALLBACK);
    expect(formatCurrency(undefined)).toBe(INVALID_VALUE_FALLBACK);
    expect(formatCurrency('')).toBe(INVALID_VALUE_FALLBACK);
    expect(formatCurrency(Number.NaN)).toBe(INVALID_VALUE_FALLBACK);
  });
});

describe('formatAmount', () => {
  it('formats numeric amounts with locale-aware grouping', () => {
    expect(formatAmount(1234567.89)).toBe('1,234,567.89');
  });

  it('accepts percent-like numeric strings for yield display', () => {
    expect(formatAmount('8.25%')).toBe('8.25');
  });

  it('supports locale overrides', () => {
    expect(formatAmount(1250000, { locale: 'en-IN' })).toBe('12,50,000');
  });

  it('supports explicit fraction digit options', () => {
    expect(
      formatAmount(8, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    ).toBe('8.0');
  });

  it('returns a safe fallback for invalid input', () => {
    expect(formatAmount(null)).toBe(INVALID_VALUE_FALLBACK);
    expect(formatAmount(undefined)).toBe(INVALID_VALUE_FALLBACK);
    expect(formatAmount('not-a-number')).toBe(INVALID_VALUE_FALLBACK);
    expect(formatAmount(Infinity)).toBe(INVALID_VALUE_FALLBACK);
  });
});

describe('format constants', () => {
  it('exports documented defaults', () => {
    expect(DEFAULT_CURRENCY).toBe('USD');
    expect(DEFAULT_LOCALE).toBe('en-US');
    expect(INVALID_VALUE_FALLBACK).toBe('—');
  });
});
