// currency-exchange.js
const exchangeRates = [
  { flag: '🇺🇸', symbol: '$', code: 'USD', rate: 1.00, amount: 100 },
  { flag: '🇪🇺', symbol: '€', code: 'EUR', rate: 0.92, amount: 92 },
  { flag: '🇬🇧', symbol: '£', code: 'GBP', rate: 0.79, amount: 79 },
  { flag: '🇯🇵', symbol: '¥', code: 'JPY', rate: 148.50, amount: 14850 },
  { flag: '🇨🇳', symbol: '¥', code: 'CNY', rate: 7.18, amount: 718 },
  { flag: '🇮🇳', symbol: '₹', code: 'INR', rate: 83.12, amount: 8312 },
  { flag: '🇨🇦', symbol: '$', code: 'CAD', rate: 1.35, amount: 135 },
  { flag: '🇦🇺', symbol: '$', code: 'AUD', rate: 1.52, amount: 152 }
];

console.log("💰 Currency Exchange Rates");
console.log("=".repeat(50));

// Calculate column widths
const flagWidth = Math.max(...exchangeRates.map(r => Bun.stringWidth(r.flag)));
const symbolWidth = Math.max(...exchangeRates.map(r => Bun.stringWidth(r.symbol)));
const codeWidth = Math.max(...exchangeRates.map(r => Bun.stringWidth(r.code)));
const rateWidth = Math.max(...exchangeRates.map(r => Bun.stringWidth(r.rate.toFixed(2))));
const amountWidth = Math.max(...exchangeRates.map(r => Bun.stringWidth(r.amount.toLocaleString())));

// Header
console.log(
  ' '.repeat(flagWidth) + '  ' +
  ' '.repeat(symbolWidth) + '  ' +
  'Code'.padEnd(codeWidth) + '  ' +
  'Rate'.padStart(rateWidth) + '  ' +
  'Amount'.padStart(amountWidth)
);
console.log("-".repeat(50));

// Data rows
exchangeRates.forEach(({ flag, symbol, code, rate, amount }) => {
  const flagPadding = ' '.repeat(flagWidth - Bun.stringWidth(flag));
  const symbolPadding = ' '.repeat(symbolWidth - Bun.stringWidth(symbol));
  const codePadding = ' '.repeat(codeWidth - Bun.stringWidth(code));
  const rateStr = rate.toFixed(2).padStart(rateWidth);
  const amountStr = amount.toLocaleString().padStart(amountWidth);
  
  console.log(
    `${flag}${flagPadding}  ` +
    `${symbol}${symbolPadding}  ` +
    `${code}${codePadding}  ` +
    `${rateStr}  ` +
    `${amountStr}`
  );
});

console.log("\n💡 Note: All symbols align perfectly regardless of");
console.log("  - Flag emoji width (🇺🇸 = 2 cols, 🇬🇧 = 2 cols)");
console.log("  - Currency symbol width (¥ = 1 col, $ = 1 col)");
console.log("  - Number formatting with commas");
