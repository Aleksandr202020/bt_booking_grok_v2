import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-subtle",
        "transition-colors duration-150 focus:border-steel/50 focus:outline-none focus:ring-2 focus:ring-steel/30",
        className,
      )}
      {...props}
    />
  );
}
