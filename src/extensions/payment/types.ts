/**
 * Payment System Type Definitions
 * Based on shipany_two_vercel payment architecture
 */

// ============================================================================
// Enums
// ============================================================================

export enum PaymentStatus {
  PROCESSING = 'processing',
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING_CANCEL = 'pending_cancel',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  TRIALING = 'trialing',
}

export enum PaymentType {
  ONE_TIME = 'one_time',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum CreditTransactionType {
  GRANT = 'grant',
  CONSUME = 'consume',
}

export enum CreditTransactionScene {
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  RENEWAL = 'renewal',
  IMAGE_PROCESSING = 'image_processing',
  MIGRATION = 'migration',
  REFUND = 'refund',
  TRANSFER = 'transfer',
}

export enum PaymentEventType {
  CHECKOUT_SUCCESS = 'checkout.success',
  PAYMENT_SUCCESS = 'payment.success',
  SUBSCRIBE_UPDATED = 'subscribe.updated',
  SUBSCRIBE_CANCELED = 'subscribe.canceled',
  PAYMENT_FAILED = 'payment.failed',
}

export enum SubscriptionCycleType {
  CREATE = 'create',
  RENEWAL = 'renewal',
  MIGRATION = 'migration',
  TRIAL = 'trial',
}

// ============================================================================
// Payment Provider Types
// ============================================================================

export interface PaymentProviderConfigs {
  [key: string]: any;
}

export interface PaymentProvider {
  name: string;
  configs: PaymentProviderConfigs;

  createPayment(order: PaymentOrder): Promise<PaymentResult>;
  getPaymentSession(sessionId: string): Promise<PaymentSessionResult>;
  getPaymentEvent(params: { req: Request }): Promise<PaymentEvent | null>;
  getPaymentBilling?(params: {
    customerId: string;
  }): Promise<BillingResult | null>;
  cancelSubscription?(params: {
    subscriptionId: string;
    cancelAtPeriodEnd?: boolean;
  }): Promise<{ success: boolean }>;
}

// ============================================================================
// Payment Price Types
// ============================================================================

export interface PaymentPrice {
  amount: number;
  currency: string;
}

export interface PaymentDiscount {
  code?: string;
  amount?: number;
  percent?: number;
}

// ============================================================================
// Payment Customer Types
// ============================================================================

export interface PaymentCustomer {
  id?: string;
  email: string;
  name?: string;
}

// ============================================================================
// Payment Product Types
// ============================================================================

export interface PaymentProduct {
  id: string;
  name: string;
  description?: string;
  images?: string[];
}

export interface PaymentPlan {
  id?: string;
  productId: string;
  amount: number;
  currency: string;
  interval: PaymentInterval;
  intervalCount?: number;
  trialPeriodDays?: number;
}

// ============================================================================
// Payment Order Types
// ============================================================================

export interface PaymentOrder {
  orderNo: string;
  userId: string;
  userEmail: string;
  paymentProvider?: string;

  // 价格信息
  amount: number; // in cents
  currency: string;
  amountCNY?: number; // CNY amount for Chinese Yuan payment

  // 产品信息
  productId: string;
  productName?: string;
  description?: string;

  // 支付类型
  paymentType: PaymentType;
  paymentInterval?: PaymentInterval;

  // 客户信息
  customer?: PaymentCustomer;

  // 可选字段
  discountCode?: string;
  creditsAmount?: number;
  creditsValidDays?: number;
  successUrl?: string;
  cancelUrl?: string;

  // 提供商特定字段
  providerProductId?: string;
  providerPriceId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

// ============================================================================
// Payment Session Types
// ============================================================================

export interface PaymentSession {
  id: string;
  url?: string;
  status: PaymentStatus;

  // 支付信息
  paymentStatus?: PaymentStatus;
  paymentInfo?: PaymentInfo;

  // 订阅信息
  subscriptionId?: string;
  subscriptionInfo?: SubscriptionInfo;

  // 元数据
  metadata?: Record<string, any>;
  customerId?: string;
  customerEmail?: string;
}

export interface PaymentSessionResult {
  success: boolean;
  session?: PaymentSession;
  error?: string;
}

// ============================================================================
// Payment Info Types
// ============================================================================

export interface PaymentInfo {
  paymentId?: string;
  transactionId?: string;
  amountReceived?: number;
  currency?: string;
  paymentMethod?: string;
  paidAt?: Date;

  // 订阅相关
  subscriptionCycleType?: SubscriptionCycleType;

  // 折扣信息
  discountCode?: string;
  discountAmount?: number;
}

// ============================================================================
// Subscription Info Types
// ============================================================================

export interface SubscriptionInfo {
  subscriptionId: string;
  status: SubscriptionStatus;

  // 金额和周期
  amount?: number;
  currency?: string;
  interval?: PaymentInterval;
  intervalCount?: number;

  // 当前周期
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  trialPeriodDays?: number;
  trialStart?: Date;
  trialEnd?: Date;

  // 取消信息
  canceledAt?: Date;
  cancelAtPeriodEnd?: boolean;
  cancelReason?: string;

  // 元数据
  metadata?: Record<string, any>;
}

// ============================================================================
// Payment Event Types
// ============================================================================

export interface PaymentEvent {
  eventType: PaymentEventType;
  raw?: any;

  // 支付会话信息
  paymentSession?: PaymentSession;

  // 错误信息
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// Billing Types
// ============================================================================

export interface BillingResult {
  url: string;
}

// ============================================================================
// Credit Types
// ============================================================================

export interface CreditGrant {
  userId: string;
  credits: number;
  orderNo?: string;
  subscriptionNo?: string;
  validDays?: number;
  expiresAt?: Date;
  scene?: CreditTransactionScene;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreditConsume {
  userId: string;
  amount: number;
  scene?: CreditTransactionScene;
  imageSize?: number;
  processingTime?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Model Types (Database)
// ============================================================================

export interface OrderRecord {
  id: string;
  orderNo: string;
  userId: string;
  userEmail?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentType?: PaymentType;
  paymentInterval?: PaymentInterval;
  paymentProvider: string;
  paymentSessionId?: string;
  checkoutInfo: string;
  checkoutResult?: string;
  paymentResult?: string;
  paymentEmail?: string;
  paymentAmountReceived?: number;
  paymentCurrencyReceived?: string;
  transactionId?: string;
  subscriptionId?: string;
  subscriptionResult?: string;
  discountCode?: string;
  discountAmount?: number;
  discountCurrency?: string;
  creditsAmount?: number;
  creditsValidDays?: number;
  productId?: string;
  productName?: string;
  planName?: string;
  invoiceId?: string;
  invoiceUrl?: string;
  paidAt?: Date;
  checkoutUrl?: string;
  callbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SubscriptionRecord {
  id: string;
  subscriptionNo: string;
  userId: string;
  userEmail?: string;
  status: SubscriptionStatus;
  paymentProvider: string;
  subscriptionId: string;
  subscriptionResult?: string;
  productId?: string;
  productName?: string;
  amount?: number;
  currency?: string;
  interval?: PaymentInterval;
  intervalCount?: number;
  trialPeriodDays?: number;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
  canceledEndAt?: Date;
  canceledReason?: string;
  canceledReasonType?: string;
  planName?: string;
  billingUrl?: string;
  creditsAmount?: number;
  creditsValidDays?: number;
  paymentProductId?: string;
  paymentUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreditRecord {
  id: string;
  userId: string;
  userEmail?: string;
  orderNo?: string;
  subscriptionNo?: string;
  transactionNo: string;
  transactionType: CreditTransactionType;
  transactionScene?: CreditTransactionScene;
  credits: number;
  remainingCredits: number;
  description?: string;
  metadata?: string;
  expiresAt?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export class PaymentError extends Error {
  code: string;
  provider?: string;

  constructor(message: string, code: string, provider?: string) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.provider = provider;
  }
}