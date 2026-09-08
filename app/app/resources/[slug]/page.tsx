import { notFound } from "next/navigation";
import { AppProvider } from "@/app/components/AppProvider";
import { ResourceArticleShell } from "@/app/components/ResourceArticleShell";
import { SidebarNavProvider } from "@/app/components/SidebarNavContext";
import { getResourceBySlug } from "@/lib/resources-content";

export default async function ResourceArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getResourceBySlug(slug);
  if (!item || !item.body) notFound();

  return (
    <AppProvider>
      <SidebarNavProvider>
        <ResourceArticleShell item={item} />
      </SidebarNavProvider>
    </AppProvider>
  );
}
