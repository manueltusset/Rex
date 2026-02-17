import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useMcpStore } from "@/stores/useMcpStore";
import type { McpServerStatus } from "@/types/mcp";

function statusDot(status: string) {
  if (status === "ok") return "bg-primary";
  if (status === "error") return "bg-danger";
  return "bg-muted-subtle";
}

function statusLabel(status: string) {
  if (status === "ok") return { text: "Connected", cls: "bg-primary/10 text-primary border-primary/20" };
  if (status === "error") return { text: "Error", cls: "bg-danger/10 text-danger border-danger/20" };
  return { text: "Unknown", cls: "bg-ring-bg text-muted border-border" };
}

function typeBadge(serverType: string) {
  const colors: Record<string, string> = {
    stdio: "bg-usage-sonnet/10 text-usage-sonnet border-usage-sonnet/20",
    http: "bg-usage-session/10 text-usage-session border-usage-session/20",
    sse: "bg-usage-weekly/10 text-usage-weekly border-usage-weekly/20",
  };
  return colors[serverType] ?? "bg-ring-bg text-muted border-border";
}

function scopeLabel(scope: string) {
  if (scope === "user") return "User";
  if (scope === "project") return "Project";
  return "Local";
}

function ServerCard({ server }: { server: McpServerStatus }) {
  const badge = statusLabel(server.status);
  const dot = statusDot(server.status);

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-foreground">{server.name}</h4>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeBadge(server.server_type)}`}>
              {server.server_type.toUpperCase()}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          {server.url && (
            <p className="text-xs text-muted font-mono truncate">{server.url}</p>
          )}
          {server.command && (
            <p className="text-xs text-muted font-mono truncate">
              {server.command}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-muted-subtle uppercase tracking-wide">
              {scopeLabel(server.scope)}
            </span>
            {server.project_path && (
              <span className="text-[10px] text-muted-subtle font-mono truncate">
                {server.project_path.split("/").slice(-2).join("/")}
              </span>
            )}
          </div>

          {server.error_message && (
            <div className="mt-2 px-2 py-1.5 rounded bg-danger/5 border border-danger/10">
              <p className="text-xs text-danger">{server.error_message}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function McpStatusPage() {
  const { servers, isLoading, lastChecked, error, fetch } = useMcpStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const connectedCount = servers.filter((s) => s.status === "ok").length;
  const errorCount = servers.filter((s) => s.status === "error").length;

  return (
    <>
      <header className="flex justify-between items-end mb-8">
        <div>
          <p className="text-xs font-medium text-primary mb-2 font-mono tracking-widest uppercase opacity-80">
            Integrations
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
              MCP Servers
            </h2>
            {servers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface border border-border text-muted">
                {servers.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-muted-subtle font-mono">
              {new Date(lastChecked).toLocaleTimeString()}
            </span>
          )}
          <Button variant="secondary" onClick={fetch}>
            {isLoading ? <Spinner size="sm" /> : <Icon name="refresh" size="sm" />}
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <Card className="mb-6 border-danger/30">
          <div className="flex items-center gap-3 text-danger">
            <Icon name="error" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {servers.length > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-muted">{connectedCount} connected</span>
          </div>
          {errorCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border">
              <div className="w-2 h-2 rounded-full bg-danger" />
              <span className="text-xs text-danger">{errorCount} error</span>
            </div>
          )}
        </div>
      )}

      {isLoading && servers.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center min-h-[200px]">
            <Spinner />
          </div>
        </Card>
      ) : servers.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
            <Icon name="hub" size="xl" className="text-muted-subtle opacity-30" />
            <div className="text-center">
              <p className="text-sm text-muted mb-1">No MCP servers configured</p>
              <p className="text-xs text-muted-subtle">
                Configure MCP servers in Claude Code with{" "}
                <code className="px-1 py-0.5 rounded bg-surface text-xs font-mono">claude mcp add</code>
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => (
            <ServerCard key={`${server.scope}-${server.name}-${server.project_path ?? ""}`} server={server} />
          ))}
        </div>
      )}
    </>
  );
}
