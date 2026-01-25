import { respData, respErr } from "@/lib/resp";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { getUserUuid } from "@/services/user";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return respErr("invalid params");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    // 简化版本：不再扣除积分，因为credits表已删除
    // 只返回接收到的消息

    return respData({
      pong: `received message: ${message}`,
    });
  } catch (e) {
    console.log("test failed:", e);
    return respErr("test failed");
  }
}
