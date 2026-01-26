import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSnowId(): string {
  // Simple snowflake-like ID generator
  // Timestamp (41 bits) + Random (23 bits)
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}${random.toString().padStart(6, '0')}`;
}
