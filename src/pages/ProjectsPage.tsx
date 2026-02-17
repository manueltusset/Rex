import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useSessionStore } from "@/stores/useSessionStore";
import { useStatsStore } from "@/stores/useStatsStore";
import { formatRelativeTime, formatCurrency, formatTokenCount, formatDuration } from "@/utils/formatters";
import type { ProjectMetrics } from "@/types/stats";

function shortModelName(model: string): string {
  return model.replace("claude-", "").replace(/-\d{8,}$/, "");
}

function MetricItem({ label, value }: { label: string; value: string }) {
  if (value === "--") return null;
  return (
    <div className="text-center">
      <p className="text-xs font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-subtle">{label}</p>
    </div>
  );
}

function ModelBreakdown({ modelUsage }: { modelUsage: Record<string, { costUSD: number | null }> }) {
  const models = Object.entries(modelUsage)
    .map(([name, data]) => ({ name: shortModelName(name), cost: data.costUSD ?? 0 }))
    .filter((m) => m.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3);

  if (models.length === 0) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-x-3 gap-y-1">
      {models.map((m) => (
        <span key={m.name} className="text-[10px] text-muted-subtle font-mono">
          {m.name} <span className="text-foreground font-bold">{formatCurrency(m.cost)}</span>
        </span>
      ))}
    </div>
  );
}

export function ProjectsPage() {
  const { sessions } = useSessionStore();
  const { projectMetrics } = useStatsStore();

  // Indexar metricas por path
  const metricsMap = useMemo(() => {
    const map = new Map<string, ProjectMetrics>();
    for (const m of projectMetrics) {
      map.set(m.projectPath, m);
    }
    return map;
  }, [projectMetrics]);

  // Agrupa sessoes por projeto
  const projects = useMemo(() => {
    const map = new Map<string, { path: string; display: string; count: number; lastActive: string }>();
    for (const session of sessions) {
      const existing = map.get(session.project_path);
      if (existing) {
        existing.count += 1;
        if (session.last_timestamp > existing.lastActive) {
          existing.lastActive = session.last_timestamp;
        }
      } else {
        map.set(session.project_path, {
          path: session.project_path,
          display: session.project_display,
          count: 1,
          lastActive: session.last_timestamp,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastActive.localeCompare(a.lastActive));
  }, [sessions]);

  // Totais
  const totals = useMemo(() => {
    let cost = 0;
    let tokens = 0;
    let linesAdded = 0;
    let linesRemoved = 0;
    let cacheRead = 0;
    for (const m of projectMetrics) {
      cost += m.lastCost ?? 0;
      tokens += (m.lastTotalInputTokens ?? 0) + (m.lastTotalOutputTokens ?? 0);
      linesAdded += m.lastLinesAdded ?? 0;
      linesRemoved += m.lastLinesRemoved ?? 0;
      cacheRead += m.lastTotalCacheReadInputTokens ?? 0;
    }
    return { cost, tokens, linesAdded, linesRemoved, cacheRead };
  }, [projectMetrics]);

  const hasTotals = totals.cost > 0 || totals.tokens > 0;

  return (
    <>
      <header className="mb-8">
        <p className="text-xs font-medium text-primary mb-2 font-mono tracking-widest uppercase opacity-80">
          Workspace
        </p>
        <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
          Projects
        </h2>
      </header>

      {/* Barra de resumo */}
      {hasTotals && (
        <Card className="mb-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Icon name="bar_chart" size="sm" className="text-muted" />
              <span className="text-xs font-bold text-foreground">Summary</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {totals.cost > 0 && (
                <span className="text-muted">
                  Cost: <span className="text-foreground font-bold">{formatCurrency(totals.cost)}</span>
                </span>
              )}
              {totals.tokens > 0 && (
                <span className="text-muted">
                  Tokens: <span className="text-foreground font-bold">{formatTokenCount(totals.tokens)}</span>
                </span>
              )}
              {totals.cacheRead > 0 && (
                <span className="text-muted">
                  Cache: <span className="text-foreground font-bold">{formatTokenCount(totals.cacheRead)} read</span>
                </span>
              )}
              {(totals.linesAdded > 0 || totals.linesRemoved > 0) && (
                <span className="text-muted">
                  Lines: <span className="text-primary font-bold">+{formatTokenCount(totals.linesAdded)}</span>
                  {" / "}
                  <span className="text-danger font-bold">-{formatTokenCount(totals.linesRemoved)}</span>
                </span>
              )}
              <span className="text-muted">
                Projects: <span className="text-foreground font-bold">{projects.length}</span>
              </span>
            </div>
          </div>
        </Card>
      )}

      {projects.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-muted-subtle">
            <Icon name="folder_off" size="xl" className="mb-4 opacity-30" />
            <p>No projects found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const metrics = metricsMap.get(project.path);
            const hasMetrics = metrics && ((metrics.lastCost ?? 0) > 0 || (metrics.lastTotalInputTokens ?? 0) > 0);
            const hasCacheData = (metrics?.lastTotalCacheReadInputTokens ?? 0) > 0;
            const hasModelUsage = metrics?.lastModelUsage && Object.keys(metrics.lastModelUsage).length > 0;

            return (
              <Card key={project.path}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary-light">
                    <Icon name="folder_open" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground font-mono truncate">
                        {project.display}
                      </p>
                      {metrics?.githubRepo && (
                        <a
                          href={`https://github.com/${metrics.githubRepo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-subtle hover:text-primary transition-colors shrink-0"
                          title={metrics.githubRepo}
                        >
                          <Icon name="open_in_new" size="sm" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-subtle truncate mt-0.5">
                      {project.path}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge>
                    {project.count} session{project.count > 1 ? "s" : ""}
                  </Badge>
                  <span className="text-xs text-muted-subtle font-mono">
                    {formatRelativeTime(project.lastActive)}
                  </span>
                </div>
                {hasMetrics && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-around gap-2">
                    <MetricItem label="Cost" value={formatCurrency(metrics.lastCost)} />
                    <MetricItem
                      label="Tokens"
                      value={formatTokenCount(
                        ((metrics.lastTotalInputTokens ?? 0) + (metrics.lastTotalOutputTokens ?? 0)) || null
                      )}
                    />
                    {((metrics.lastLinesAdded ?? 0) > 0 || (metrics.lastLinesRemoved ?? 0) > 0) && (
                      <div className="text-center">
                        <p className="text-xs font-bold">
                          <span className="text-primary">+{formatTokenCount(metrics.lastLinesAdded)}</span>
                          {" / "}
                          <span className="text-danger">-{formatTokenCount(metrics.lastLinesRemoved)}</span>
                        </p>
                        <p className="text-[10px] text-muted-subtle">Lines</p>
                      </div>
                    )}
                    <MetricItem label="Duration" value={formatDuration(metrics.lastDuration)} />
                  </div>
                )}
                {hasCacheData && (
                  <div className="mt-2 flex items-center gap-1.5 px-2">
                    <Icon name="cached" size="sm" className="text-muted-subtle" />
                    <span className="text-[10px] text-muted-subtle">
                      Cache: <span className="text-foreground">{formatTokenCount(metrics!.lastTotalCacheReadInputTokens)} read</span>
                    </span>
                  </div>
                )}
                {hasModelUsage && (
                  <ModelBreakdown modelUsage={metrics!.lastModelUsage!} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
