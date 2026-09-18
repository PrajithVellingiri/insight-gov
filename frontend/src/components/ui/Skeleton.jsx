import React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-xl border border-white/[0.04] bg-slate-900/60 bg-gradient-to-r from-slate-900/60 via-slate-800/40 to-slate-900/60 bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
