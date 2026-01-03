import { respData, respErr, respJson } from "@/lib/resp";

import { findUserByUuid } from "@/models/user";
import { getUserUuid } from "@/services/user";
import { User } from "@/types/user";
import { createClient } from "@/lib/supabase-server";

export async function POST(_req: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-2, "no auth");
    }

    const supabase = await createClient();

    const dbUser = await findUserByUuid(supabase, user_uuid);
    if (!dbUser) {
      return respErr("user not exist");
    }

    // 简化版本：只返回用户基本信息，不再包含积分详情
    const user = {
      ...(dbUser as unknown as User),
      // credits 字段已移除，因为credits表已删除
    };

    return respData(user);
  } catch (e) {
    console.log("get user info failed: ", e);
    return respErr("get user info failed");
  }
}
