import { CreditsAmount, CreditsTransType } from "./credit";
import { findUserByEmail, findUserByUuid, insertUser } from "@/models/user";

import { User } from "@/types/user";
import { createClient } from "@/lib/supabase-server";
import { getOneYearLaterTimestr } from "@/lib/time";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";
import { getUuid } from "@/lib/hash";
import type { DatabaseWithWmc } from "@/types/database-wmc.types";

type UserInsert = DatabaseWithWmc["public"]["Tables"]["wmc_users"]["Insert"];

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
      if (!user.uuid) {
        user.uuid = getUuid();
      }

      console.log("user to be inserted:", user);

      const dbUser = await insertUser(supabase, user as unknown as UserInsert);

      // increase credits for new user, expire in one year
      await increaseCredits({
        user_uuid: user.uuid,
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

export async function getUserUuid() {
  // 简化版本：只使用 Supabase Auth 获取用户
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return user?.id || "";
}

export async function getUserEmail() {
  let user_email = "";

  // 使用 Supabase Auth 获取用户
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user && user.email) {
    user_email = user.email;
  }

  return user_email;
}

export async function getUserInfo() {
  const user_uuid = await getUserUuid();

  if (!user_uuid) {
    return;
  }

  const supabase = await createClient();
  const user = await findUserByUuid(supabase, user_uuid);

  return user;
}
