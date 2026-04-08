import type {DisplayCurrency} from "@/types/currency";
import type {Language} from "@/types/ui";

export const DISPLAY_CURRENCIES: DisplayCurrency[] = ["AZN", "USD", "EUR", "GBP", "RUB"];

export const DEFAULT_DISPLAY_RATES: Record<DisplayCurrency, number> = {
  AZN: 1,
  USD: 0.5882,
  EUR: 0.5093,
  GBP: 0.4443,
  RUB: 46.3886
};

const currencySymbols: Record<DisplayCurrency, string> = {
  AZN: "₼",
  USD: "$",
  EUR: "€",
  GBP: "£",
  RUB: "₽"
};

const currencyLocales: Record<Language, string> = {
  az: "az-Latn-AZ",
  en: "en-GB",
  ru: "ru-RU"
};

export function getCurrencySymbol(currency: DisplayCurrency): string {
  return currencySymbols[currency];
}

export function getDisplayRate(currency: DisplayCurrency, rates: Record<string, number>): number {
  if (currency === "AZN") {
    return 1;
  }
  const rate = rates[currency];
  if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
    return rate;
  }
  return DEFAULT_DISPLAY_RATES[currency];
}

export function convertFromAzn(amountAzn: number, currency: DisplayCurrency, rates: Record<string, number>): number {
  return amountAzn * getDisplayRate(currency, rates);
}

export function formatConvertedPrice(amountAzn: number, currency: DisplayCurrency, rates: Record<string, number>, language: Language): string {
  const converted = convertFromAzn(amountAzn, currency, rates);
  const locale = currencyLocales[language];
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const value = formatter.format(Number.isFinite(converted) ? converted : 0);
  const symbol = getCurrencySymbol(currency);

  if (currency === "AZN") {
    return `${value} ${symbol}`;
  }
  return `${symbol}${value}`;
}

export function resolveDisplayCurrency(value: string | null | undefined): DisplayCurrency {
  if (value && DISPLAY_CURRENCIES.includes(value as DisplayCurrency)) {
    return value as DisplayCurrency;
  }
  return "AZN";
}
