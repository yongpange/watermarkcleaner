import DashboardLayout from "@/components/dashboard/layout";
import Empty from "@/components/blocks/empty";
import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import { getUserInfo } from "@/services/user";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",");
  if (!adminEmails?.includes(userInfo?.email)) {
    return <Empty message="No access" />;
  }

  const sidebar: Sidebar = {
    brand: {
      title: "WatermarkCleaner",
      logo: {
        src: "/logo.png",
        alt: "WatermarkCleaner",
      },
      url: "/admin",
    },
    nav: {
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: "RiDashboardLine",
        },
      ],
    },
    library: {
      title: "Menu",
      items: [
        {
          title: "Users",
          url: "/admin/users",
          icon: "RiUserLine",
        },
        {
          title: "Posts",
          url: "/admin/posts",
          icon: "RiArticleLine",
        },
      ],
    },
    bottomNav: {
      items: [],
    },
    social: {
      items: [],
    },
    account: {
      items: [
        {
          title: "Home",
          url: "/",
          icon: "RiHomeLine",
          target: "_blank",
        },
        {
          title: "Recharge",
          url: "/pricing",
          icon: "RiMoneyDollarBoxLine",
          target: "_blank",
        },
      ],
    },
  };

  return <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>;
}
