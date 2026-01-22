"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";

import { ContextValue } from "@/types/context";
import { User } from "@/types/next-auth";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  // 纯 NextAuth.js 认证
  const { data: session, status } = useSession();

  const [theme, setTheme] = useState<string>(() => {
    const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME;
    if (defaultTheme && ["dark", "light"].includes(defaultTheme)) {
      return defaultTheme;
    }
    return "light"; // Default to light
  });

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // 使用 NextAuth 用户
  const effectiveUser = session?.user;
  const isLoading = status === "loading";

  const fetchUserInfo = useCallback(async function () {
    try {
      // 使用 NextAuth 获取用户信息
      const resp = await fetch("/api/get-user-info", {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
    } catch (_e) {
      console.log("fetch user info failed");
    }
  }, []);

  useEffect(() => {
    if (effectiveUser && !isLoading) {
      fetchUserInfo();
    }
  }, [effectiveUser, isLoading, fetchUserInfo]);

  // 使用 NextAuth 用户数据，创建完整的User对象
  const unifiedUser = user || (effectiveUser ? {
    // 核心字段（必需）
    id: effectiveUser.id,
    email: effectiveUser.email,
    tier: effectiveUser.tier,
    creditsUsed: effectiveUser.creditsUsed,

    // 可选字段（可能为null）
    name: effectiveUser.name,
    image: effectiveUser.image,

    // 扩展字段（可选，可空）
    nickname: effectiveUser.nickname ?? null,
    avatarUrl: effectiveUser.avatarUrl || effectiveUser.image || null,

    // 时间戳
    createdAt: effectiveUser.createdAt || new Date(),
    updatedAt: new Date()
  } : null);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        showSignModal,
        setShowSignModal,
        user: unifiedUser,
        setUser,
        showFeedback,
        setShowFeedback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
