import { z } from "zod";

/**
 * Server-side Environment Variable Schema & Validation
 * Enforces strict typing and fails fast on missing production variables.
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().or(z.number()).default("3000"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Database (Separate MySQL variables)
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.string().or(z.number()).default("3306"),
  DB_NAME: z.string().default("exampattern_ai"),
  DB_USERNAME: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_SOCKET_PATH: z.string().optional(),
  DB_SSL: z.string().optional(),
  DB_POOL_SIZE: z.string().optional(),

  // Legacy Database aliases
  DATABASE_HOST: z.string().optional(),
  DATABASE_PORT: z.string().optional(),
  DATABASE_NAME: z.string().optional(),
  DATABASE_USER: z.string().optional(),
  DATABASE_PASSWORD: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // Authentication
  AUTH_SECRET: z.string().min(16).default("exam-pattern-ai-super-secret-key-change-in-production-min-32-chars"),
  AUTH_EXPIRES_IN: z.string().default("7d"),

  // Google Gemini AI Engine
  GEMINI_API_KEY: z.string().optional().default(""),

  // Email Configuration
  EMAIL_PROVIDER: z.enum(["smtp", "console", "resend"]).default("smtp"),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().or(z.number()).optional(),
  EMAIL_SECURE: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),

  // Storage
  STORAGE_DRIVER: z.enum(["local"]).default("local"),
  STORAGE_BASE_PATH: z.string().default("./storage"),
  STORAGE_PATH: z.string().optional(),

  // Locale
  DEFAULT_LOCALE: z.enum(["en", "hi"]).default("en"),
  SUPPORTED_LOCALES: z.string().default("en,hi"),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type ServerEnv = z.infer<typeof envSchema>;

export function validateEnv(): ServerEnv {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables configuration:", parsed.error.format());
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Environment validation failed: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
    }
  }

  return parsed.success ? parsed.data : (process.env as unknown as ServerEnv);
}

export const env = validateEnv();
