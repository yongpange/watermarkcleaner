import { startAutoCleanup } from "./cleanup";

/**
 * 安全服务初始化
 * 在应用启动时调用一次
 */
let initialized = false;

export function initializeSecurityServices() {
  if (initialized) {
    return;
  }

  console.log("🔒 Initializing security services...");

  try {
    // 启动自动清理服务（每24小时清理72小时前的数据）
    startAutoCleanup();

    initialized = true;
    console.log("✅ Security services initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize security services:", error);
  }
}
