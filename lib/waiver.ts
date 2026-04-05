import crypto from "crypto";
import { query } from "@/lib/db";

type WaiverLinkRow = {
  id: string;
};

export async function createWaiverLink(
  bookingId: string,
  vehicleType: string,
  guestCount: number,
  tripDate: string
): Promise<string> {
  const token = crypto.randomBytes(24).toString("base64url");

  await query<WaiverLinkRow>(
    `
      INSERT INTO waiver_links (booking_id, token, vehicle_type, guest_count, trip_date)
      VALUES ($1, $2, $3, $4, $5::date)
    `,
    [bookingId, token, vehicleType, guestCount, tripDate]
  );

  return `${process.env.NEXT_PUBLIC_BASE_URL}/waiver/${token}`;
}
