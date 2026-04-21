import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "green" | "accent" | "danger" | "default" | "muted";
}

const variants = {
  green: "bg-[#30d158]/10 text-[#248a3d] border-[#30d158]/20 dark:text-[#30d158] dark:border-[#30d158]/20",
  accent: "bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20",
  danger: "bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20",
  muted: "bg-ring-bg text-muted border-border",
  default: "bg-surface text-foreground-secondary border-border-subtle",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${variants[variant]}`}
      style={{ letterSpacing: "-0.1px" }}
    >
      {children}
    </span>
  );
}
