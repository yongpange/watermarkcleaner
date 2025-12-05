import type { ConversionResult } from '@/types/conversion.d';

// In-memory storage for conversion tasks (in production, use Redis or database)
export const conversionTasks = new Map<string, ConversionResult>();