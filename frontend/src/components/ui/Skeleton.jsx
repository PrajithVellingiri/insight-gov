import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-shimmer bg-muted/40 bg-gradient-to-r from-transparent via-muted/60 to-transparent bg-[length:400%_100%] rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
