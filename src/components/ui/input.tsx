import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-subtle",
        "transition-colors duration-150 focus:border-steel/50 focus:outline-none focus:ring-2 focus:ring-steel/30",
        className,
      )}
      {...props}
    />
  );
}
