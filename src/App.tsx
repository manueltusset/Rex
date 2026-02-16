import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConnectionPage } from "@/pages/ConnectionPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { UsagePage } from "@/pages/UsagePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { ROUTES } from "@/utils/constants";

export default function App() {
  const loadFromStore = useConnectionStore((s) => s.loadFromStore);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadFromStore();
    loadSettings();
  }, [loadFromStore, loadSettings]);

  return (
    <Routes>
      <Route path={ROUTES.CONNECT} element={<ConnectionPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
        <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
        <Route path={ROUTES.USAGE} element={<UsagePage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
