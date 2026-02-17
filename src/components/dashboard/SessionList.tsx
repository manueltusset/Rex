import { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { SessionItem } from "./SessionItem";
import { useSessionStore } from "@/stores/useSessionStore";
import type { SessionMeta } from "@/types/session";

const PAGE_SIZE = 5;

export function SessionList() {
  const { sessions, isLoading, searchResults, isSearching, searchInContent, clearSearch } =
    useSessionStore();
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [page, setPage] = useState(0);

  // Debounce para busca backend
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(filter), 400);
    return () => clearTimeout(timer);
  }, [filter]);

  // Dispara busca backend
  useEffect(() => {
    if (debouncedFilter.length >= 2) {
      searchInContent(debouncedFilter);
    } else {
      clearSearch();
    }
  }, [debouncedFilter, searchInContent, clearSearch]);

  // Merge: filtro local + resultados de conteudo
  const { merged, matchMap } = useMemo(() => {
    const filterLower = filter.toLowerCase();

    // Filtro local (project_path + summary)
    const localFiltered = filter
      ? sessions.filter(
          (s) =>
            s.project_path.toLowerCase().includes(filterLower) ||
            s.summary.toLowerCase().includes(filterLower),
        )
      : sessions;

    // Mapa de matches por session id
    const mMap = new Map<string, number>();
    for (const r of searchResults) {
      mMap.set(r.session.id, r.match_count);
    }

    if (searchResults.length === 0) {
      return { merged: localFiltered, matchMap: mMap };
    }

    // IDs ja presentes no filtro local
    const localIds = new Set(localFiltered.map((s) => s.id));

    // Sessoes do backend que nao estao no filtro local
    const extraSessions: SessionMeta[] = searchResults
      .filter((r) => !localIds.has(r.session.id))
      .map((r) => r.session);

    // Local primeiro, depois extras do backend
    return { merged: [...localFiltered, ...extraSessions], matchMap: mMap };
  }, [sessions, searchResults, filter]);

  const totalPages = Math.ceil(merged.length / PAGE_SIZE);
  const paginated = merged.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <section className="glass-card rounded-xl overflow-hidden flex flex-col min-h-[400px]">
      {/* Header */}
      <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 font-display">
            <Icon name="terminal" className="text-primary" />
            Recent Local Sessions
          </h3>
          <p className="text-xs text-muted-subtle mt-1.5 font-mono">
            <span className="text-muted-subtle">Found in:</span>{" "}
            <span className="text-primary/80">~/.claude</span>
          </p>
        </div>
        <div className="relative w-full sm:w-auto group">
          {isSearching ? (
            <div className="absolute left-3 top-2.5">
              <Spinner size="sm" />
            </div>
          ) : (
            <Icon
              name="search"
              size="sm"
              className="absolute left-3 top-2.5 text-muted-subtle group-focus-within:text-primary transition-colors"
            />
          )}
          <input
            className="pl-10 pr-4 py-2 bg-input-bg border border-border-subtle rounded-lg text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full sm:w-72 placeholder-muted-subtle transition-all"
            placeholder="Search sessions and content..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
      </div>

      {/* Info de resultados de conteudo */}
      {searchResults.length > 0 && filter.length >= 2 && (
        <div className="px-6 py-2 bg-primary/5 border-b border-border-subtle">
          <span className="text-xs text-primary font-mono">
            Found in {searchResults.length} session{searchResults.length !== 1 ? "s" : ""} content
          </span>
        </div>
      )}

      {/* Cabecalho da tabela */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-bg/30 border-b border-border-subtle text-[11px] font-semibold text-muted-subtle uppercase tracking-wider">
        <div className="col-span-4">Directory / Context</div>
        <div className="col-span-4">Summary</div>
        <div className="col-span-2">Last Active</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Lista */}
      <div className="divide-y divide-border-subtle flex-1">
        {isLoading && sessions.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-subtle">
            Loading sessions...
          </div>
        ) : paginated.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-subtle">
            {filter ? "No sessions match the search" : "No sessions found"}
          </div>
        ) : (
          paginated.map((session) => (
            <div key={session.id}>
              <SessionItem session={session} />
              {matchMap.has(session.id) && (
                <div className="px-6 pb-3 -mt-2">
                  <Badge variant="green">
                    {matchMap.get(session.id)} match{matchMap.get(session.id)! > 1 ? "es" : ""} in content
                  </Badge>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Paginacao */}
      <div className="px-6 py-4 border-t border-border-subtle flex justify-between items-center bg-bg/20">
        <span className="text-xs text-muted-subtle font-mono">
          Showing {paginated.length} of {merged.length} sessions
        </span>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded bg-surface border border-border-subtle text-xs transition-colors ${
              page === 0
                ? "text-muted-subtle cursor-not-allowed"
                : "text-muted hover:border-muted-subtle hover:text-foreground-secondary cursor-pointer"
            }`}
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <button
            className={`px-3 py-1.5 rounded bg-surface border border-border-subtle text-xs transition-colors ${
              page >= totalPages - 1
                ? "text-muted-subtle cursor-not-allowed"
                : "text-muted hover:border-muted-subtle hover:text-foreground-secondary cursor-pointer"
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
