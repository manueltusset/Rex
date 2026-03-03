import { type ReactNode, type CSSProperties } from "react";

interface AnimateInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "article";
}

export function AnimateIn({
  children,
  delay = 0,
  duration = 500,
  className = "",
  as: Tag = "div",
}: AnimateInProps) {
  const style: CSSProperties = {
    animationDelay: `${delay}ms`,
    animationDuration: `${duration}ms`,
  };

  return (
    <Tag className={`animate-fade-in-up ${className}`} style={style}>
      {children}
    </Tag>
  );
}
