"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: "default" | "destructive";
};

let count = 0;
function genId() {
  return (++count).toString();
}

type ToastContextValue = {
  toast: (props: Omit<ToastProps, "id">) => { id: string; dismiss: () => void };
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const ToastProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...props }, ref) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback(
    (props: Omit<ToastProps, "id">) => {
      const id = genId();
      const newToast: ToastProps = { id, ...props };
      setToasts((t) => [...t, newToast]);
      if (newToast.duration !== undefined) {
        setTimeout(() => {
          setToasts((t) => t.filter((x) => x.id !== id));
        }, newToast.duration);
      }
      return {
        id,
        dismiss: () => setToasts((t) => t.filter((x) => x.id !== id)),
      };
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      <div ref={ref} className={cn("top-0 right-0 z-[100]", className)} {...props}>
        {children}
        <ToastViewport
          toasts={toasts}
          onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
        />
      </div>
    </ToastContext.Provider>
  );
});
ToastProvider.displayName = "ToastProvider";

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de um ToastProvider");
  return ctx;
}

export const ToastViewport = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
}) => (
  <div className="fixed top-0 right-0 z-[100] flex flex-col gap-4 p-4 sm:bottom-0 sm:right-0 sm:top-auto">
    {toasts.map((t) => (
      <Toast key={t.id} {...t} onDismiss={onDismiss} duration={t.duration} />
    ))}
  </div>
);

export const Toast = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> &
    ToastProps & { onDismiss?: (id: string) => void }
>((props, ref) => {
  const {
    className,
    title,
    description,
    action,
    onDismiss,
    id,
    variant,
    ...rest
  } = props;
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full max-w-sm items-center justify-between space-x-4 overflow-hidden rounded-xl border p-6 shadow-lg transition-all",
        variant === "destructive"
          ? "border-red-500 bg-red-50 text-red-950 dark:bg-red-900/40 dark:text-red-100"
          : "border-input bg-background",
        className
      )}
      {...rest}
    >
      <div className="flex flex-col gap-1">
        {title && <h2 className="text-sm font-semibold">{title}</h2>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
      <button
        onClick={() => onDismiss?.(id!)}
        className="absolute right-2 top-2 rounded-sm opacity-50 ring-offset-background transition-opacity hover:opacity-100 hover:mix-blend-difference focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      >
        <span className="sr-only">Fechar</span>
        ✕
      </button>
    </div>
  );
});
Toast.displayName = "Toast";
