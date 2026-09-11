import { NextResponse } from "next/server";
import { requireAdminAccess, isAuthContext } from "@/lib/api-auth";
import { getAdminFinanceDashboard } from "@/lib/admin-finance";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  try {
    const finance = await getAdminFinanceDashboard();
    return NextResponse.json({ finance });
  } catch (err) {
    console.error("[admin/finance]", err);
    return NextResponse.json({ error: "Failed to load finances" }, { status: 500 });
  }
}
