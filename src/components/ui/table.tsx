"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentPropsWithRef<"table">) {
  return (
    <div className={cn("w-full overflow-auto", className)} {...props}>
      <table className="w-full caption-bottom text-sm"></table>
    </div>
  );
}
Table.displayName = "Table";
