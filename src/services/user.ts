import { CreditsAmount, CreditsTransType } from "./credit";
import { findUserByEmail, findUserByUuid, insertUser } from "@/models/user";

import type { User } from "@/types/next-auth";
import { createClient } from "@/lib/supabase-server";
import { getOneYearLaterTimestr } from "@/lib/time";
import { increaseCredits } from "./credit";
import { getUuid } from "@/lib/hash";
import type { Database } from "@/types/database.types";

type UserInsert = Database["public"]["Tables"]["wmc_users"]["Insert"];

// save user to database, if user not exist, create a new user
export async function saveUser(user: User) {
  try {
    if (!user.email) {
      throw new Error("invalid user email");
    }

    const supabase = await createClient();
    const existUser = await findUserByEmail(supabase, user.email);

    if (!existUser) {
      // user not exist, create a new user
      if (!user.id) {
        user.id = getUuid();
      }

      console.log("user to be inserted:", user);

      const dbUser = await insertUser(supabase, user as unknown as UserInsert);

      // increase credits for new user, expire in one year
      await increaseCredits({
        user_uuid: user.id,
        trans_type: CreditsTransType.NewUser,
        credits: CreditsAmount.NewUserGet,
        expired_at: getOneYearLaterTimestr(),
      });

      user = {
        ...(dbUser as unknown as User),
      };
    } else {
      // user exist, return user info in db
      user = {
        ...(existUser as unknown as User),
      };
    }

    return user;
  } catch (e) {
    console.log("save user failed: ", e);
    throw e;
  }
}

import { auth } from "@/auth";

export async function getUserUuid() {
  // 纯 NextAuth：获取用户 ID
  const session = await auth();
  return session?.user?.id || "";
}

export async function getUserEmail() {
  // 纯 NextAuth：获取用户邮箱
  const session = await auth();
  return session?.user?.email || "";
}

export async function getUserInfo() {
  // 纯 NextAuth：获取完整用户信息
  const session = await auth();
  const user_uuid = session?.user?.id;

  if (!user_uuid) {
    return;
  }

  const supabase = await createClient();
  const user = await findUserByUuid(supabase, user_uuid);

  return user;
}
