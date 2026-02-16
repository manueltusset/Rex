interface ProgressBarProps {
  value: number;
  variant?: "green" | "accent" | "danger";
  size?: "sm" | "md";
}

const colorMap = {
  green:
    "bg-gradient-to-r from-primary to-primary-light shadow-[0_0_10px_rgba(76,175,80,0.5)]",
  accent: "bg-rex-accent shadow-[0_0_8px_rgba(232,184,125,0.4)]",
  danger: "bg-danger shadow-[0_0_8px_rgba(207,102,121,0.4)]",
};

const sizeMap = {
  sm: "h-1.5",
  md: "h-2",
};

export function ProgressBar({
  value,
  variant = "green",
  size = "sm",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`w-full bg-surface rounded-full ${sizeMap[size]} overflow-hidden`}
    >
      <div
        className={`${colorMap[variant]} ${sizeMap[size]} rounded-full transition-all duration-500`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
