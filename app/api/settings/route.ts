import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type SettingRow = {
  key: string;
  value: string;
};

function parseSettingValue(value: string): string | boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}

// Only these keys are safe to expose publicly — site_settings also holds
// admin-only values (e.g. booking alert recipients).
const PUBLIC_SETTING_KEYS = ["fuel_charge_enabled"];

export async function GET() {
  try {
    const result = await query<SettingRow>(
      "SELECT key, value FROM site_settings WHERE key = ANY($1)",
      [PUBLIC_SETTING_KEYS]
    );

    const settings = result.rows.reduce<Record<string, string | boolean>>((acc: Record<string, string | boolean>, row: SettingRow) => {
      acc[row.key] = parseSettingValue(row.value);
      return acc;
    }, {});

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
