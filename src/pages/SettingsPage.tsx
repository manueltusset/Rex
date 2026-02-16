import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { usePlatform } from "@/hooks/usePlatform";
import { ROUTES, APP_VERSION } from "@/utils/constants";

export function SettingsPage() {
  const navigate = useNavigate();
  const { claudeDir, useWsl, orgId, setClaudeDir, setUseWsl, disconnect } =
    useConnectionStore();
  const { refreshInterval, setRefreshInterval } = useSettingsStore();
  const { isWindows, isWslAvailable } = usePlatform();

  const [dirInput, setDirInput] = useState(claudeDir);
  const [saved, setSaved] = useState(false);

  const handleSaveDir = async () => {
    await setClaudeDir(dirInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDisconnect = async () => {
    await disconnect();
    navigate(ROUTES.CONNECT, { replace: true });
  };

  const refreshOptions = [
    { label: "30s", value: 30000 },
    { label: "1m", value: 60000 },
    { label: "2m", value: 120000 },
    { label: "5m", value: 300000 },
  ];

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-light/70 mb-1 font-mono tracking-wide uppercase">
          Configuration
        </p>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Settings
        </h2>
      </header>

      <div className="space-y-6 max-w-2xl">
        {/* Conexao */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="link" className="text-primary-light" />
            Connection
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border-dark">
              <span className="text-slate-400">Organization ID</span>
              <span className="text-white font-mono">{orgId || "--"}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Status</span>
              <span className="text-primary-light font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-light" />
                Connected
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleDisconnect}
            className="mt-4 text-danger hover:text-danger"
          >
            <Icon name="logout" size="sm" />
            Disconnect
          </Button>
        </Card>

        {/* Diretorio */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="folder_open" className="text-primary-light" />
            Claude Directory
          </h3>
          <Input
            label="Path"
            value={dirInput}
            onChange={(e) => setDirInput(e.target.value)}
            icon={<Icon name="folder" />}
          />
          {isWindows && isWslAvailable && (
            <div className="mt-4">
              <Toggle
                checked={useWsl}
                onChange={(val) => setUseWsl(val)}
                label="WSL Mode"
                description="Read sessions and resume via WSL"
              />
            </div>
          )}
          <Button variant="secondary" onClick={handleSaveDir} className="mt-4">
            {saved ? (
              <>
                <Icon name="check" size="sm" />
                Saved
              </>
            ) : (
              <>
                <Icon name="save" size="sm" />
                Save Path
              </>
            )}
          </Button>
        </Card>

        {/* Refresh */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="refresh" className="text-primary-light" />
            Auto Refresh
          </h3>
          <div className="flex gap-2">
            {refreshOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRefreshInterval(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  refreshInterval === opt.value
                    ? "bg-primary/20 text-primary-light border border-primary/30"
                    : "bg-surface-dark text-slate-400 border border-transparent hover:border-border-dark"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Info */}
        <Card>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="info" className="text-primary-light" />
            About
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border-dark">
              <span className="text-slate-400">Version</span>
              <span className="text-white font-mono">{APP_VERSION}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Runtime</span>
              <span className="text-white font-mono">Tauri v2</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
