import { TableColumn } from "@/types/blocks/table";
import TableSlot from "@/components/dashboard/slots/table";
import { Table as TableSlotType } from "@/types/slots/table";
import { getFeedbacks } from "@/models/feedback";
import moment from "moment";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";

const AdminFeedbacksPage = async () => {
  const supabase = await createClient();
  const feedbacks = await getFeedbacks(supabase, 1, 50);

  const columns: TableColumn[] = [
    {
      title: "User",
      name: "user",
      callback: (row) => {
        const user = row.user as { avatar_url?: string; nickname?: string } | undefined;
        if (!user?.avatar_url) {
          return "-";
        }

        return (
          <div className="flex items-center gap-2">
            <Image
              src={user.avatar_url || "/placeholder-avatar.png"}
              alt={user.nickname || "User avatar"}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <span>{user.nickname}</span>
          </div>
        );
      },
    },
    {
      name: "content",
      title: "Content",
      callback: (row) => row.content as string,
    },
    {
      name: "rating",
      title: "Rating",
      callback: (row) => row.rating as number,
    },
    {
      name: "created_at",
      title: "Created At",
      callback: (row) => moment(row.created_at as string).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      name: "actions",
      title: "Actions",
      callback: (row) => (
        <Link href={`/admin/users?user_uuid=${row.user_uuid as string}`} target="_blank">
          View user
        </Link>
      ),
    },
  ];

  const table: TableSlotType = {
    title: "Feedbacks",
    columns,
    data: feedbacks,
  };

  return <TableSlot {...table} />;
};

AdminFeedbacksPage.displayName = 'AdminFeedbacksPage';

export default AdminFeedbacksPage;
