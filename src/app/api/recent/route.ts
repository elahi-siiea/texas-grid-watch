import { NextResponse } from "next/server";
import { getRecent } from "@/lib/data/service";

export const maxDuration = 60;

export async function GET() {
  const payload = await getRecent();
  const ttl = payload.meta.source === "eia" ? 3600 : 300;
  return NextResponse.json(payload, {
    headers: { "Cache-Control": `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}` },
  });
}
