import type { Metadata } from "next";
import { PatternsView } from "@/components/PatternsView";

export const metadata: Metadata = { title: "Daily patterns" };

export default function DailyPatternsPage() {
  return <PatternsView />;
}
