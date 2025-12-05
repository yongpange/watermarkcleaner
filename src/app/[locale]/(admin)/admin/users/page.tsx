import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getUsers } from "@/models/user";
import moment from "moment";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";

const AdminUsersPage = async () => {
  const supabase = await createClient();
  const users = await getUsers(supabase, 1, 50);

  const columns: TableColumn[] = [
    { name: "uuid", title: "UUID" },
    { name: "email", title: "Email" },
    { name: "nickname", title: "Name" },
    {
      name: "avatar_url",
      title: "Avatar",
      callback: (row) => (
        <Image
          src={(row.avatar_url as string) || "/placeholder-avatar.png"}
          alt={(row.nickname as string) || "User avatar"}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full"
        />
      ),
    },
    {
      name: "created_at",
      title: "Created At",
      callback: (row) => moment(row.created_at as string).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const table: TableSlotType = {
    title: "All Users",
    columns,
    data: users,
  };

  return <TableSlot {...table} />;
};

AdminUsersPage.displayName = 'AdminUsersPage';

export default AdminUsersPage;
