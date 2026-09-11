import { AdminShell } from "@/app/components/admin/AdminShell";
import { ToastProvider } from "@/app/components/Toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AdminShell>{children}</AdminShell>
    </ToastProvider>
  );
}
