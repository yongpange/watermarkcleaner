import { handlers } from '@/auth';

// Export handlers for both GET and POST requests
export const { GET, POST } = handlers;

// 确保在开发环境中正确处理 host
export const runtime = 'nodejs';