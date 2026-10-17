import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}
Avatar.displayName = "Avatar";

export function AvatarImage({ className, ...props }: React.ComponentPropsWithRef<"img">) {
  return (
    <img
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
}
AvatarImage.displayName = "AvatarImage";

export function AvatarFallback({ className, ...props }: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground",
        className
      )}
      {...props}
    />
  );
}
AvatarFallback.displayName = "AvatarFallback";
