import { Icon } from "@/components/ui/Icon";
import { useSessionStore } from "@/stores/useSessionStore";
import { formatRelativeTime } from "@/utils/formatters";
import type { SessionMeta } from "@/types/session";

interface SessionItemProps {
  session: SessionMeta;
}

export function SessionItem({ session }: SessionItemProps) {
  const resume = useSessionStore((s) => s.resume);

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-foreground/[0.02] transition-colors items-center group">
      {/* Diretorio */}
      <div className="col-span-4 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-surface border border-border-subtle flex items-center justify-center text-muted-subtle group-hover:text-primary transition-colors">
            <Icon name="code" size="sm" />
          </div>
          <div className="truncate">
            <p className="text-sm font-medium text-foreground-secondary font-mono truncate group-hover:text-foreground transition-colors">
              {session.project_display}
            </p>
            <p className="text-xs text-muted-subtle mt-0.5">
              {session.message_count} messages
            </p>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="col-span-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-surface text-foreground-secondary border border-border-subtle">
          {session.summary.length > 40
            ? `${session.summary.substring(0, 40)}...`
            : session.summary}
        </span>
      </div>

      {/* Ultima atividade */}
      <div className="col-span-2 text-xs text-muted-subtle font-mono">
        {formatRelativeTime(session.last_timestamp)}
      </div>

      {/* Acao */}
      <div className="col-span-2 flex justify-end">
        <button
          onClick={() => resume(session.id, session.project_path)}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold font-mono bg-transparent border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-all cursor-pointer"
        >
          <span className="text-[10px]">&gt;_</span> Resume
        </button>
      </div>
    </div>
  );
}
