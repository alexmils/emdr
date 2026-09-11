import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { listUserUsage } from "@/lib/usage";
import { getLlmUsageTotals } from "@/lib/llm-usage";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [usage, totals, month] = await Promise.all([
      listUserUsage(),
      getLlmUsageTotals(),
      getLlmUsageTotals({ since: monthStart }),
    ]);
    return NextResponse.json({
      usage,
      llm: {
        allTime: totals,
        thisMonth: month,
      },
    });
  } catch (err) {
    console.error("[admin/usage]", err);
    return NextResponse.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
