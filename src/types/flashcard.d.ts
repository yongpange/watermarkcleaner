/**
 * Flashcard 类型定义
 * 用于学习闪卡功能的数据结构
 */

/**
 * 闪卡完整数据结构（数据库记录）
 */
export interface Flashcard {
  id: number;
  uuid: string;
  user_uuid: string | null;
  file_id: string;

  // 闪卡内容
  question: string;
  answer: string;
  explanation: string | null;

  // 元数据
  source: "ai" | "manual";
  order: number;

  // 学习进度（SRS 算法）
  views: number;
  mastery: number; // 0-100
  ease_factor: number;
  interval: number; // 天数
  repetitions: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;

  // 扩展功能
  is_favorited: boolean;
  tags: string | null;

  // 时间戳
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

/**
 * 创建闪卡的输入数据
 */
export interface FlashcardCreateInput {
  file_id: string;
  question: string;
  answer: string;
  explanation?: string;
  order?: number;
  source?: "ai" | "manual";
}

/**
 * 更新闪卡的输入数据
 */
export interface FlashcardUpdateInput {
  question?: string;
  answer?: string;
  explanation?: string;
  order?: number;
  is_favorited?: boolean;
  tags?: string;
}

/**
 * 复习闪卡的输入数据（SM-2 算法）
 */
export interface FlashcardReviewInput {
  quality: number; // 0-5 (0=完全忘记, 5=完美记忆)
}

/**
 * 批量保存闪卡的请求体
 */
export interface FlashcardBatchSaveRequest {
  fileId: string;
  flashcards: FlashcardCreateInput[];
}

/**
 * 闪卡列表响应
 */
export interface FlashcardListResponse {
  success: boolean;
  data?: {
    flashcards: Flashcard[];
    count: number;
    hasMore?: boolean;
  };
  error?: string;
  details?: string;
}

/**
 * 单个闪卡响应
 */
export interface FlashcardResponse {
  success: boolean;
  data?: Flashcard;
  error?: string;
  details?: string;
}

/**
 * 批量保存闪卡响应
 */
export interface FlashcardBatchSaveResponse {
  success: boolean;
  message?: string;
  data?: {
    flashcards: Flashcard[];
    count: number;
    expiresAt: string | null;
  };
  error?: string;
  details?: string;
}

/**
 * 复习闪卡响应
 */
export interface FlashcardReviewResponse {
  success: boolean;
  message?: string;
  data?: {
    flashcard: Flashcard;
    nextReview: {
      interval: number;
      nextReviewAt: string;
    };
  };
  error?: string;
  details?: string;
}

/**
 * 前端使用的闪卡数据（简化版）
 */
export interface FlashcardData {
  question: string;
  answer: string;
  explanation?: string;
}

