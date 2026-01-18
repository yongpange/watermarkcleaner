import { respData, respErr, respJson } from "@/lib/resp";
import { findUserByEmail, findUserByUuid } from "@/models/user";
import { createClient } from "@/lib/supabase-server";
import { auth } from "@/auth";

export async function POST(_req: Request) {
  try {
    // 尝试获取 NextAuth session (Google OAuth)
    const session = await auth();
    let user_email = session?.user?.email;
    let user_id = session?.user?.id;

    // 如果没有 NextAuth session，尝试 Supabase Auth
    if (!user_email) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        user_email = user.email;
        user_id = user.id;
      }
    }

    if (!user_email || !user_id) {
      return respJson(-2, "no auth");
    }

    const supabase = await createClient();

    // 根据 email 查找用户（因为 NextAuth 的 ID 可能和 Supabase 不同）
    const dbUser = await findUserByEmail(supabase, user_email);

    if (!dbUser) {
      // 如果用户不存在，可能是新用户，尝试用 ID 查找
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