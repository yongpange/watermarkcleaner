import { handlers } from '@/auth';

// Export handlers for both GET and POST requests
export const { GET, POST } = handlers;

// 确保在 Cloudflare Pages 环境中运行
export const runtime = 'edge';