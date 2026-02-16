import { useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useSessionStore } from "@/stores/useSessionStore";
import { formatRelativeTime } from "@/utils/formatters";

export function ProjectsPage() {
  const { sessions } = useSessionStore();

  // Agrupa sessoes por projeto
  const projects = useMemo(() => {
    const map = new Map<string, { path: string; display: string; count: number; lastActive: string }>();
    for (const session of sessions) {
      const existing = map.get(session.project_path);
      if (existing) {
        existing.count += 1;
        if (session.last_timestamp > existing.lastActive) {
          existing.lastActive = session.last_timestamp;
        }
      } else {
        map.set(session.project_path, {
          path: session.project_path,
          display: session.project_display,
          count: 1,
          lastActive: session.last_timestamp,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.lastActive.localeCompare(a.lastActive));
  }, [sessions]);

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-primary-light/70 mb-1 font-mono tracking-wide uppercase">
          Workspace
        </p>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Projects
        </h2>
      </header>

      {projects.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-muted-subtle">
            <Icon name="folder_off" size="xl" className="mb-4 opacity-30" />
            <p>No projects found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.path}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary-light">
                  <Icon name="folder_open" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground font-mono truncate">
                    {project.display}
                  </p>
                  <p className="text-xs text-muted-subtle truncate mt-0.5">
                    {project.path}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge>
                  {project.count} session{project.count > 1 ? "s" : ""}
                </Badge>
                <span className="text-xs text-muted-subtle font-mono">
                  {formatRelativeTime(project.lastActive)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
