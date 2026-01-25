export const runtime = 'edge';

import DataCards from "@/components/blocks/data-cards";
import DataCharts from "@/components/blocks/data-charts";
import Header from "@/components/dashboard/header";
import { getUserCountByDate, getUsersTotal } from "@/models/user";
import { DataCard } from "@/types/blocks/base";
import { createClient } from "@/lib/supabase-server";

const AdminDashboardPage = async () => {
  const supabase = await createClient();
  const totalUsers = await getUsersTotal(supabase);

  const dataCards: DataCard[] = [
    {
      title: "Total Users",
      label: "",
      value: (totalUsers || 0).toString(),
      description: "Total users registered in the system",
    },
    // 移除已删除的统计卡片：订单、反馈
  ];

  // Get data for the last 90 days - 只统计用户数据
  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 90);
  const users = await getUserCountByDate(supabase, startTime.toISOString());

  // 只处理用户数据，不再包含订单数据
  const data = users ? Array.from(users.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, count]) => ({
      date,
      users: count,
      orders: 0, // 订单数据不再可用
    })) : [];

  const fields = [
    { key: "users", label: "Users", color: "var(--primary)" },
    // 移除订单字段
  ];

  return (
    <div className="flex flex-col gap-4">
      <Header />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <DataCards dataCards={dataCards} />
            <div className="px-4 lg:px-6">
              <DataCharts
                data={data}
                fields={fields}
                title="Users Overview"
                description="Daily users data"
                defaultTimeRange="90d"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AdminDashboardPage.displayName = 'AdminDashboardPage';

export default AdminDashboardPage;
