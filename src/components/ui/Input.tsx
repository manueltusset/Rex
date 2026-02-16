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
      <label className="block text-sm font-medium text-foreground-secondary flex items-center justify-between">
        {label}
        {helpText && (
          <span className="text-xs text-muted-subtle">{helpText}</span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
            {icon}
          </span>
        )}
        <input
          className={`block w-full ${icon ? "pl-10" : "pl-3"} ${endAdornment ? "pr-10" : "pr-3"} py-2.5 bg-input-bg border ${error ? "border-danger" : "border-border"} rounded-lg text-sm text-foreground placeholder:text-muted-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono ${className}`}
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
