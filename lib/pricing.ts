export const SALES_TAX_RATE = 0.0825;
export const SALES_TAX_PERCENT_LABEL = "8.25%";

export function dollarsToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function centsToDollars(amount: number): number {
  return amount / 100;
}

export function calculateSalesTaxCents(taxableAmountCents: number): number {
  return Math.round(taxableAmountCents * SALES_TAX_RATE);
}
