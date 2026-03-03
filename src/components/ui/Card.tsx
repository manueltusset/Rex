import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "hero" | "accent";
  hoverColor?: string;
}

const variantClasses = {
  default: "glass-card p-5 rounded-xl hover:shadow-elevation-2",
  hero: "glass-card p-6 rounded-xl border-l-2 border-l-primary shadow-elevation-1 hover:shadow-elevation-3",
  accent: "glass-card p-5 rounded-xl bg-gradient-to-br from-primary/[0.04] to-transparent hover:shadow-elevation-2",
};

export function Card({
  children,
  className = "",
  variant = "default",
  hoverColor = "hover:border-primary/20",
}: CardProps) {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 group ${variantClasses[variant]} ${hoverColor} ${className}`}
    >
      {children}
    </div>
  );
}
