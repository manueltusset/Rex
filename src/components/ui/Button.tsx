import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const variants = {
  primary:
    "bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] text-white font-medium tracking-tight",
  secondary:
    "bg-transparent border border-[#0066cc] text-[#0066cc] hover:bg-[#0066cc]/5 dark:border-[#2997ff] dark:text-[#2997ff] dark:hover:bg-[#2997ff]/10",
  ghost:
    "text-muted hover:text-foreground hover:bg-foreground/[0.04]",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0071e3] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
