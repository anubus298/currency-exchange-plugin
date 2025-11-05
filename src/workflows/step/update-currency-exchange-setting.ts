// src/modules/currency-exchange/workflows/steps/update-currency-exchange-setting.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CURRENCY_EXCHANGE_MODULE } from "../../modules/currency-exchange";
import CurrencyExchangeService from "../../modules/currency-exchange/service";
import {
  ExchangeRateMode,
  ExchangeRateStatus,
} from "../../modules/currency-exchange/types";

type UpdateInput = {
  id: string;
  mode?: ExchangeRateMode;
  exchange_rate?: number;
  status?: ExchangeRateStatus;
};

export const updateCurrencyExchangeStep = createStep(
  "update-currency-exchange-setting",
  async (input: UpdateInput, { container }) => {
    const logger = container.resolve("logger");
    const currencyExchangeService: CurrencyExchangeService = container.resolve(
      CURRENCY_EXCHANGE_MODULE
    );
    const query = container.resolve("query");

    logger.info(
      `[CurrencyExchange] Updating currency exchange setting: ${input.id}`
    );

    const [current] =
      await currencyExchangeService.listCurrencyExchangeSettings({
        id: input.id,
      });
    if (!current) {
      logger.error(`[CurrencyExchange] Setting not found with id: ${input.id}`);
      throw new Error("Setting not found");
    }

    logger.debug(
      `[CurrencyExchange] Current setting for ${current.currency_code.toUpperCase()}: mode=${
        current.mode
      }, rate=${current.exchange_rate}, status=${current.status}`
    );

    // Prepare update data
    let updateData: Partial<UpdateInput> & { id: string } = { id: input.id };

    // Update status if provided (enable/disable)
    if (input.status && input.status !== current.status) {
      updateData.status = input.status;
      logger.info(
        `[CurrencyExchange] Status change for ${current.currency_code.toUpperCase()}: ${
          current.status
        } -> ${input.status}`
      );
    }

    // Update mode
    if (
      input.mode === ExchangeRateMode.AUTO &&
      current.mode !== ExchangeRateMode.AUTO
    ) {
      // Switch to auto: fetch rate from provider
      logger.info(
        `[CurrencyExchange] Switching ${current.currency_code.toUpperCase()} to AUTO mode`
      );

      const { data: stores } = await query.graph({
        entity: "store",
        fields: ["supported_currencies.*"],
      });

      const supported = stores[0]?.supported_currencies || [];
      const found = supported.find((c: any) => c.is_default === true);
      const baseCurrency = found?.currency_code;
      if (!baseCurrency) {
        logger.error("[CurrencyExchange] Base currency not found in store");
        throw new Error("Base currency not found");
      }

      logger.debug(
        `[CurrencyExchange] Fetching exchange rates from provider with base currency: ${baseCurrency.toUpperCase()}`
      );
      const rates = await currencyExchangeService.getExchangeRates(
        baseCurrency
      );

      const newRate = rates[current.currency_code];
      if (typeof newRate !== "number") {
        logger.warn(
          `[CurrencyExchange] No exchange rate found for ${current.currency_code.toUpperCase()} from provider`
        );
      } else {
        logger.info(
          `[CurrencyExchange] Fetched AUTO rate for ${current.currency_code.toUpperCase()}: ${newRate}`
        );
      }

      updateData.exchange_rate = newRate;
      updateData.mode = ExchangeRateMode.AUTO;
    } else if (
      input.mode === ExchangeRateMode.MANUAL &&
      current.mode !== ExchangeRateMode.MANUAL
    ) {
      logger.info(
        `[CurrencyExchange] Switching ${current.currency_code.toUpperCase()} to MANUAL mode`
      );
      updateData.mode = ExchangeRateMode.MANUAL;
      if (typeof input.exchange_rate === "number") {
        updateData.exchange_rate = input.exchange_rate;
        logger.info(
          `[CurrencyExchange] Setting manual rate for ${current.currency_code.toUpperCase()}: ${
            input.exchange_rate
          }`
        );
      } else {
        logger.debug(
          `[CurrencyExchange] No rate provided, keeping current rate: ${current.exchange_rate}`
        );
      }
    } else if (typeof input.exchange_rate === "number") {
      // Only update rate (only applies to manual mode)
      logger.info(
        `[CurrencyExchange] Updating exchange rate for ${current.currency_code.toUpperCase()}: ${
          current.exchange_rate
        } -> ${input.exchange_rate}`
      );
      updateData.exchange_rate = input.exchange_rate;
    }

    const updateFields = Object.keys(updateData).filter((k) => k !== "id");
    if (updateFields.length === 0) {
      logger.info(
        `[CurrencyExchange] No changes detected for ${current.currency_code.toUpperCase()}`
      );
    } else {
      logger.info(
        `[CurrencyExchange] Applying updates to ${current.currency_code.toUpperCase()}: ${updateFields.join(
          ", "
        )}`
      );
    }

    const [updated] =
      await currencyExchangeService.updateCurrencyExchangeSettings([
        updateData,
      ]);

    logger.info(
      `[CurrencyExchange] Successfully updated currency exchange setting for ${current.currency_code.toUpperCase()}`
    );
    return new StepResponse(updated);
  }
);
