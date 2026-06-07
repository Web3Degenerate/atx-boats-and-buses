import { NextResponse } from "next/server";
import { getVehicles } from "@/lib/vehicles";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getVehicles());
}
