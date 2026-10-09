"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "initial" | "animate" | "whileInView" | "viewport"> {
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  blur?: boolean;
  once?: boolean;
  amount?: number;
  className?: string;
  children: React.ReactNode;
}

export function FadeIn({
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 24,
  blur = true,
  once = true,
  amount = 0.3,
  className,
  children,
  ...props
}: FadeInProps) {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        filter: blur ? "blur(8px)" : "blur(0px)",
        ...directions[direction],
      }}
      whileInView={{
        opacity: 1,
        filter: "blur(0px)",
        x: 0,
        y: 0,
      }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
