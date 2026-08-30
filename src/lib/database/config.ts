import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables if not already loaded
dotenv.config();

/**
 * Zod schema for separate MySQL connection variables
 */
const dbPortSchema = z
  .union([z.string(), z.number()])
  .transform((val) => (typeof val === "number" ? val : parseInt(val, 10)))
  .refine((port) => !isNaN(port) && port >= 1 && port <= 65535, {
    message: "DB_PORT must be a valid TCP port number between 1 and 65535",
  });

export const databaseEnvSchema = z.object({
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_PORT: dbPortSchema.default(3306),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_USERNAME: z.string().min(1, "DB_USERNAME is required"),
  DB_PASSWORD: z.string().default(""),
  DB_SOCKET_PATH: z.string().optional(),
  DB_SSL: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true" || val === "1")
    .default(false),
  DB_POOL_SIZE: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
});

export interface SafeDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  hasPassword: boolean;
  ssl: boolean;
  poolSize?: number;
  socketPath?: string;
  url: string;
}

/**
 * Centralized Database Configuration Service
 * Reads and validates separate DB_* environment variables,
 * constructs a secure MySQL 8 connection URL, and sanitizes output.
 */
export class DatabaseConfigService {
  private static cachedConfig: SafeDatabaseConfig | null = null;

  /**
   * Reads raw environment with support for DB_* primary keys and legacy DATABASE_* aliases
   */
  private static readRawEnv() {
    return {
      DB_HOST: process.env.DB_HOST || process.env.DATABASE_HOST || "127.0.0.1",
      DB_PORT: process.env.DB_PORT || process.env.DATABASE_PORT || 3306,
      DB_NAME: process.env.DB_NAME || process.env.DATABASE_NAME || "exampattern_ai",
      DB_USERNAME: process.env.DB_USERNAME || process.env.DATABASE_USER || "root",
      DB_PASSWORD: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : process.env.DATABASE_PASSWORD || "",
      DB_SOCKET_PATH: process.env.DB_SOCKET_PATH,
      DB_SSL: process.env.DB_SSL || process.env.DATABASE_SSL || false,
      DB_POOL_SIZE: process.env.DB_POOL_SIZE || process.env.DATABASE_POOL_SIZE,
    };
  }

  /**
   * Validates database configuration and builds connection URL
   */
  public static validateAndGetConfig(customEnv?: Record<string, unknown>): SafeDatabaseConfig {
    const raw = customEnv || this.readRawEnv();
    const result = databaseEnvSchema.safeParse(raw);

    if (!result.success) {
      const missingOrInvalid = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new Error(`Database configuration validation failed: ${missingOrInvalid}`);
    }

    const data = result.data;

    // Construct MySQL connection URL
    const encodedUser = encodeURIComponent(data.DB_USERNAME);
    const encodedPass = data.DB_PASSWORD ? encodeURIComponent(data.DB_PASSWORD) : "";
    const authPart = encodedPass ? `${encodedUser}:${encodedPass}` : `${encodedUser}:`;

    const params: string[] = [];
    if (data.DB_SSL) params.push("sslaccept=strict");
    if (data.DB_POOL_SIZE && data.DB_POOL_SIZE > 0) params.push(`connection_limit=${data.DB_POOL_SIZE}`);
    if (data.DB_SOCKET_PATH) params.push(`socket=${encodeURIComponent(data.DB_SOCKET_PATH)}`);

    const queryParams = params.length > 0 ? `?${params.join("&")}` : "";
    const url = `mysql://${authPart}@${data.DB_HOST}:${data.DB_PORT}/${data.DB_NAME}${queryParams}`;

    // Programmatically initialize process.env.DATABASE_URL for Prisma Client / CLI
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL !== url) {
      process.env.DATABASE_URL = url;
    }

    const config: SafeDatabaseConfig = {
      host: data.DB_HOST,
      port: data.DB_PORT,
      database: data.DB_NAME,
      username: data.DB_USERNAME,
      hasPassword: Boolean(data.DB_PASSWORD && data.DB_PASSWORD.length > 0),
      ssl: data.DB_SSL,
      poolSize: data.DB_POOL_SIZE,
      socketPath: data.DB_SOCKET_PATH,
      url,
    };

    if (!customEnv) {
      this.cachedConfig = config;
    }

    return config;
  }

  /**
   * Returns the database URL constructed from separate variables
   */
  public static getDatabaseUrl(): string {
    if (this.cachedConfig) {
      return this.cachedConfig.url;
    }
    return this.validateAndGetConfig().url;
  }

  /**
   * Returns safe sanitized connection summary for health checks or diagnostics
   */
  public static getSanitizedSummary(customEnv?: Record<string, unknown>): Omit<SafeDatabaseConfig, "url"> & { connectionString: string } {
    const config = customEnv ? this.validateAndGetConfig(customEnv) : this.cachedConfig || this.validateAndGetConfig();
    const maskedPass = config.hasPassword ? "******" : "";
    const authDisplay = maskedPass ? `${config.username}:${maskedPass}` : config.username;

    return {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      hasPassword: config.hasPassword,
      ssl: config.ssl,
      poolSize: config.poolSize,
      socketPath: config.socketPath,
      connectionString: `mysql://${authDisplay}@${config.host}:${config.port}/${config.database}`,
    };
  }
}

// Auto-run validation on module load to guarantee process.env.DATABASE_URL is set
DatabaseConfigService.validateAndGetConfig();
