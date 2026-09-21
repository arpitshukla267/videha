export const REPORTING_CURRENCY = "INR";

export interface ExchangeRateSnapshot {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  capturedAt: Date;
}

export interface BillReportingAmountINR {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
}

export interface OrderReportingAmountINR {
  orderValue: number;
  amountPaid: number;
  amountDue: number;
}

const DEFAULT_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  USD: 83,
  EUR: 90,
  GBP: 105,
  AED: 22.6,
  SGD: 62,
  AUD: 55,
  CAD: 61,
  JPY: 0.55,
  CNY: 11.5,
};

function parseEnvRate(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildRatesTable(): Record<string, number> {
  const rates: Record<string, number> = { ...DEFAULT_RATES_TO_INR };
  for (const currency of Object.keys(DEFAULT_RATES_TO_INR)) {
    if (currency === "INR") continue;
    rates[currency] = parseEnvRate(`${currency}_TO_INR`, DEFAULT_RATES_TO_INR[currency]);
  }
  rates.USD = parseEnvRate("USD_TO_INR", rates.USD);
  rates.EUR = parseEnvRate("EUR_TO_INR", rates.EUR);
  return rates;
}

let cachedRates: Record<string, number> | null = null;

export function getExchangeRatesToINR(): Record<string, number> {
  if (!cachedRates) cachedRates = buildRatesTable();
  return cachedRates;
}

export function normalizeCurrencyCode(currency: string | null | undefined): string {
  return String(currency || "USD")
    .trim()
    .toUpperCase();
}

export function getExchangeRateToINR(currency: string | null | undefined): number {
  const code = normalizeCurrencyCode(currency);
  if (code === REPORTING_CURRENCY) return 1;
  const rates = getExchangeRatesToINR();
  return rates[code] ?? rates.USD;
}

export function createExchangeRateSnapshot(currency: string | null | undefined): ExchangeRateSnapshot {
  const fromCurrency = normalizeCurrencyCode(currency);
  return {
    fromCurrency,
    toCurrency: REPORTING_CURRENCY,
    rate: getExchangeRateToINR(fromCurrency),
    capturedAt: new Date(),
  };
}

export function convertAmountToINR(
  amount: number,
  currency: string | null | undefined,
  snapshot?: ExchangeRateSnapshot | null,
): { amountINR: number; snapshot: ExchangeRateSnapshot } {
  const safeAmount = Number(amount) || 0;
  const fx = snapshot ?? createExchangeRateSnapshot(currency);
  const amountINR = Math.round(safeAmount * fx.rate * 100) / 100;
  return { amountINR, snapshot: fx };
}

export function buildBillReportingAmounts(
  amounts: {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
  },
  currency: string | null | undefined,
  existingSnapshot?: ExchangeRateSnapshot | null,
): { reportingAmountINR: BillReportingAmountINR; exchangeRateSnapshot: ExchangeRateSnapshot } {
  const snapshot = existingSnapshot ?? createExchangeRateSnapshot(currency);
  const rate = snapshot.rate;
  const convert = (value: number) => Math.round((Number(value) || 0) * rate * 100) / 100;

  return {
    exchangeRateSnapshot: snapshot,
    reportingAmountINR: {
      subtotal: convert(amounts.subtotal),
      taxAmount: convert(amounts.taxAmount),
      totalAmount: convert(amounts.totalAmount),
      amountPaid: convert(amounts.amountPaid),
      amountDue: convert(amounts.amountDue),
    },
  };
}

export function buildOrderReportingAmounts(
  amounts: { orderValue: number; amountPaid: number; amountDue: number },
  currency: string | null | undefined,
  existingSnapshot?: ExchangeRateSnapshot | null,
): { reportingAmountINR: OrderReportingAmountINR; exchangeRateSnapshot: ExchangeRateSnapshot } {
  const snapshot = existingSnapshot ?? createExchangeRateSnapshot(currency);
  const rate = snapshot.rate;
  const convert = (value: number) => Math.round((Number(value) || 0) * rate * 100) / 100;

  return {
    exchangeRateSnapshot: snapshot,
    reportingAmountINR: {
      orderValue: convert(amounts.orderValue),
      amountPaid: convert(amounts.amountPaid),
      amountDue: convert(amounts.amountDue),
    },
  };
}

export function resolveBillPaidINR(
  bill: {
    amountPaid?: number;
    currency?: string;
    reportingAmountINR?: BillReportingAmountINR | null;
    exchangeRateSnapshot?: ExchangeRateSnapshot | null;
  },
): number {
  if (bill.reportingAmountINR?.amountPaid != null) {
    return bill.reportingAmountINR.amountPaid;
  }
  return convertAmountToINR(
    Number(bill.amountPaid) || 0,
    bill.currency,
    bill.exchangeRateSnapshot,
  ).amountINR;
}

export function resolveBillDueINR(
  bill: {
    amountDue?: number;
    currency?: string;
    reportingAmountINR?: BillReportingAmountINR | null;
    exchangeRateSnapshot?: ExchangeRateSnapshot | null;
  },
): number {
  if (bill.reportingAmountINR?.amountDue != null) {
    return bill.reportingAmountINR.amountDue;
  }
  return convertAmountToINR(
    Number(bill.amountDue) || 0,
    bill.currency,
    bill.exchangeRateSnapshot,
  ).amountINR;
}
