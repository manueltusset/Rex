import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "green" | "accent" | "danger" | "default" | "muted";
}

const variants = {
  green: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-rex-accent/10 text-rex-accent border-rex-accent/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  muted: "bg-slate-800 text-slate-400 border-slate-700/50",
  default: "bg-[#1A1D24] text-slate-300 border-border-subtle",
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
