/**
 * Database Environment Configuration for ExamPattern AI
 * Wraps centralized DatabaseConfigService with separate DB_* variables (host, port, database, user, password, ssl)
 */
import { DatabaseConfigService, SafeDatabaseConfig } from "@/lib/database/config";

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
  poolSize?: number;
  url: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  const safe = DatabaseConfigService.validateAndGetConfig();
  return {
    host: safe.host,
    port: safe.port,
    database: safe.database,
    user: safe.username,
    ssl: safe.ssl,
    poolSize: safe.poolSize,
    url: safe.url,
  };
}

export const dbConfig = getDatabaseConfig();
export { DatabaseConfigService };
export type { SafeDatabaseConfig };
