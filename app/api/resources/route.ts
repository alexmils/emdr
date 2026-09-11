import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { listPublishedResources } from "@/lib/resources-db";
import { isResourceKind, postToResourceCard } from "@/lib/resources";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const kindRaw = searchParams.get("kind");
  const featured = searchParams.get("featured") === "1";
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;

  const kind = kindRaw && isResourceKind(kindRaw) ? kindRaw : undefined;

  const posts = await listPublishedResources({
    kind,
    featuredOnly: featured,
    limit:
      limit && Number.isFinite(limit) && limit > 0
        ? Math.min(50, Math.round(limit))
        : undefined,
  });

  return NextResponse.json({
    resources: posts.map(postToResourceCard),
  });
}
