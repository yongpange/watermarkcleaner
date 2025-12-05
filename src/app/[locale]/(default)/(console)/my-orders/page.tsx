import { getOrdersByPaidEmail, getOrdersByUserUuid } from "@/models/order";
import { getUserEmail, getUserUuid } from "@/services/user";

import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/console/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getTranslations } from "next-intl/server";
import moment from "moment";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

const MyOrdersPage = async () => {
  const t = await getTranslations();

  const user_uuid = await getUserUuid();
  const user_email = await getUserEmail();

  const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/my-orders`;
  if (!user_uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const supabase = await createClient();

  let orders = await getOrdersByUserUuid(supabase, user_uuid);
  if (!orders || orders.length === 0) {
    orders = await getOrdersByPaidEmail(supabase, user_email);
  }

  const columns: TableColumn[] = [
    { name: "order_no", title: t("my_orders.table.order_no") },
    { name: "paid_email", title: t("my_orders.table.email") },
    { name: "product_name", title: t("my_orders.table.product_name") },
    {
      name: "amount",
      title: t("my_orders.table.amount"),
      callback: (item) => {
        const currency = item.currency as string;
        const amount = item.amount as number;
        return `${currency.toUpperCase() === "CNY" ? "¥" : "$"} ${amount / 100}`;
      },
    },
    {
      name: "paid_at",
      title: t("my_orders.table.paid_at"),
      callback: (item) =>
        moment(item.paid_at as string).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const table: TableSlotType = {
    title: t("my_orders.title"),
    toolbar: {
      items: [
        {
          title: t("my_orders.read_docs"),
          icon: "RiBookLine",
          url: "https://docs.turbolearn.ai",
          target: "_blank",
          variant: "outline",
        },
        {
          title: t("my_orders.join_discord"),
          icon: "RiDiscordFill",
          url: "https://discord.gg/HQNnrzjZQS",
          target: "_blank",
        },
      ],
    },
    columns: columns,
    data: orders,
    empty_message: t("my_orders.no_orders"),
  };

  return <TableSlot {...table} />;
};

MyOrdersPage.displayName = 'MyOrdersPage';

export default MyOrdersPage;
