export function formatTimeUntil(isoDate: string | null): string {
  if (!isoDate) return "--";
  const target = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return "Resetting...";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return "--";
  const date = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = now - date;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function formatUtilization(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatBillingType(raw: string | null): string {
  if (!raw) return "--";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "--";
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(value: number | null): string {
  if (value == null) return "--";
  return `$${value.toFixed(2)}`;
}

export function formatTokenCount(value: number | null): string {
  if (value == null) return "--";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "--";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatNumber(value: number | null): string {
  if (value == null) return "--";
  return value.toLocaleString("en-US");
}
