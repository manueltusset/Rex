import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/components/ui/Icon";
import { useConnectionStore } from "@/stores/useConnectionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useAccountStore } from "@/stores/useAccountStore";
import { usePlatform } from "@/hooks/usePlatform";
import { formatBillingType, formatDate } from "@/utils/formatters";
import { ROUTES, APP_VERSION } from "@/utils/constants";

export function SettingsPage() {
  const navigate = useNavigate();
  const { claudeDir, useWsl, wslDistro, orgId, setClaudeDir, setUseWsl, setWslDistro, disconnect } =
    useConnectionStore();
  const { refreshInterval, setRefreshInterval, notificationsEnabled, setNotificationsEnabled, theme, setTheme } = useSettingsStore();
  const account = useAccountStore((s) => s.account);
  const { isWindows, isWslAvailable, wslDistros } = usePlatform();

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
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Settings
        </h2>
      </header>

      <div className="space-y-6 max-w-2xl">
        {/* Conexao */}
        <Card>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="link" className="text-primary-light" />
            Connection
          </h3>
          <div className="space-y-3 text-sm">
            {account?.displayName && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Display Name</span>
                <span className="text-foreground">{account.displayName}</span>
              </div>
            )}
            {account?.emailAddress && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Email</span>
                <span className="text-foreground font-mono text-xs">{account.emailAddress}</span>
              </div>
            )}
            {account?.organizationName && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Organization</span>
                <span className="text-foreground text-xs">{account.organizationName}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">Organization ID</span>
              <span className="text-foreground font-mono text-xs">{orgId || "--"}</span>
            </div>
            {account?.organizationRole && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Role</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                  {account.organizationRole}
                </span>
              </div>
            )}
            {account?.billingType && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Billing</span>
                <span className="text-foreground text-xs">{formatBillingType(account.billingType)}</span>
              </div>
            )}
            {account?.subscriptionCreatedAt && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Subscribed Since</span>
                <span className="text-foreground font-mono text-xs">{formatDate(account.subscriptionCreatedAt)}</span>
              </div>
            )}
            {account?.hasExtraUsageEnabled != null && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted">Extra Usage</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                  account.hasExtraUsageEnabled
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-ring-bg text-muted border-border"
                }`}>
                  {account.hasExtraUsageEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-muted">Status</span>
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
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
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
            <div className="mt-4 space-y-4">
              <Toggle
                checked={useWsl}
                onChange={(val) => setUseWsl(val)}
                label="WSL Mode"
                description="Read sessions and resume via WSL"
              />
              {useWsl && wslDistros.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground-secondary">
                    WSL Distribution
                  </label>
                  <select
                    value={wslDistro}
                    onChange={(e) => setWslDistro(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-sm font-mono text-foreground focus:border-primary/40 focus:outline-none transition-colors cursor-pointer"
                  >
                    {wslDistros.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
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
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
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
                    : "bg-surface text-muted border border-transparent hover:border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Tema */}
        <Card>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="palette" className="text-primary-light" />
            Theme
          </h3>
          <div className="flex gap-2">
            {([
              { label: "Light", value: "light" as const },
              { label: "Dark", value: "dark" as const },
              { label: "System", value: "system" as const },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  theme === opt.value
                    ? "bg-primary/20 text-primary-light border border-primary/30"
                    : "bg-surface text-muted border border-transparent hover:border-border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Notificacoes */}
        <Card>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="notifications" className="text-primary-light" />
            Notifications
          </h3>
          <Toggle
            checked={notificationsEnabled}
            onChange={(val) => setNotificationsEnabled(val)}
            label="Usage Alerts"
            description="Notify when usage reaches 80%, 90%, or 100%"
          />
        </Card>

        {/* Info */}
        <Card>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="info" className="text-primary-light" />
            About
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted">Version</span>
              <span className="text-foreground font-mono">{APP_VERSION}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted">Runtime</span>
              <span className="text-foreground font-mono">Tauri v2</span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
