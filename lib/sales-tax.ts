// Texas sales tax charged on boat charters only. It is applied to the charter price
// after any discount, and not to the optional captain's fee.
export const BOAT_SALES_TAX_RATE = 0.0825;
export const SALES_TAX_LABEL = "Sales Tax (8.25%)";

export function isSalesTaxable(vehicleType: string | null | undefined): boolean {
  return vehicleType === "party-boat";
}
