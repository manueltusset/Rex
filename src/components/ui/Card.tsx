import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "hero" | "accent";
  hoverColor?: string;
}

const variantClasses = {
  default: "glass-card p-5 rounded-xl",
  hero: "glass-card p-6 rounded-xl border-l-2 border-l-primary",
  accent: "glass-card p-5 rounded-xl",
};

export function Card({
  children,
  className = "",
  variant = "default",
  hoverColor = "",
}: CardProps) {
  return (
    <div
      className={`relative overflow-hidden transition-all duration-200 group ${variantClasses[variant]} ${hoverColor} ${className}`}
    >
      {children}
    </div>
  );
}
