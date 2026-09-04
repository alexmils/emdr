import { syncSessionResponse } from "@/lib/auth/refresh-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return syncSessionResponse(request as import("next/server").NextRequest);
}
