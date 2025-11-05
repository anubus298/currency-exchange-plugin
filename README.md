# Currency Exchange Plugin for Medusa

**Package:** `@anubus298/currency-exchange-plugin`

> **Note:** This is an optimized fork of `@kb0912/currency-exchange-plugin` with enhanced features and improvements.

Automatically sync your product prices to the latest exchange rates, supporting multiple currencies. Choose between automatic live rates (from [fawazahmed0/exchange-api](https://github.com/fawazahmed0/currency-api)) or manual rate settings for each currency. Manage everything directly from Medusa Admin—including instant manual price updates!

---

<img width="1505" height="773" alt="Screenshot 2025-07-17 at 16 13 16" src="https://github.com/user-attachments/assets/cc68c6e1-8bd9-4b0f-a212-0a3ce193540a" />

---

## Features

- **Auto-update product prices** based on the latest currency exchange rates and your base currency.
- **Enable/disable each currency** directly from the Admin UI.
- **Switch between "Auto" and "Manual" mode** for each currency.
- **Edit manual exchange rates** for full control.
- **Trigger instant price updates**—no need to wait for a cronjob.
- **Safe:** Disabled currencies will not have their prices changed or deleted.

---

## Installation

```bash
yarn add @anubus298/currency-exchange-plugin
```

or

```bash
npm install @anubus298/currency-exchange-plugin
```

---

## Configuration (in `medusa-config.js` or `.ts`)

```js
const plugins = [
  // ... other plugins
  {
    resolve: "@anubus298/currency-exchange-plugin",
    options: {},
  },
];
```

> **Note:**  
> Base currency will be taken from your Store config if not specified.

### Scheduled Updates

By default, product prices are automatically updated daily at midnight (using cron schedule `0 0 * * *`).

You can customize the update schedule by setting the `CURRENCY_UPDATE_SCHEDULE` environment variable:

```bash
# Example: Update every 6 hours
CURRENCY_UPDATE_SCHEDULE="0 */6 * * *"

# Example: Update every day at 3 AM
CURRENCY_UPDATE_SCHEDULE="0 3 * * *"

# Example: Update every Monday at midnight
CURRENCY_UPDATE_SCHEDULE="0 0 * * 1"
```

---

## Usage in Medusa Admin

Once installed, a **Currency Exchange Settings** page appears in your Admin sidebar.

### 1. Enable/disable currencies

- Toggle the Enable/Disable switch to control which currencies are updated.

### 2. Switch exchange rate mode

- Toggle between **Auto** (fetches rates from exchange-api) and **Manual** (enter your own rate) for each currency.

### 3. Edit manual rates

- If Manual mode is selected, type your desired rate and click **Save**.

### 4. Instant price update

- Click **Update Prices Now** to immediately update all product prices using the latest rates—no need to wait for scheduled jobs!
- The plugin will recalculate and update all enabled currency prices based on the latest exchange rates and your base currency.

---

## Exchange Rate Source

- This plugin uses [fawazahmed0/exchange-api](https://github.com/fawazahmed0/currency-api) as the default source for live rates.
- You can override any rate at any time using Manual mode.

---

## Usage Notes

- **Only enabled currencies** will have their prices updated. Disabled currencies retain their existing prices—nothing is deleted or overwritten.
- You can combine automatic and manual rate management for maximum flexibility.
- All updates can be triggered manually in Admin or scheduled using cron.

---

## License

MIT

---

For questions, feature requests, or issues, please [open an issue](https://github.com/anubus298/currency-exchange-plugin/issues) or contact the maintainer.
