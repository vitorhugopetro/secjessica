import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
Textarea.displayName = "Textarea";
