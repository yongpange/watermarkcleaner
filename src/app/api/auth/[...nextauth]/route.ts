import { handlers } from '@/auth';

// Export handlers for both GET and POST requests
export const { GET, POST } = handlers;

// 切换回 Node.js Runtime 以解决环境变量获取和 Supabase Adapter 兼容性问题
export const runtime = 'nodejs';