import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getPaiedOrders } from "@/models/order";
import moment from "moment";
import { createClient } from "@/lib/supabase-server";

const AdminOrdersPage = async () => {
  const supabase = await createClient();
  const orders = await getPaiedOrders(supabase, 1, 50);

  const columns: TableColumn[] = [
    { name: "order_no", title: "Order No" },
    { name: "paid_email", title: "Paid Email" },
    { name: "product_name", title: "Product Name" },
    { name: "amount", title: "Amount" },
    {
      name: "created_at",
      title: "Created At",
      callback: (row) => moment(row.created_at as string).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const table: TableSlotType = {
    title: "Paid Orders",
    columns,
    data: orders,
  };

  return <TableSlot {...table} />;
};

AdminOrdersPage.displayName = 'AdminOrdersPage';

export default AdminOrdersPage;
