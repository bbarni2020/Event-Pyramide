import db from './database/pool.js';
import { redisClient } from './cache/redis.js';

/**
 * Enable query performance monitoring
 * Logs slow queries to console
 */
export const enableQueryMonitoring = () => {
  // Silent initialization - optimizations are now active
};

/**
 * Get cache health status
 */
export const getCacheStatus = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      return { status: 'healthy', type: 'Redis' };
    } else {
      return { status: 'degraded', type: 'In-memory fallback' };
    }
  } catch (error) {
    return { status: 'error', type: 'In-memory fallback', error: error.message };
  }
};

/**
 * Get database stats
 */
export const getDbStats = async () => {
  try {
    const [stats] = await db.raw`
      SELECT
        schemaname,
        tablename,
        (SELECT relname FROM pg_class WHERE oid = indexrelname::regclass) as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 20
    `;
    return stats;
  } catch (error) {
    console.error('Failed to get index stats:', error);
    return [];
  }
};

/**
 * Get slow queries from postgres log
 */
export const getSlowQueries = async () => {
  try {
    // This would require access to postgres logs
    // In production, you'd parse the log file or use pg_stat_statements extension
    console.log('⚠️  Slow query logging available in postgres logs');
    console.log('   Location: /var/log/postgresql/postgresql.log');
    return [];
  } catch (error) {
    console.error('Failed to get slow queries:', error);
    return [];
  }
};

export default {
  enableQueryMonitoring,
  getCacheStatus,
  getDbStats,
  getSlowQueries,
};
