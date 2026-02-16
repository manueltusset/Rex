interface SpinnerProps {
  size?: "sm" | "md";
}

export function Spinner({ size = "md" }: SpinnerProps) {
  const dim = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div
      className={`${dim} border-2 border-primary-light/30 border-t-primary-light rounded-full animate-spin`}
    />
  );
}
