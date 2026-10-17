import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentPropsWithRef<"span"> & { variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "border-primary text-primary bg-primary/10",
        variant === "secondary" && "border-secondary text-secondary-foreground bg-secondary",
        variant === "destructive" && "border-red-600 text-red-600 bg-red-600/10",
        variant === "outline" && "border-input bg-background",
        variant === "success" && "border-green-600 text-green-600 bg-green-600/10",
        variant === "warning" && "border-amber-600 text-amber-600 bg-amber-600/10",
        className
      )}
      {...props}
    />
  );
}
Badge.displayName = "Badge";
