import { CreditsAmount, CreditsTransType } from "./credit";
import { findUserByEmail, findUserByUuid, insertUser } from "@/models/user";

import { User } from "@/types/user";
import { createClient } from "@/lib/supabase-server";
import { getOneYearLaterTimestr } from "@/lib/time";
import { getUserUuidByApiKey } from "@/models/apikey";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";
import { getUuid } from "@/lib/hash";
import type { Database } from "@/types/database.types";

type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

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

      const dbUser = await insertUser(supabase, user as UserInsert);

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
  let user_uuid = "";

  const token = await getBearerToken();

  if (token) {
    // api key
    if (token.startsWith("sk-")) {
      const supabase = await createClient();
      const user_uuid = await getUserUuidByApiKey(supabase, token);

      return user_uuid || "";
    }
  }

  // 使用 Supabase Auth 获取用户
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    user_uuid = user.id;
  }

  return user_uuid;
}

export async function getBearerToken() {
  const h = await headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  return auth.replace("Bearer ", "");
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
