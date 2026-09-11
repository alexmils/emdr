import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { getAdminAnalyticsDashboard } from "@/lib/admin-analytics";

export async function GET(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const days = new URL(request.url).searchParams.get("days");
    const analytics = await getAdminAnalyticsDashboard(days);
    return NextResponse.json({ analytics });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
