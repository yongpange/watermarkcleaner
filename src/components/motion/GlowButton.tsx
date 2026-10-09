"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

interface GlowButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function GlowButton({
  className,
  variant = "glow",
  size = "default",
  asChild = false,
  ...props
}: GlowButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="glow-button"
      className={cn(
        buttonVariants({ variant, size }),
        "relative overflow-hidden",
        className
      )}
      {...props}
    />
  );
}
