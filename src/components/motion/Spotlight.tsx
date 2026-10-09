"use client";

import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  children: React.ReactNode;
}

export function Spotlight({ className, children }: SpotlightProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -20%, var(--primary) 0%, transparent 60%)",
          opacity: 0.12,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 animate-pulse"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, var(--accent) 0%, transparent 40%)",
          opacity: 0.06,
          animationDuration: "6s",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
