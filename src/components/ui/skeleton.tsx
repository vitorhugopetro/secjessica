import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-mixed",
        className
      )}
      {...props}
    />
  );
}
Skeleton.displayName = "Skeleton";
