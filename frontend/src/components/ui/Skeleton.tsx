import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white/5 rounded-lg shimmer-effect animate-pulse",
        className
      )}
      {...props}
    />
  );
}
