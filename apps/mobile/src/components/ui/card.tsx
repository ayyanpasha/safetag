import { View, Text, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <View
      className={`rounded-2xl border border-border bg-card p-4 ${className ?? ""}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-lg font-semibold text-card-foreground">
      {children}
    </Text>
  );
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm text-muted-foreground">{children}</Text>;
}
