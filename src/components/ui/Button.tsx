import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

const variants = {
  primary:
    "bg-primary hover:bg-primary-dark text-black font-bold shadow-glow",
  secondary:
    "bg-transparent border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600",
  ghost:
    "text-slate-400 hover:text-white hover:bg-white/5",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
