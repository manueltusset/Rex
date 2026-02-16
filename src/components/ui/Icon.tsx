interface IconProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-6xl",
};

export function Icon({ name, className = "", size = "md" }: IconProps) {
  return (
    <span className={`material-icons-outlined ${sizeMap[size]} ${className}`}>
      {name}
    </span>
  );
}
