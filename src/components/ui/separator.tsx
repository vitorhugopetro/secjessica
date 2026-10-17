import * as React from "react";
import { cn } from "@/lib/utils";

export function Separator({ className, ...props }: React.ComponentPropsWithRef<"hr">) {
  return (
    <hr
      className={cn("relative flex w-full -mx-px border-t border-input", className)}
      {...props}
    />
  );
}
Separator.displayName = "Separator";
