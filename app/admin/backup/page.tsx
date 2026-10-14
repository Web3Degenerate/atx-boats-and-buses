"use client";

import { useState } from "react";

// Rows per request, kept small for tables that hold signatures and PDFs so each
// response stays well under the hosting size limit.
const PAGE_SIZE: Record<string, number> = { signed_waivers: 3, waiver_minors: 100 };
const DEFAULT_PAGE_SIZE = 200;

type Row = Record<string, unknown>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("\\x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

// ---------- minimal ZIP writer (stored, no compression; PDFs are already compressed)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files: { name: string; data: Uint8Array }[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, file.data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, size, true);
    entry.setUint32(24, size, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);

    offset += 30 + name.length + size;
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], { type: "application/zip" });
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function safe(value: unknown) {
  return String(value ?? "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

export default function AdminBackupPage() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<{ tables: Record<string, number>; pdfs: number } | null>(null);

  async function runBackup() {
    setRunning(true);
    setError("");
    setDone(null);

    try {
      setStatus("Counting records...");
      const countsResponse = await fetch("/api/admin/backup", { cache: "no-store" });
      if (!countsResponse.ok) throw new Error("You need to be signed in as a full admin to run a backup.");
      const { counts } = (await countsResponse.json()) as { counts: Record<string, number | null> };

      const tables: Record<string, Row[]> = {};

      for (const [table, count] of Object.entries(counts)) {
        if (count === null) continue;
        const rows: Row[] = [];
        const limit = PAGE_SIZE[table] ?? DEFAULT_PAGE_SIZE;

        for (let offset = 0; offset < count; offset += limit) {
          setStatus(`Downloading ${table.replace(/_/g, " ")}: ${Math.min(offset + limit, count)} of ${count}`);
          const response = await fetch(`/api/admin/backup?table=${table}&offset=${offset}&limit=${limit}`, { cache: "no-store" });
          if (!response.ok) throw new Error(`Failed while downloading ${table}. Try again.`);
          const page = (await response.json()) as { rows: Row[] };
          rows.push(...page.rows);
        }

        if (rows.length !== count) {
          throw new Error(`Expected ${count} ${table} records but received ${rows.length}. Try again.`);
        }

        tables[table] = rows;
      }

      setStatus("Building waiver PDFs...");
      const tripDates = new Map<string, string>();
      for (const link of tables.waiver_links ?? []) tripDates.set(String(link.id), String(link.trip_date ?? ""));

      const pdfFiles: { name: string; data: Uint8Array }[] = [];
      for (const waiver of tables.signed_waivers ?? []) {
        if (typeof waiver.pdf_data !== "string" || !waiver.pdf_data) continue;
        const tripDate = tripDates.get(String(waiver.waiver_link_id)) || "no-date";
        const name = `${tripDate}_${safe(waiver.last_name)}_${safe(waiver.first_name)}_${String(waiver.id).slice(0, 8)}.pdf`;
        pdfFiles.push({ name, data: hexToBytes(waiver.pdf_data) });
      }
      pdfFiles.sort((a, b) => a.name.localeCompare(b.name));

      setStatus("Saving files...");
      const backup = { exportedAt: new Date().toISOString(), source: window.location.origin, counts, tables };
      saveBlob(new Blob([JSON.stringify(backup)], { type: "application/json" }), `ATX-full-backup-${today()}.json`);
      if (pdfFiles.length > 0) {
        saveBlob(buildZip(pdfFiles), `ATX-signed-waivers-${today()}.zip`);
      }

      const tableCounts: Record<string, number> = {};
      for (const [table, rows] of Object.entries(tables)) tableCounts[table] = rows.length;
      setDone({ tables: tableCounts, pdfs: pdfFiles.length });
      setStatus("");
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : "Backup failed. Try again.");
      setStatus("");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-6 py-10 text-slate-900">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Backup</h1>
        <p className="text-slate-600">
          Downloads a complete copy of the website&rsquo;s data, including every signed waiver ever collected, past and
          upcoming. Nothing on the site is changed.
        </p>
      </div>

      <button
        type="button"
        onClick={runBackup}
        disabled={running}
        className="rounded-md bg-slate-900 px-5 py-2 font-semibold text-white hover:bg-slate-700 disabled:opacity-70"
      >
        {running ? "Working..." : "Download complete backup"}
      </button>

      {status && <p className="text-slate-700">{status}</p>}
      {error && <p className="text-red-600">{error}</p>}

      {done && (
        <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-900">
            Backup complete: {done.pdfs} signed waiver PDFs and a full data file were saved to your Downloads folder.
          </p>
          <ul className="grid grid-cols-2 gap-x-6 text-slate-700">
            {Object.entries(done.tables).map(([table, count]) => (
              <li key={table}>
                {table.replace(/_/g, " ")}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
