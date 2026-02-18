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

export async function GET() {
  try {
    const result = await query<SettingRow>("SELECT key, value FROM site_settings");

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
