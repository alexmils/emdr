import { NextResponse } from "next/server";
import {
  isAuthContext,
  requireAdminAccess,
  requirePlatformAdmin,
} from "@/lib/api-auth";
import {
  deleteResource,
  listResourcesAdmin,
  upsertResource,
} from "@/lib/resources-db";
import { isResourceKind } from "@/lib/resources";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const resources = await listResourcesAdmin();
  return NextResponse.json({ resources });
}

export async function POST(request: Request) {
  const auth = await requireAdminAccess();
  if (!isAuthContext(auth)) return auth;

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    resource?: {
      id?: string;
      slug?: string;
      kind?: string;
      title?: string;
      summary?: string;
      body?: string | null;
      coverUrl?: string | null;
      videoUrl?: string | null;
      readMinutes?: number | null;
      featured?: boolean;
      enabled?: boolean;
      sortOrder?: number;
    };
    resourceId?: string;
  };

  if (body.action === "delete" && body.resourceId) {
    const admin = await requirePlatformAdmin();
    if (!isAuthContext(admin)) return admin;
    await deleteResource(body.resourceId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save" && body.resource?.title) {
    const admin = await requirePlatformAdmin();
    if (!isAuthContext(admin)) return admin;
    if (!isResourceKind(body.resource.kind)) {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    const result = await upsertResource({
      id: body.resource.id,
      slug: body.resource.slug ?? "",
      kind: body.resource.kind,
      title: body.resource.title,
      summary: body.resource.summary,
      body: body.resource.body,
      coverUrl: body.resource.coverUrl,
      videoUrl: body.resource.videoUrl,
      readMinutes: body.resource.readMinutes,
      featured: body.resource.featured,
      enabled: body.resource.enabled,
      sortOrder: body.resource.sortOrder,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ resource: result.post });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
