import type {Language} from "@/types/ui";
import {useMemo} from "react";
import {DEFAULT_DISPLAY_RATES} from "@/utils/currency";

type HeaderCurrencyTickerProps = {
  language: Language;
  baseCode: string;
  rates: Record<string, number>;
};

type CurrencyItem = {
  code: string;
  rate: number;
};

const tickerCurrencies = ["USD", "EUR", "GBP", "RUB"] as const;

export default function HeaderCurrencyTicker({language, baseCode, rates}: HeaderCurrencyTickerProps) {
  const items = useMemo(() => {
    return tickerCurrencies.map((code) => ({
      code,
      rate: resolveTickerRate(code, rates)
    }));
  }, [rates]);

  const tickerItems = useMemo(() => [...items, ...items, ...items, ...items], [items]);
  const locale = language === "ru" ? "ru-RU" : language === "en" ? "en-GB" : "az-Latn-AZ";

  return (
    <div className="header-currency-strip border-b border-brand-500/18">
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6">
        <div className="header-currency-ticker">
          <div className="header-currency-track" aria-live="polite">
            {tickerItems.map((item, index) => (
              <span key={`${item.code}-${index}`} className="header-currency-chip">
                <span className="header-currency-code">{item.code}</span>
                <span className="theme-muted text-[11px]">1 {baseCode} = {formatCurrencyRate(item.rate, locale)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function resolveTickerRate(code: (typeof tickerCurrencies)[number], rates: Record<string, number>): number {
  const rate = rates[code];
  if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) {
    return rate;
  }
  return DEFAULT_DISPLAY_RATES[code];
}

function formatCurrencyRate(value: number, locale: string): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const digits = value >= 100 ? 2 : value >= 1 ? 3 : 4;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}
