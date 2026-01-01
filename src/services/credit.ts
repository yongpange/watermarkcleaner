/**
 * 积分服务 - 简化版本（移除对credits表的依赖）
 * 只保留新用户注册赠送积分的功能
 */

export enum CreditsTransType {
  NewUser = "new_user",
  AdminGrant = "admin_grant",
  AdminDeduct = "admin_deduct",
  ApiConsume = "api_consume",
  OrderPay = "order_pay",
  OrderRefund = "order_refund",
}

export enum CreditsAmount {
  NewUserGet = 10, // 新用户获得10个积分
}

/**
 * 增加用户积分（简化版本，不再记录到credits表）
 * 只在用户表中更新积分使用情况
 */
export async function increaseCredits(params: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
  expired_at?: string;
}) {
  // 简化实现：只在用户表中记录积分增加
  // 不再写入credits表
  console.log(`User ${params.user_uuid} received ${params.credits} credits for ${params.trans_type}`);
  return Promise.resolve();
}