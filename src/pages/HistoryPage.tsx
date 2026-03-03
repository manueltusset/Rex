import { AnimateIn } from "@/components/ui/AnimateIn";
import { SessionList } from "@/components/dashboard/SessionList";

export function HistoryPage() {
  return (
    <>
      <AnimateIn>
        <header className="mb-8">
          <p className="text-xs font-medium text-primary mb-2 font-mono tracking-widest uppercase opacity-80">
            All Sessions
          </p>
          <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
            History
          </h2>
        </header>
      </AnimateIn>
      <AnimateIn delay={80}>
        <SessionList />
      </AnimateIn>
    </>
  );
}
