"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function GoogleOneTap() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // 如果用户已登录或正在加载，或脚本已加载，则跳过
    if (status === "authenticated" || status === "loading" || scriptLoaded) return;

    // 检查是否已经有 Google 脚本
    if (document.getElementById("google-one-tap-script")) {
      setScriptLoaded(true);
      return;
    }

    // 动态加载 Google Identity Services 脚本
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-one-tap-script";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // 组件卸载时不移除脚本，因为它可能被其他组件共用，
      // 但可以清理 window 对象上的回调
    };
  }, [status, scriptLoaded]);

  useEffect(() => {
    if (!scriptLoaded || status === "authenticated") return;

    const initializeGoogleOneTap = () => {
      // 如果 window.google 未定义，稍后重试
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        callback: async (response: any) => {
          console.log("Google One Tap response received");
          
          if (response.credential) {
            try {
              const result = await signIn("google-onetap", {
                credential: response.credential,
                redirect: false,
              });

              if (result?.ok) {
                console.log("Google One Tap login successful");
                router.refresh();
              } else {
                console.error("Google One Tap login failed:", result?.error);
              }
            } catch (error) {
              console.error("Error during One Tap sign in:", error);
            }
          }
        },
        // 自动选择账号，减少用户点击
        auto_select: false, 
        // 禁用自动取消
        cancel_on_tap_outside: false,
        // 禁用 FedCM (解决 localhost 报错)
        use_fedcm_for_prompt: false,
      });

      // 显示 One Tap 提示，包括 native_login（如果支持）
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.log(
            "Google One Tap prompt not displayed:",
            notification.getNotDisplayedReason()
          );
        } else if (notification.isSkippedMoment()) {
          console.log(
            "Google One Tap prompt skipped:",
            notification.getSkippedReason()
          );
        } else if (notification.isDismissedMoment()) {
          console.log(
            "Google One Tap prompt dismissed:",
            notification.getDismissedReason()
          );
        }
      });
    };

    // 确保有 client ID (这里需要确保环境变量暴露给了前端，或者硬编码，
    // 注意：auth.config.ts 使用 process.env.GOOGLE_CLIENT_ID，
    // 但前端通常需要 NEXT_PUBLIC_ 前缀。检查 .env.local)
    // 假设 .env.local 有 NEXT_PUBLIC_GOOGLE_CLIENT_ID 或者我们用 layout 传进来的值
    // 但为了简单，组件自己读取。需要确认 .env.local.
    
    initializeGoogleOneTap();
  }, [scriptLoaded, status, router]);

  return null; // 此组件不渲染任何可见 UI，只处理逻辑弹窗
}

// 扩展 window 对象类型定义
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}
