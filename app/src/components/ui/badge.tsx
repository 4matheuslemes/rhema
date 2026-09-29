import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "muted";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-sans",
        variant === "default" && "bg-[var(--primary)]/10 text-[var(--primary)]",
        variant === "accent"  && "bg-[var(--accent)]/12 text-[var(--accent)]",
        variant === "success" && "bg-[var(--success)]/12 text-[var(--success)]",
        variant === "muted"   && "bg-[var(--border)] text-[var(--ink-muted)]",
        className
      )}
      {...props}
    />
  );
}
