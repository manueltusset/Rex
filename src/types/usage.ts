export interface UsageWindow {
  utilization: number;
  resets_at: string | null;
}

export interface UsageResponse {
  five_hour: UsageWindow;
  seven_day: UsageWindow;
  seven_day_sonnet: UsageWindow | null;
}
