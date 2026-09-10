const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Formats cents-precision dollar amounts, negative values as "-$50.00" (credits) rather than "$-50.00". */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}
