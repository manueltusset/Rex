import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { ROUTES } from "@/utils/constants";

export function AppLayout() {
  const { isConnected, claudeDir } = useConnectionStore();

  useAutoRefresh();

  if (!isConnected || !claudeDir) {
    return <Navigate to={ROUTES.CONNECT} replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
