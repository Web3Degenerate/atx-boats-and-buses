import type { Metadata } from "next";
import { ReactNode } from "react";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Test Page",
  description: "Internal ATX Boats & Buses test page.",
  path: "/test1",
  noIndex: true
});

export default function Test1Layout({ children }: { children: ReactNode }) {
  return children;
}
