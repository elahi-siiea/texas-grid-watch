import type { Metadata } from "next";
import { DataCentersView } from "@/components/DataCentersView";

export const metadata: Metadata = { title: "Data centers and the grid" };

export default function DataCentersPage() {
  return <DataCentersView />;
}
