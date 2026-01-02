import { createAdminClient } from "@/lib/supabase-admin";

/**
 * 数据清理服务
 * 定期清理旧的处理记录，保护用户隐私
 */

/**
 * 清理超过指定期限的处理历史记录
 * @param daysToKeep - 保留多少天内的记录（默认72小时=3天）
 * @returns 清理结果
 */
export async function cleanupProcessingHistory(daysToKeep: number = 3) {
  const supabase = createAdminClient();

  // 计算截止日期（72小时前）
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - daysToKeep * 24);

  console.log(`Starting cleanup of processing history older than ${daysToKeep} days...`);
  console.log(`Cutoff date: ${cutoffDate.toISOString()}`);

  try {
    // 删除旧的记录
    const { error, count } = await supabase
      .from("wmc_processing_history")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      console.error("Cleanup failed:", error);
      return {
        success: false,
        error: error.message,
        deletedCount: 0,
      };
    }

    const deletedCount = count || 0;
    console.log(`✅ Cleanup completed. Deleted ${deletedCount} old records.`);

    return {
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    };
  } catch (error) {
    console.error("Cleanup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deletedCount: 0,
    };
  }
}

/**
 * 自动清理调度器
 * 每24小时执行一次清理
 */
export function startAutoCleanup() {
  // 每24小时执行一次清理
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
  const DAYS_TO_KEEP = 3; // 保留3天

  // 立即执行一次清理
  cleanupProcessingHistory(DAYS_TO_KEEP).catch((error) => {
    console.error("Initial cleanup failed:", error);
  });

  // 设置定时任务
  setInterval(async () => {
    try {
      console.log("Starting scheduled cleanup...");
      await cleanupProcessingHistory(DAYS_TO_KEEP);
    } catch (error) {
      console.error("Scheduled cleanup failed:", error);
    }
  }, CLEANUP_INTERVAL);

  console.log("✅ Auto cleanup scheduler started. Will run every 24 hours.");
}

/**
 * 获取统计数据
 * @returns 数据库统计信息
 */
export async function getCleanupStats() {
  const supabase = createAdminClient();

  try {
    // 获取总记录数
    const { count: totalCount, error: totalError } = await supabase
      .from("wmc_processing_history")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    // 获取72小时前的记录数
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 72);

    const { count: oldCount, error: oldError } = await supabase
      .from("wmc_processing_history")
      .select("*", { count: "exact", head: true })
      .lt("created_at", cutoffDate.toISOString());

    if (oldError) throw oldError;

    return {
      success: true,
      totalRecords: totalCount || 0,
      recordsOlderThan72Hours: oldCount || 0,
      nextCleanup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error("Failed to get stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
