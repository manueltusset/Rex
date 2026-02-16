import { SessionList } from "@/components/dashboard/SessionList";

export function HistoryPage() {
  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-light/70 mb-1 font-mono tracking-wide uppercase">
          All Sessions
        </p>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          History
        </h2>
      </header>
      <SessionList />
    </>
  );
}
