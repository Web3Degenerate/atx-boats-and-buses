// A vehicle's optional charge is treated as a captain's fee when its admin label
// mentions "captain" (for example "20% Captain's Fee"). Customers choose at checkout
// whether to prepay it; otherwise they agree to pay the captain directly.
export function isCaptainFee(label: string | null | undefined): boolean {
  return /captain/i.test(label ?? "");
}

export const CAPTAIN_FEE_DAY_OF_STATEMENT =
  "We agree to pay a 20% captain's fee to the captain directly the day of the booking.";
