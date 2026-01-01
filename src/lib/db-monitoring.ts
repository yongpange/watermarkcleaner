/**
 * 数据库性能监控工具
 *
 * 功能：
 * 1. 监控数据库查询性能
 * 2. 记录慢查询
 * 3. 统计数据库操作
 * 4. 健康检查
 */

interface QueryMetric {
  queryName: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface DbHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  slowQueries: QueryMetric[];
  totalQueries: number;
  averageResponseTime: number;
  p95ResponseTime: number;
}

class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queryMetrics: QueryMetric[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1秒
  private readonly MAX_METRICS_STORED = 1000;

  private constructor() {}

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  /**
   * 包装数据库查询，记录性能指标
   */
  async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    let result: T;

    try {
      result = await queryFn();
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err; // 重新抛出错误，不影响业务逻辑
    } finally {
      const duration = Date.now() - startTime;

      // 记录查询指标
      this.recordQuery({
        queryName,
        duration,
        timestamp: new Date(),
        success,
        error
      });

      // 记录慢查询
      if (duration > this.SLOW_QUERY_THRESHOLD) {
        console.warn(`[DB Monitor] Slow query detected: ${queryName} took ${duration}ms`);
      }
    }

    return result;
  }

  /**
   * 记录查询指标
   */
  private recordQuery(metric: QueryMetric): void {
    this.queryMetrics.push(metric);

    // 保持指标数组大小在限制范围内
    if (this.queryMetrics.length > this.MAX_METRICS_STORED) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_STORED);
    }
  }

  /**
   * 获取数据库健康状态
   */
  getHealthStatus(): DbHealthStatus {
    const recentMetrics = this.queryMetrics.slice(-100); // 最近100次查询
    const totalQueries = recentMetrics.length;

    if (totalQueries === 0) {
      return {
        status: 'healthy',
        lastCheck: new Date(),
        slowQueries: [],
        totalQueries: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0
      };
    }

    const successfulQueries = recentMetrics.filter(m => m.success);
    const slowQueries = recentMetrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD);

    const responseTimes = successfulQueries.map(m => m.duration);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

    // 计算P95响应时间
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.ceil(sortedTimes.length * 0.95) - 1;
    const p95ResponseTime = sortedTimes[p95Index] || 0;

    // 确定健康状态
    let status: DbHealthStatus['status'] = 'healthy';
    if (slowQueries.length > 5) status = 'degraded';
    if (slowQueries.length > 10 || !successfulQueries.length) status = 'unhealthy';

    return {
      status,
      lastCheck: new Date(),
      slowQueries: slowQueries.slice(-10), // 最近10个慢查询
      totalQueries,
      averageResponseTime: Math.round(averageResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime)
    };
  }

  /**
   * 获取特定查询的性能统计
   */
  getQueryStats(queryName: string) {
    const queries = this.queryMetrics.filter(m => m.queryName === queryName);
    if (queries.length === 0) return null;

    const successful = queries.filter(m => m.success);
    const avgDuration = successful.reduce((sum, m) => sum + m.duration, 0) / successful.length;
    const maxDuration = Math.max(...successful.map(m => m.duration));
    const minDuration = Math.min(...successful.map(m => m.duration));

    return {
      queryName,
      totalCalls: queries.length,
      successRate: (successful.length / queries.length) * 100,
      averageDuration: Math.round(avgDuration),
      maxDuration: Math.round(maxDuration),
      minDuration: Math.round(minDuration),
      slowQueryCount: queries.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD).length
    };
  }

  /**
   * 清理旧的指标数据
   */
  cleanup(keepLast: number = 100): void {
    this.queryMetrics = this.queryMetrics.slice(-keepLast);
  }
}

// 导出单例实例
export const dbMonitor = DatabaseMonitor.getInstance();

/**
 * 包装Supabase查询的辅助函数
 */
export async function measureSupabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return dbMonitor.measureQuery(queryName, queryFn);
}

/**
 * 数据库健康检查端点
 */
export async function getDatabaseHealth() {
  return dbMonitor.getHealthStatus();
}

/**
 * 获取特定查询的统计信息
 */
export function getQueryPerformanceStats(queryName: string) {
  return dbMonitor.getQueryStats(queryName);
}

/**
 * 常用查询的性能包装器
 */
export const monitoredQueries = {
  async findUserByEmail(supabase: any, email: string) {
    return measureSupabaseQuery('findUserByEmail', async () => {
      return supabase.from('wmc_users').select('id, uuid, email, tier, creditsUsed').eq('email', email).single();
    });
  },

  async findUserByUuid(supabase: any, uuid: string) {
    return measureSupabaseQuery('findUserByUuid', async () => {
      return supabase.from('wmc_users').select('id, uuid, email, tier, creditsUsed').eq('uuid', uuid).single();
    });
  },

  async getUserCredits(supabase: any, userId: string) {
    return measureSupabaseQuery('getUserCredits', async () => {
      return supabase.from('wmc_users').select('id, tier, creditsUsed, creditsReset').eq('id', userId).single();
    });
  },

  async countProcessingHistory(supabase: any, ipAddress: string, startOfMonth: string) {
    return measureSupabaseQuery('countProcessingHistory', async () => {
      return supabase
        .from('wmc_processing_history')
        .select('*', { count: 'exact', head: true })
        .eq('ip_address', ipAddress)
        .gte('created_at', startOfMonth)
        .eq('success', true);
    });
  }
};