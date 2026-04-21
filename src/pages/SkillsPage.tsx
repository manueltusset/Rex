import { useEffect } from "react";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { useSkillsStore } from "@/stores/useSkillsStore";
import type { SkillInfo } from "@/types/skill";

function scopeBadge(skill: SkillInfo) {
  if (skill.plugin_name) return "bg-usage-weekly/10 text-usage-weekly border-usage-weekly/20";
  if (skill.scope === "user") return "bg-usage-sonnet/10 text-usage-sonnet border-usage-sonnet/20";
  return "bg-usage-session/10 text-usage-session border-usage-session/20";
}

function scopeLabel(skill: SkillInfo) {
  if (skill.plugin_name) return `Plugin (${skill.plugin_name})`;
  if (skill.scope === "user") return "User";
  return "Project";
}

function SkillCard({ skill }: { skill: SkillInfo }) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-primary" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-foreground">{skill.name}</h4>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${scopeBadge(skill)}`}>
              {scopeLabel(skill)}
            </span>
          </div>

          {skill.description && (
            <p className="text-xs text-muted">{skill.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-muted-subtle font-mono truncate">
              {skill.dir_name}
            </span>
            {skill.project_path && (
              <span className="text-[10px] text-muted-subtle font-mono truncate">
                {skill.project_path.split("/").slice(-2).join("/")}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SkillsPage() {
  const { skills, isLoading, lastChecked, error, fetch } = useSkillsStore();

  useEffect(() => {
    fetch();
  }, [fetch]);

  const pluginCount = skills.filter((s) => s.plugin_name).length;
  const userCount = skills.filter((s) => !s.plugin_name && s.scope === "user").length;
  const projectCount = skills.filter((s) => !s.plugin_name && s.scope === "project").length;

  return (
    <>
      <AnimateIn>
        <header className="flex justify-between items-end mb-8">
          <div>
            <p className="text-xs font-medium text-primary mb-2 font-mono tracking-widest uppercase opacity-80">
              Integrations
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-foreground tracking-tight font-display">
                Skills
              </h2>
              {skills.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface border border-border text-muted">
                  {skills.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastChecked && (
              <span className="text-xs text-muted-subtle font-mono">
                {new Date(lastChecked).toLocaleTimeString()}
              </span>
            )}
            <Button variant="secondary" onClick={fetch}>
              {isLoading ? <Spinner size="sm" /> : <Icon name="refresh" size="sm" />}
              Refresh
            </Button>
          </div>
        </header>
      </AnimateIn>

      {error && (
        <Card className="mb-6 border-danger/30">
          <div className="flex items-center gap-3 text-danger">
            <Icon name="error" />
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {skills.length > 0 && (
        <AnimateIn delay={80}>
          <div className="flex gap-3 mb-6">
            {pluginCount > 0 && (
              <Badge variant="default">
                {pluginCount} plugin
              </Badge>
            )}
            {userCount > 0 && (
              <Badge variant="default">
                {userCount} user
              </Badge>
            )}
            {projectCount > 0 && (
              <Badge variant="default">
                {projectCount} project
              </Badge>
            )}
          </div>
        </AnimateIn>
      )}

      {isLoading && skills.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center min-h-[200px]">
            <Spinner />
          </div>
        </Card>
      ) : skills.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
            <Icon name="auto_fix_high" size="xl" className="text-muted-subtle opacity-30" />
            <div className="text-center">
              <p className="text-sm text-muted mb-1">No skills installed</p>
              <p className="text-xs text-muted-subtle">
                Add skills in Claude Code with{" "}
                <code className="px-1 py-0.5 rounded bg-surface text-xs font-mono">claude skill add</code>
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {skills.map((skill, index) => (
            <AnimateIn key={`${skill.scope}-${skill.dir_name}-${skill.project_path ?? ""}`} delay={Math.min(80 + index * 60, 500)}>
              <SkillCard skill={skill} />
            </AnimateIn>
          ))}
        </div>
      )}
    </>
  );
}
