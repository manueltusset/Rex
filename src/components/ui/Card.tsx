import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverColor?: string;
}

export function Card({
  children,
  className = "",
  hoverColor = "hover:border-primary/30",
}: CardProps) {
  return (
    <div
      className={`glass-card p-6 rounded-xl relative overflow-hidden transition-all duration-300 group ${hoverColor} ${className}`}
    >
      {children}
    </div>
  );
}
