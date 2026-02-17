import { useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useStatsStore } from "@/stores/useStatsStore";
import { formatCurrency, formatNumber, formatDate, formatTokenCount, formatDuration } from "@/utils/formatters";

// Paleta de cores para atribuicao dinamica
const COLOR_PALETTE = [
  "#10b981", "#60a5fa", "#fb923c", "#a78bfa",
  "#f472b6", "#f59e0b", "#ef4444", "#14b8a6",
  "#8b5cf6", "#06b6d4",
];

function shortModelName(model: string): string {
  return model.replace("claude-", "").replace(/-\d{8,}$/, "");
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface/50 border border-border/50 flex-1 min-w-0">
      <Icon name={icon} size="sm" className="text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-subtle">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// Tooltip para o grafico de atividade diaria
function ActivityTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-muted-subtle font-mono mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs text-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          <span className="font-bold">{p.value}</span> {p.dataKey === "messages" ? "messages" : "tool calls"}
        </p>
      ))}
    </div>
  );
}

// Tooltip para o grafico de tokens por modelo
function TokensTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-muted-subtle font-mono mb-1">{label}</p>
      <p className="text-xs text-foreground font-bold mb-1">{formatTokenCount(total)} total</p>
      {payload.filter((p) => p.value > 0).map((p) => (
        <p key={p.dataKey} className="text-[10px] text-muted">
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: p.color }} />
          {p.dataKey}: {formatTokenCount(p.value)}
        </p>
      ))}
    </div>
  );
}

// Heatmap de atividade por hora
function HourHeatmap({ hourCounts }: { hourCounts: Record<string, number> }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxCount = Math.max(...Object.values(hourCounts), 1);

  return (
    <div>
      <p className="text-[10px] text-muted-subtle uppercase tracking-wide mb-2">Activity by Hour</p>
      <div className="flex gap-1">
        {hours.map((h) => {
          const count = hourCounts[String(h)] ?? 0;
          const opacity = count > 0 ? Math.max(0.15, count / maxCount) : 0.05;
          return (
            <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full h-5 rounded-sm"
                style={{ backgroundColor: `rgba(16, 185, 129, ${opacity})` }}
                title={`${h}:00 - ${count} session${count !== 1 ? "s" : ""}`}
              />
              {h % 6 === 0 && (
                <span className="text-[8px] text-muted-subtle">{h}h</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StatsOverview() {
  const { globalStats, projectMetrics } = useStatsStore();

  // Custo total de todos os projetos
  const totalCost = useMemo(() => {
    return projectMetrics.reduce((sum, m) => sum + (m.lastCost ?? 0), 0);
  }, [projectMetrics]);

  // Hora mais ativa
  const peakHour = useMemo(() => {
    if (!globalStats?.hourCounts) return null;
    const entries = Object.entries(globalStats.hourCounts);
    if (entries.length === 0) return null;
    const [hour] = entries.sort(([, a], [, b]) => b - a)[0];
    return `${hour.padStart(2, "0")}:00`;
  }, [globalStats]);

  // Dados do grafico de atividade (ultimos 30 dias)
  const activityData = useMemo(() => {
    if (!globalStats?.dailyActivity) return [];
    return globalStats.dailyActivity.slice(-30).map((d) => ({
      date: d.date.slice(5),
      messages: d.messageCount,
      toolCalls: d.toolCallCount,
    }));
  }, [globalStats]);

  // Coletar todos os modelos unicos e atribuir cores dinamicamente
  const allModelNames = useMemo(() => {
    const names = new Set<string>();
    if (globalStats?.dailyModelTokens) {
      for (const day of globalStats.dailyModelTokens) {
        for (const model of Object.keys(day.tokensByModel)) {
          names.add(shortModelName(model));
        }
      }
    }
    if (globalStats?.modelUsage) {
      for (const model of Object.keys(globalStats.modelUsage)) {
        names.add(shortModelName(model));
      }
    }
    return Array.from(names).sort();
  }, [globalStats]);

  // Mapa de cores dinamico: cada modelo recebe uma cor da paleta
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allModelNames.forEach((name, i) => {
      map[name] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    });
    return map;
  }, [allModelNames]);

  // Dados do grafico de tokens por modelo (ultimos 30 dias)
  const tokenData = useMemo(() => {
    if (!globalStats?.dailyModelTokens) return [];
    return globalStats.dailyModelTokens.slice(-30).map((day) => {
      const entry: Record<string, string | number> = { date: day.date.slice(5) };
      for (const [model, tokens] of Object.entries(day.tokensByModel)) {
        entry[shortModelName(model)] = tokens;
      }
      return entry;
    });
  }, [globalStats]);

  // Uso por modelo (ordenado por custo)
  const modelBreakdown = useMemo(() => {
    if (!globalStats?.modelUsage) return [];
    return Object.entries(globalStats.modelUsage)
      .map(([model, usage]) => ({
        model: shortModelName(model),
        fullModel: model,
        cost: usage.costUSD ?? 0,
        tokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [globalStats]);

  if (!globalStats) return null;

  const longestSession = globalStats.longestSession;

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="bar_chart" size="sm" className="text-muted" />
        <h3 className="text-sm font-bold text-foreground">Activity Overview</h3>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        <StatCard
          icon="chat"
          label="Total Sessions"
          value={formatNumber(globalStats.totalSessions)}
        />
        <StatCard
          icon="forum"
          label="Total Messages"
          value={formatNumber(globalStats.totalMessages)}
        />
        <StatCard
          icon="payments"
          label="Total Cost"
          value={totalCost > 0 ? formatCurrency(totalCost) : "--"}
        />
        {peakHour && (
          <StatCard
            icon="schedule"
            label="Peak Hour"
            value={peakHour}
          />
        )}
        {longestSession?.duration && (
          <StatCard
            icon="timer"
            label="Longest Session"
            value={`${formatDuration(longestSession.duration)} (${longestSession.messageCount ?? 0} msgs)`}
          />
        )}
        <StatCard
          icon="calendar_today"
          label="Member Since"
          value={formatDate(globalStats.firstSessionDate)}
        />
      </div>

      {/* Grafico de atividade diaria */}
      {activityData.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <p className="text-[10px] text-muted-subtle uppercase tracking-wide">Daily Activity (Last 30 Days)</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] text-muted-subtle">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                Messages
              </span>
              <span className="flex items-center gap-1 text-[9px] text-muted-subtle">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--color-usage-sonnet)" }} />
                Tool Calls
              </span>
            </div>
          </div>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "var(--color-muted-subtle)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "var(--color-muted-subtle)" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip content={<ActivityTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="messages" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="toolCalls" fill="var(--color-usage-sonnet)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grafico de tokens por modelo */}
      {tokenData.length > 0 && allModelNames.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <p className="text-[10px] text-muted-subtle uppercase tracking-wide">Tokens by Model (Last 30 Days)</p>
            <div className="flex items-center gap-3">
              {allModelNames.map((name) => (
                <span key={name} className="flex items-center gap-1 text-[9px] text-muted-subtle">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[name] }} />
                  {name}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokenData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "var(--color-muted-subtle)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "var(--color-muted-subtle)" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  tickFormatter={(v: number) => formatTokenCount(v)}
                />
                <Tooltip content={<TokensTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
                {allModelNames.map((name) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stackId="tokens"
                    stroke={colorMap[name]}
                    fill={colorMap[name]}
                    fillOpacity={0.3}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Heatmap de atividade por hora */}
      {Object.keys(globalStats.hourCounts).length > 0 && (
        <div className="mb-4">
          <HourHeatmap hourCounts={globalStats.hourCounts} />
        </div>
      )}

      {/* Uso por modelo */}
      {modelBreakdown.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-subtle uppercase tracking-wide mb-2">Model Usage</p>
          <div className="space-y-1.5">
            {modelBreakdown.map((m) => (
              <div key={m.model} className="flex items-center gap-3 px-2 py-1.5 rounded-md bg-surface/30">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: colorMap[m.model] ?? COLOR_PALETTE[0] }}
                />
                <span className="text-xs text-foreground font-mono flex-1 truncate">{m.model}</span>
                {m.tokens > 0 && (
                  <span className="text-[10px] text-muted-subtle">{formatTokenCount(m.tokens)} tokens</span>
                )}
                {m.cost > 0 && (
                  <span className="text-xs font-bold text-foreground w-16 text-right">{formatCurrency(m.cost)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
