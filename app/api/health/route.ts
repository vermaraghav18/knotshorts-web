// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "knotshorts-web",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
      },
    }
  );
}

// Some monitors send HEAD instead of GET
export async function HEAD() {
  return new Response(null, { status: 200 });
}
