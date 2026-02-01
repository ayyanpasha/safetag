import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";

interface ButtonProps extends PressableProps {
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  default: "bg-primary active:bg-primary/90",
  destructive: "bg-destructive active:bg-destructive/90",
  outline: "border border-border bg-transparent active:bg-muted",
  ghost: "bg-transparent active:bg-muted",
} as const;

const textVariantStyles = {
  default: "text-primary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
} as const;

const sizeStyles = {
  default: "h-12 px-6",
  sm: "h-9 px-4",
  lg: "h-14 px-8",
} as const;

const textSizeStyles = {
  default: "text-base",
  sm: "text-sm",
  lg: "text-lg",
} as const;

export function Button({
  variant = "default",
  size = "default",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-xl ${variantStyles[variant]} ${sizeStyles[size]} ${disabled || loading ? "opacity-50" : ""}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "default" || variant === "destructive" ? "#fff" : "#0F172A"}
          className="mr-2"
        />
      ) : null}
      <Text
        className={`font-semibold ${textVariantStyles[variant]} ${textSizeStyles[size]}`}
      >
        {children}
      </Text>
    </Pressable>
  );
}
