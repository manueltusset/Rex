import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SessionItem } from "./SessionItem";
import { useSessionStore } from "@/stores/useSessionStore";

const PAGE_SIZE = 5;

export function SessionList() {
  const { sessions, isLoading } = useSessionStore();
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const filtered = sessions.filter(
    (s) =>
      s.project_path.toLowerCase().includes(filter.toLowerCase()) ||
      s.summary.toLowerCase().includes(filter.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="glass-card rounded-xl overflow-hidden flex flex-col min-h-[400px]">
      {/* Header */}
      <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
            <Icon name="terminal" className="text-primary" />
            Recent Local Sessions
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 font-mono">
            <span className="text-slate-600">Found in:</span>{" "}
            <span className="text-primary/80">~/.claude</span>
          </p>
        </div>
        <div className="relative w-full sm:w-auto group">
          <Icon
            name="search"
            size="sm"
            className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-primary transition-colors"
          />
          <input
            className="pl-10 pr-4 py-2 bg-[#0A0C10] border border-border-subtle rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full sm:w-72 placeholder-slate-600 transition-all"
            placeholder="Filter by directory..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {/* Cabecalho da tabela */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#0A0C10]/30 border-b border-border-subtle text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        <div className="col-span-4">Directory / Context</div>
        <div className="col-span-4">Summary</div>
        <div className="col-span-2">Last Active</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-border-subtle flex-1">
        {isLoading && sessions.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            Loading sessions...
          </div>
        ) : paginated.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            {filter ? "No sessions match the filter" : "No sessions found"}
          </div>
        ) : (
          paginated.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))
        )}
      </div>

      {/* Paginacao */}
      <div className="px-6 py-4 border-t border-border-subtle flex justify-between items-center bg-[#0A0C10]/20">
        <span className="text-xs text-slate-500 font-mono">
          Showing {paginated.length} of {filtered.length} local sessions
        </span>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded bg-[#1A1D24] border border-border-subtle text-xs transition-colors ${
              page === 0
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-400 hover:border-slate-600 hover:text-slate-200 cursor-pointer"
            }`}
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <button
            className={`px-3 py-1.5 rounded bg-[#1A1D24] border border-border-subtle text-xs transition-colors ${
              page >= totalPages - 1
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-400 hover:border-slate-600 hover:text-slate-200 cursor-pointer"
            }`}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
