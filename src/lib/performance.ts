/**
 * Performance monitoring utilities
 */

export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number>;

  constructor() {
    this.startTime = Date.now();
    this.marks = new Map();
  }

  mark(label: string) {
    this.marks.set(label, Date.now() - this.startTime);
  }

  getMark(label: string): number | undefined {
    return this.marks.get(label);
  }

  getDuration(startLabel: string, endLabel: string): number | undefined {
    const start = this.marks.get(startLabel);
    const end = this.marks.get(endLabel);
    if (start !== undefined && end !== undefined) {
      return end - start;
    }
    return undefined;
  }

  getTotal(): number {
    return Date.now() - this.startTime;
  }

  report(): Record<string, number> {
    const report: Record<string, number> = {
      total: this.getTotal(),
    };
    this.marks.forEach((time, label) => {
      report[label] = time;
    });
    return report;
  }
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  
  if (label) {
    console.log(`[Performance] ${label}: ${duration}ms`);
  }
  
  return { result, duration };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

