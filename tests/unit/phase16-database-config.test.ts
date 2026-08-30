import { describe, it, expect } from "vitest";
import { DatabaseConfigService, databaseEnvSchema } from "@/lib/database/config";

describe("Phase 16: Separate MySQL Database Environment Variables & Configuration Tests", () => {
  describe("Valid Database Configuration Parsing", () => {
    it("should construct valid MySQL connection URL from separate variables", () => {
      const config = DatabaseConfigService.validateAndGetConfig({
        DB_HOST: "127.0.0.1",
        DB_PORT: 3306,
        DB_NAME: "exampattern_ai",
        DB_USERNAME: "exam_user",
        DB_PASSWORD: "secret_password_123",
      });

      expect(config.host).toBe("127.0.0.1");
      expect(config.port).toBe(3306);
      expect(config.database).toBe("exampattern_ai");
      expect(config.username).toBe("exam_user");
      expect(config.hasPassword).toBe(true);
      expect(config.url).toBe("mysql://exam_user:secret_password_123@127.0.0.1:3306/exampattern_ai");
    });

    it("should handle empty password for local root setups", () => {
      const config = DatabaseConfigService.validateAndGetConfig({
        DB_HOST: "localhost",
        DB_PORT: 3306,
        DB_NAME: "test_db",
        DB_USERNAME: "root",
        DB_PASSWORD: "",
      });

      expect(config.hasPassword).toBe(false);
      expect(config.url).toBe("mysql://root:@localhost:3306/test_db");
    });

    it("should properly URL-encode special characters in usernames and passwords", () => {
      const config = DatabaseConfigService.validateAndGetConfig({
        DB_HOST: "127.0.0.1",
        DB_PORT: 3306,
        DB_NAME: "exampattern_ai",
        DB_USERNAME: "user@domain",
        DB_PASSWORD: "p@ss#word/123?",
      });

      expect(config.url).toContain("user%40domain:p%40ss%23word%2F123%3F@");
    });

    it("should include SSL and pool size parameters when configured", () => {
      const config = DatabaseConfigService.validateAndGetConfig({
        DB_HOST: "db.remote.com",
        DB_PORT: 3306,
        DB_NAME: "prod_db",
        DB_USERNAME: "prod_user",
        DB_PASSWORD: "prod_password",
        DB_SSL: true,
        DB_POOL_SIZE: 25,
      });

      expect(config.ssl).toBe(true);
      expect(config.poolSize).toBe(25);
      expect(config.url).toContain("sslaccept=strict");
      expect(config.url).toContain("connection_limit=25");
    });
  });

  describe("Port & Parameter Validation", () => {
    it("should reject invalid non-numeric port", () => {
      const result = databaseEnvSchema.safeParse({
        DB_HOST: "127.0.0.1",
        DB_PORT: "invalid_port",
        DB_NAME: "test_db",
        DB_USERNAME: "root",
        DB_PASSWORD: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject out-of-range port numbers (< 1 or > 65535)", () => {
      const negResult = databaseEnvSchema.safeParse({
        DB_HOST: "127.0.0.1",
        DB_PORT: -1,
        DB_NAME: "test_db",
        DB_USERNAME: "root",
        DB_PASSWORD: "",
      });

      const highResult = databaseEnvSchema.safeParse({
        DB_HOST: "127.0.0.1",
        DB_PORT: 99999,
        DB_NAME: "test_db",
        DB_USERNAME: "root",
        DB_PASSWORD: "",
      });

      expect(negResult.success).toBe(false);
      expect(highResult.success).toBe(false);
    });

    it("should reject missing DB_HOST or DB_NAME or DB_USERNAME", () => {
      expect(() =>
        DatabaseConfigService.validateAndGetConfig({
          DB_HOST: "",
          DB_PORT: 3306,
          DB_NAME: "test_db",
          DB_USERNAME: "root",
          DB_PASSWORD: "",
        })
      ).toThrowError(/Database configuration validation failed/);

      expect(() =>
        DatabaseConfigService.validateAndGetConfig({
          DB_HOST: "127.0.0.1",
          DB_PORT: 3306,
          DB_NAME: "",
          DB_USERNAME: "root",
          DB_PASSWORD: "",
        })
      ).toThrowError(/Database configuration validation failed/);
    });
  });

  describe("Sanitized Summary & Password Protection", () => {
    it("should mask password in sanitized summary and not leak in string representations", () => {
      const testEnv = {
        DB_HOST: "127.0.0.1",
        DB_PORT: 3306,
        DB_NAME: "secure_db",
        DB_USERNAME: "app_user",
        DB_PASSWORD: "SuperSecretPassword99!",
      };

      const summary = DatabaseConfigService.getSanitizedSummary(testEnv);
      expect(summary.hasPassword).toBe(true);
      expect(summary.connectionString).toBe("mysql://app_user:******@127.0.0.1:3306/secure_db");
      expect(summary.connectionString).not.toContain("SuperSecretPassword99!");
      expect(JSON.stringify(summary)).not.toContain("SuperSecretPassword99!");
    });
  });
});
