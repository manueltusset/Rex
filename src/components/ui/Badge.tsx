import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "green" | "accent" | "danger" | "default" | "muted";
}

const variants = {
  green: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-rex-accent/10 text-rex-accent border-rex-accent/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  muted: "bg-ring-bg text-muted border-border",
  default: "bg-surface text-foreground-secondary border-border-subtle",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
