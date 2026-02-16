import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  helpText?: string;
  error?: string;
  endAdornment?: ReactNode;
}

export function Input({
  label,
  icon,
  helpText,
  error,
  endAdornment,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300 flex items-center justify-between">
        {label}
        {helpText && (
          <span className="text-xs text-slate-500">{helpText}</span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </span>
        )}
        <input
          className={`block w-full ${icon ? "pl-10" : "pl-3"} ${endAdornment ? "pr-10" : "pr-3"} py-2.5 bg-slate-900/50 border ${error ? "border-danger" : "border-border-dark"} rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono ${className}`}
          {...props}
        />
        {endAdornment && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {endAdornment}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
