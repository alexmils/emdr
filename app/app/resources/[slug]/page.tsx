import { notFound } from "next/navigation";
import { AppProvider } from "@/app/components/AppProvider";
import { ResourceArticleShell } from "@/app/components/ResourceArticleShell";
import { SidebarNavProvider } from "@/app/components/SidebarNavContext";
import { getPublishedResourceBySlug } from "@/lib/resources-db";
import { postToResourceItem } from "@/lib/resources";

export default async function ResourceArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedResourceBySlug(slug);
  if (!post) notFound();
  if (!post.body && !post.videoUrl) notFound();

  return (
    <AppProvider>
      <SidebarNavProvider>
        <ResourceArticleShell item={postToResourceItem(post)} />
      </SidebarNavProvider>
    </AppProvider>
  );
}
