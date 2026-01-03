/**
 * 合并的数据库类型定义
 * 将 Database 和 DatabaseWithWmc 合并为一个类型
 */

import type { Database as OriginalDatabase } from './database.types';
import type { DatabaseWithWmc } from './database-wmc.types';

type Merge<T, U> = Omit<T, keyof U> & U;

// 合并 Database 和 DatabaseWithWmc
export interface Database extends Merge<OriginalDatabase, DatabaseWithWmc> {
  public: OriginalDatabase['public'] & DatabaseWithWmc['public'] & {
    Tables: OriginalDatabase['public']['Tables'] & DatabaseWithWmc['public']['Tables'];
  };
}

// 重新导出所有类型
export type { Json } from './database.types';
export * from './database-wmc.types';
