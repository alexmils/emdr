import { NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/api-auth";
import { getPublishedResourceBySlug } from "@/lib/resources-db";
import { postToResourceItem } from "@/lib/resources";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth();
  if (!isAuthContext(auth)) return auth;

  const { slug } = await context.params;
  const post = await getPublishedResourceBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ resource: postToResourceItem(post) });
}
