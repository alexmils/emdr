import { AppProvider } from "./components/AppProvider";
import { Sidebar } from "./components/Sidebar";
import { SessionWorkspace } from "./components/SessionWorkspace";

export default function Home() {
  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <SessionWorkspace />
      </div>
    </AppProvider>
  );
}
