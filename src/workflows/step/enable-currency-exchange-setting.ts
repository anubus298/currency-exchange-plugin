// src/modules/currency-exchange/workflows/steps/enable-currency-exchange-setting.ts

import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CURRENCY_EXCHANGE_MODULE } from "../../modules/currency-exchange";
import CurrencyExchangeService from "../../modules/currency-exchange/service";
import {
  ExchangeRateMode,
  ExchangeRateStatus,
} from "../../modules/currency-exchange/types";

type EnableInput = {
  currency_code: string;
};

export const enableCurrencyExchangeStep = createStep(
  "enable-currency-exchange-setting",
  async (input: EnableInput, { container }) => {
    const currencyExchangeService: CurrencyExchangeService = container.resolve(
      CURRENCY_EXCHANGE_MODULE
    );
    const query = container.resolve("query");

    // Get base currency (default currency from store)
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["supported_currencies.*"],
    });
    const supported = stores[0]?.supported_currencies || [];
    const found = supported.find(
      (currency: any) => currency.is_default === true
    );
    const baseCurrency = found?.currency_code;
    if (!baseCurrency) throw new Error("Base currency not found");

    // Get the latest rate from provider
    const allRates = await currencyExchangeService.getExchangeRates(
      baseCurrency
    );
    const rate = allRates[input.currency_code];
    if (typeof rate !== "number")
      throw new Error(`Exchange rate not found for ${input.currency_code}`);

    // Check if settings already exist for this currency_code
    const [existing] =
      await currencyExchangeService.listCurrencyExchangeSettings({
        currency_code: input.currency_code,
      });

    let result;

    if (existing) {
      // If it already exists (even if disabled), update status = enable, mode = auto, and new exchange_rate
      const [updated] =
        await currencyExchangeService.updateCurrencyExchangeSettings([
          {
            id: existing.id,
            exchange_rate: rate,
            mode: ExchangeRateMode.AUTO,
            status: ExchangeRateStatus.ENABLE,
          },
        ]);
      result = updated;
    } else {
      // Doesn't exist yet, create new
      const [created] =
        await currencyExchangeService.createCurrencyExchangeSettings([
          {
            currency_code: input.currency_code,
            exchange_rate: rate,
            mode: ExchangeRateMode.AUTO,
            status: ExchangeRateStatus.ENABLE,
          },
        ]);
      result = created;
    }

    return new StepResponse(result);
  }
);
