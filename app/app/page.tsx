import { AppProvider } from "@/app/components/AppProvider";
import { AppShell } from "@/app/components/AppShell";

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
