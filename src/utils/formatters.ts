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
