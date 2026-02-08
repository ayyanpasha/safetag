import { cn } from "@/lib/utils/cn";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}
