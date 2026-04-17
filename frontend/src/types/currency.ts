export type DisplayCurrency = "AZN" | "USD" | "EUR";

export type CurrencyRateApiResponse = {
  result?: string;
  baseCode?: string;
  base_code?: string;
  timeLastUpdateUnix?: number;
  time_last_update_unix?: number;
  timeLastUpdateUtc?: string;
  time_last_update_utc?: string;
  timeNextUpdateUnix?: number;
  time_next_update_unix?: number;
  timeNextUpdateUtc?: string;
  time_next_update_utc?: string;
  conversionRates?: Record<string, number>;
  conversion_rates?: Record<string, number>;
};

export type CurrencyRateResponse = {
  result: string;
  baseCode: string;
  timeLastUpdateUnix: number;
  timeLastUpdateUtc: string;
  timeNextUpdateUnix: number;
  timeNextUpdateUtc: string;
  conversionRates: Record<string, number>;
};
