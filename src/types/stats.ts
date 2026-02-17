export interface ModelUsageEntry {
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadInputTokens: number | null;
  cacheCreationInputTokens: number | null;
  costUSD: number | null;
}

export interface ProjectMetrics {
  projectPath: string;
  lastCost: number | null;
  lastDuration: number | null;
  lastLinesAdded: number | null;
  lastLinesRemoved: number | null;
  lastTotalInputTokens: number | null;
  lastTotalOutputTokens: number | null;
  lastTotalCacheReadInputTokens: number | null;
  lastTotalCacheCreationInputTokens: number | null;
  lastModelUsage: Record<string, ModelUsageEntry> | null;
  githubRepo: string | null;
}

export interface DailyActivity {
  date: string;
  messageCount: number;
  sessionCount: number;
  toolCallCount: number;
}

export interface DailyModelTokens {
  date: string;
  tokensByModel: Record<string, number>;
}

export interface LongestSession {
  sessionId: string | null;
  duration: number | null;
  messageCount: number | null;
  timestamp: string | null;
}

export interface GlobalStats {
  version: number | null;
  dailyActivity: DailyActivity[];
  dailyModelTokens: DailyModelTokens[];
  modelUsage: Record<string, ModelUsageEntry>;
  totalSessions: number | null;
  totalMessages: number | null;
  longestSession: LongestSession | null;
  firstSessionDate: string | null;
  hourCounts: Record<string, number>;
  totalSpeculationTimeSavedMs: number | null;
}
