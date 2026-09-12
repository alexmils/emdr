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

    const weekStart = new Date();
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    const [usage, totals, month, week, voiceMonth, voiceWeek, voiceAll] =
      await Promise.all([
        listUserUsage(),
        getLlmUsageTotals(),
        getLlmUsageTotals({ since: monthStart }),
        getLlmUsageTotals({ since: weekStart }),
        getLlmUsageTotals({ since: monthStart, purposes: ["voice"] }),
        getLlmUsageTotals({ since: weekStart, purposes: ["voice"] }),
        getLlmUsageTotals({ purposes: ["voice"] }),
      ]);
    return NextResponse.json({
      usage,
      llm: {
        allTime: totals,
        thisMonth: month,
        thisWeek: week,
      },
      voice: {
        allTime: voiceAll,
        thisMonth: voiceMonth,
        thisWeek: voiceWeek,
      },
    });
  } catch (err) {
    console.error("[admin/usage]", err);
    return NextResponse.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
