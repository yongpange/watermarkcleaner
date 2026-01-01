import ConsoleLayout from "@/components/console/layout";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getTranslations } from "next-intl/server";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";

const ConsoleLayoutWrapper = async ({ children }: { children: ReactNode }) => {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const t = await getTranslations();

  const sidebar: Sidebar = {
    nav: {
      items: [
        // 移除已删除的页面：我的订单、我的积分、API密钥
        // 控制台现在没有导航菜单项
      ],
    },
  };

  return <ConsoleLayout sidebar={sidebar}>{children}</ConsoleLayout>;
};

ConsoleLayoutWrapper.displayName = 'ConsoleLayoutWrapper';

export default ConsoleLayoutWrapper;
