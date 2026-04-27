import { NextRequest, NextResponse } from "next/server";
import { runSearch } from "@/lib/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Enter at least 2 characters to search." },
      { status: 400 }
    );
  }

  try {
    const response = await runSearch(query);
    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PriceGap search failed unexpectedly.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

