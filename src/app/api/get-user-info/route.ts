import { respData, respErr, respJson } from "@/lib/resp";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { findUserByEmail, findUserByUuid } from "@/models/user";
import { createClient } from "@/lib/supabase-server";
import { auth } from "@/auth";

export async function POST(_req: Request) {
  try {
    // 只使用 NextAuth session (纯 NextAuth + Supabase 数据库)
    const session = await auth();

    if (!session?.user?.email || !session?.user?.id) {
      return respJson(-2, "no auth");
    }

    const user_email = session.user.email;
    const user_id = session.user.id;

    const supabase = await createClient();

    // 根据 email 查找用户
    const dbUser = await findUserByEmail(supabase, user_email);

    if (!dbUser) {
      // 如果用户不存在，可能是同步问题，尝试用 ID 查找
      const dbUserById = await findUserByUuid(supabase, user_id);
      if (!dbUserById) {
        return respErr("user not exist");
      }
      return respData(dbUserById);
    }

    return respData(dbUser);
  } catch (e) {
    console.log("get user info failed: ", e);
    return respErr("get user info failed");
  }
}