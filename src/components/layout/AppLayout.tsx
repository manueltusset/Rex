import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { ROUTES } from "@/utils/constants";

export function AppLayout() {
  const { isConnected, claudeDir } = useConnectionStore();
  const location = useLocation();

  useAutoRefresh();

  if (!isConnected || !claudeDir) {
    return <Navigate to={ROUTES.CONNECT} replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto relative">
          <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[350px] bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.04),transparent_70%)]" />
          <div key={location.pathname} className="animate-page-in relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
