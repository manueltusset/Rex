import { useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useStatsStore } from "@/stores/useStatsStore";
import { formatCurrency, formatTokenCount } from "@/utils/formatters";

// Paleta de cores para atribuicao dinamica
export const COLOR_PALETTE = [
  "#10b981", "#60a5fa", "#fb923c", "#a78bfa",
  "#f472b6", "#f59e0b", "#ef4444", "#14b8a6",
  "#8b5cf6", "#06b6d4",
];

export function shortModelName(model: string): string {
  return model.replace("claude-", "").replace(/-\d{8,}$/, "");
}

// Sub-componente exportavel: card de metrica
export function StatCard({ icon, label, value, className = "" }: { icon: string; label: string; value: string; className?: string }) {
  return (
    <Card className={`flex flex-col items-center justify-center gap-2 text-center ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center">
        <Icon name={icon} size="md" className="text-primary" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[11px] text-muted-subtle uppercase tracking-wide mt-0.5">{label}</p>
      </div>
    </Card>
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
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-elevation-3 backdrop-blur-lg">
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
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-elevation-3 backdrop-blur-lg">
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

// Sub-componente exportavel: grafico de atividade diaria
export function DailyActivityChart({ data }: { data: Array<{ date: string; messages: number; toolCalls: number }> }) {
  if (data.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <p className="text-[10px] text-muted-subtle uppercase tracking-wide">Daily Activity</p>
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
      <div className="h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
            <Tooltip content={<ActivityTooltip />} cursor={false} />
            <Bar dataKey="messages" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={4} />
            <Bar dataKey="toolCalls" fill="var(--color-usage-sonnet)" radius={[3, 3, 0, 0]} barSize={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Sub-componente exportavel: grafico de tokens por modelo
export function TokensByModelChart({
  data,
  modelNames,
  colorMap,
}: {
  data: Array<Record<string, string | number>>;
  modelNames: string[];
  colorMap: Record<string, string>;
}) {
  if (data.length === 0 || modelNames.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        <p className="text-[10px] text-muted-subtle uppercase tracking-wide">Tokens by Model</p>
        <div className="flex items-center gap-3 flex-wrap">
          {modelNames.map((name) => (
            <span key={name} className="flex items-center gap-1 text-[9px] text-muted-subtle">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[name] }} />
              {name}
            </span>
          ))}
        </div>
      </div>
      <div className="h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              {modelNames.map((name) => (
                <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorMap[name]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={colorMap[name]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
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
            <Tooltip content={<TokensTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
            {modelNames.map((name) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stackId="tokens"
                stroke={colorMap[name]}
                fill={`url(#grad-${name})`}
                fillOpacity={1}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Sub-componente exportavel: heatmap de atividade por hora
export function HourHeatmap({ hourCounts }: { hourCounts: Record<string, number> }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxCount = Math.max(...Object.values(hourCounts), 1);

  if (Object.keys(hourCounts).length === 0) return null;

  return (
    <div>
      <p className="text-[10px] text-muted-subtle uppercase tracking-wide mb-3">Activity by Hour</p>
      <div className="flex gap-1">
        {hours.map((h) => {
          const count = hourCounts[String(h)] ?? 0;
          const opacity = count > 0 ? Math.max(0.08, count / maxCount) : 0.03;
          return (
            <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full h-6 rounded"
                style={{
                  backgroundColor: count > 0
                    ? `rgba(16, 185, 129, ${opacity})`
                    : "rgba(255, 255, 255, 0.02)",
                  boxShadow: count > 0 && opacity > 0.5
                    ? "inset 0 -1px 0 rgba(16, 185, 129, 0.3)"
                    : "none",
                }}
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

// Sub-componente exportavel: uso por modelo
export function ModelBreakdown({
  models,
  colorMap,
}: {
  models: Array<{ model: string; cost: number; tokens: number }>;
  colorMap: Record<string, string>;
}) {
  if (models.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] text-muted-subtle uppercase tracking-wide mb-3">Model Usage</p>
      <div className="space-y-1.5">
        {models.map((m) => (
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
  );
}

// Hook para consumir os dados calculados no DashboardPage
export function useStatsData() {
  const { globalStats, projectMetrics } = useStatsStore();

  const totalCost = useMemo(() => {
    return projectMetrics.reduce((sum, m) => sum + (m.lastCost ?? 0), 0);
  }, [projectMetrics]);

  const peakHour = useMemo(() => {
    if (!globalStats?.hourCounts) return null;
    const entries = Object.entries(globalStats.hourCounts);
    if (entries.length === 0) return null;
    const [hour] = entries.sort(([, a], [, b]) => b - a)[0];
    return `${hour.padStart(2, "0")}:00`;
  }, [globalStats]);

  const activityData = useMemo(() => {
    if (!globalStats?.dailyActivity) return [];
    return globalStats.dailyActivity.slice(-30).map((d) => ({
      date: d.date.slice(5),
      messages: d.messageCount,
      toolCalls: d.toolCallCount,
    }));
  }, [globalStats]);

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

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allModelNames.forEach((name, i) => {
      map[name] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    });
    return map;
  }, [allModelNames]);

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

  return {
    totalCost,
    peakHour,
    activityData,
    allModelNames,
    colorMap,
    tokenData,
    modelBreakdown,
    globalStats,
    longestSession: globalStats?.longestSession ?? null,
  };
}
