import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { DatabaseConfigService } from "@/lib/database/config";
import { AuditService } from "@/services/audit/audit.service";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import { execSync } from "child_process";

export type DatabaseOperationType = "IDLE" | "BACKUP" | "CLEAN" | "SEED";

export interface DatabaseStatusSummary {
  environment: string;
  database: string;
  host: string;
  port: number;
  status: "connected" | "disconnected";
  tablesCount: number;
  totalRows: number;
  backupsCount: number;
  currentOperation: DatabaseOperationType;
  operationStartedAt?: Date | null;
  serverTime: string;
}

export interface CleanDataPreview {
  mode: "TEST_DATA" | "ALL_DATA";
  candidatesCount: number;
  candidateProfilesCount: number;
  attemptsCount: number;
  resultsCount: number;
  practiceTestsCount: number;
  mockTestsCount: number;
  questionsCount: number;
  documentsCount: number;
  examsCount: number;
  adminsPreservedCount: number;
  isProduction: boolean;
  requiredConfirmationPhrase: string;
}

export class DatabaseManagementService {
  private static operationLock: {
    type: DatabaseOperationType;
    startedAt: Date | null;
    adminId: string | null;
  } = {
    type: "IDLE",
    startedAt: null,
    adminId: null,
  };

  private static getBackupsDir(): string {
    const basePath = process.env.STORAGE_BASE_PATH || "./storage";
    const backupsDir = path.resolve(basePath, "private", "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    return backupsDir;
  }

  /**
   * Concurrency Lock Guard
   */
  private static acquireLock(type: DatabaseOperationType, adminId: string) {
    // 10-minute auto-release safety timeout in case a process died
    if (this.operationLock.type !== "IDLE" && this.operationLock.startedAt) {
      const elapsedMs = Date.now() - this.operationLock.startedAt.getTime();
      if (elapsedMs > 10 * 60 * 1000) {
        console.warn(`⚠️ [DatabaseManagement] Previous operation lock (${this.operationLock.type}) timed out. Auto-releasing.`);
        this.releaseLock();
      }
    }

    if (this.operationLock.type !== "IDLE") {
      throw new ConflictError(
        `Another database operation (${this.operationLock.type}) is currently in progress. Please wait for it to complete.`
      );
    }

    this.operationLock = {
      type,
      startedAt: new Date(),
      adminId,
    };
  }

  private static releaseLock() {
    this.operationLock = {
      type: "IDLE",
      startedAt: null,
      adminId: null,
    };
  }

  /**
   * Get safe database status and infrastructure overview
   */
  public static async getStatus(): Promise<DatabaseStatusSummary> {
    const config = DatabaseConfigService.getSanitizedSummary();

    let status: "connected" | "disconnected" = "connected";
    let tablesCount = 0;
    let totalRows = 0;

    try {
      const tables: { TABLE_NAME: string; TABLE_ROWS: number }[] = await prisma.$queryRawUnsafe(`
        SELECT TABLE_NAME, TABLE_ROWS 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE();
      `);

      tablesCount = tables.length;
      totalRows = tables.reduce((acc, t) => acc + (Number(t.TABLE_ROWS) || 0), 0);
    } catch (err) {
      console.error("Database connection error in status check:", err);
      status = "disconnected";
    }

    let backupsCount = 0;
    try {
      backupsCount = await prisma.databaseBackup.count();
    } catch {
      // Table might not exist yet before first push
    }

    // Mask hostname safely
    const maskedHost = config.host === "127.0.0.1" || config.host === "localhost"
      ? config.host
      : config.host.replace(/^(.)(.*)(.{3})$/, (_, a, _b, c) => `${a}***${c}`);

    return {
      environment: process.env.NODE_ENV || "development",
      database: config.database,
      host: maskedHost,
      port: config.port,
      status,
      tablesCount,
      totalRows,
      backupsCount,
      currentOperation: this.operationLock.type,
      operationStartedAt: this.operationLock.startedAt,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Create Full Server-Side MySQL Database Backup
   */
  public static async createBackup(adminId: string): Promise<{
    id: string;
    filename: string;
    sizeBytes: number;
    tablesCount: number;
    rowsCount: number;
  }> {
    this.acquireLock("BACKUP", adminId);

    const safeConfig = DatabaseConfigService.getSanitizedSummary();
    const backupsDir = this.getBackupsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${safeConfig.database}-${timestamp}.sql`;
    const filePath = path.join(backupsDir, filename);

    let backupRecord;
    try {
      backupRecord = await prisma.databaseBackup.create({
        data: {
          filename,
          storagePath: filePath,
          databaseName: safeConfig.database,
          environment: process.env.NODE_ENV || "development",
          status: "IN_PROGRESS",
          createdById: adminId,
        },
      });

      // 1. Fetch all tables in current database
      const tablesResult: { TABLE_NAME: string }[] = await prisma.$queryRawUnsafe(`
        SELECT TABLE_NAME 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
        ORDER BY TABLE_NAME ASC;
      `);

      const tables = tablesResult.map((t) => t.TABLE_NAME);
      let totalExportedRows = 0;

      // 2. Build Standard MySQL 8 SQL Dump File
      const writeStream = fs.createWriteStream(filePath, { encoding: "utf8" });

      writeStream.write(`-- ExamPattern AI MySQL 8 Database Backup\n`);
      writeStream.write(`-- Generated: ${new Date().toISOString()}\n`);
      writeStream.write(`-- Database: ${safeConfig.database}\n`);
      writeStream.write(`-- Environment: ${process.env.NODE_ENV || "development"}\n\n`);
      writeStream.write(`SET NAMES utf8mb4;\n`);
      writeStream.write(`SET FOREIGN_KEY_CHECKS = 0;\n\n`);

      for (const table of tables) {
        // Fetch CREATE TABLE statement
        const createResult: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`SHOW CREATE TABLE \`${table}\`;`);
        const firstRow = createResult?.[0] || {};
        const createTableSql =
          (firstRow.f1 as string) ||
          (firstRow["Create Table"] as string) ||
          (firstRow["create table"] as string) ||
          (Object.values(firstRow).find(
            (v) => typeof v === "string" && v.toUpperCase().startsWith("CREATE TABLE")
          ) as string | undefined);

        if (createTableSql) {
          writeStream.write(`-- --------------------------------------------------------\n`);
          writeStream.write(`-- Table structure for table \`${table}\`\n`);
          writeStream.write(`-- --------------------------------------------------------\n`);
          writeStream.write(`DROP TABLE IF EXISTS \`${table}\`;\n`);
          writeStream.write(`${createTableSql};\n\n`);
        }

        // Fetch Rows
        const rows: Record<string, unknown>[] = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\`;`);
        if (rows && rows.length > 0) {
          totalExportedRows += rows.length;
          writeStream.write(`-- Dumping data for table \`${table}\`\n`);
          writeStream.write(`LOCK TABLES \`${table}\` WRITE;\n`);

          // Insert rows in batches of 50
          const batchSize = 50;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const valueStrings = batch.map((row) => {
              const cols = Object.values(row).map((val) => {
                if (val === null || val === undefined) return "NULL";
                if (typeof val === "number" || typeof val === "bigint") return val.toString();
                if (typeof val === "boolean") return val ? "1" : "0";
                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
                if (typeof val === "object") return `'${JSON.stringify(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
                // String escaping
                const escaped = String(val)
                  .replace(/\\/g, "\\\\")
                  .replace(/'/g, "\\'")
                  .replace(/\n/g, "\\n")
                  .replace(/\r/g, "\\r");
                return `'${escaped}'`;
              });
              return `(${cols.join(", ")})`;
            });

            writeStream.write(`INSERT INTO \`${table}\` VALUES ${valueStrings.join(",\n")};\n`);
          }
          writeStream.write(`UNLOCK TABLES;\n\n`);
        }
      }

      writeStream.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
      writeStream.write(`-- Backup completed successfully\n`);
      writeStream.end();

      // Wait for stream to finish writing
      await new Promise<void>((resolve) => {
        writeStream.on("finish", () => resolve());
      });

      const stats = fs.statSync(filePath);

      const completed = await prisma.databaseBackup.update({
        where: { id: backupRecord.id },
        data: {
          status: "COMPLETED",
          sizeBytes: BigInt(stats.size),
          tablesCount: tables.length,
          rowsCount: totalExportedRows,
          completedAt: new Date(),
        },
      });

      await AuditService.log({
        userId: adminId,
        action: "DATABASE_BACKUP_CREATED",
        resourceType: "DatabaseBackup",
        resourceId: completed.id,
        changesDiff: {
          filename,
          sizeBytes: stats.size,
          tablesCount: tables.length,
          rowsCount: totalExportedRows,
        },
      });

      return {
        id: completed.id,
        filename: completed.filename,
        sizeBytes: Number(completed.sizeBytes),
        tablesCount: completed.tablesCount,
        rowsCount: completed.rowsCount,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Database backup generation failed:", err);
      if (backupRecord) {
        await prisma.databaseBackup.update({
          where: { id: backupRecord.id },
          data: {
            status: "FAILED",
            errorMessage: errorMsg,
          },
        });
      }
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
      throw new Error(`Database backup failed: ${errorMsg}`);
    } finally {
      this.releaseLock();
    }
  }

  /**
   * List all database backups with metadata
   */
  public static async listBackups() {
    const backups = await prisma.databaseBackup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return backups.map((b) => ({
      id: b.id,
      filename: b.filename,
      sizeBytes: Number(b.sizeBytes),
      sizeFormatted: (Number(b.sizeBytes) / (1024 * 1024)).toFixed(2) + " MB",
      databaseName: b.databaseName,
      environment: b.environment,
      status: b.status,
      tablesCount: b.tablesCount,
      rowsCount: b.rowsCount,
      errorMessage: b.errorMessage,
      createdAt: b.createdAt,
      completedAt: b.completedAt,
      createdBy: b.createdBy,
    }));
  }

  /**
   * Resolve secure stream path for downloading a backup
   */
  public static async getBackupForDownload(backupId: string, adminId: string) {
    const backup = await prisma.databaseBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new NotFoundError("Database backup archive not found.");
    }

    if (backup.status !== "COMPLETED") {
      throw new BadRequestError("This backup archive is not in a completed state.");
    }

    const backupsDir = this.getBackupsDir();
    const resolvedPath = path.resolve(backup.storagePath);

    // Defense against Path Traversal
    if (!resolvedPath.startsWith(backupsDir) || !fs.existsSync(resolvedPath)) {
      throw new NotFoundError("Backup archive file is missing or path is invalid.");
    }

    await AuditService.log({
      userId: adminId,
      action: "DATABASE_BACKUP_DOWNLOADED",
      resourceType: "DatabaseBackup",
      resourceId: backup.id,
      changesDiff: { filename: backup.filename, sizeBytes: Number(backup.sizeBytes) },
    });

    return {
      filePath: resolvedPath,
      filename: backup.filename,
      sizeBytes: Number(backup.sizeBytes),
    };
  }

  /**
   * Delete a database backup
   */
  public static async deleteBackup(backupId: string, adminId: string) {
    const backup = await prisma.databaseBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new NotFoundError("Database backup not found.");
    }

    const backupsDir = this.getBackupsDir();
    const resolvedPath = path.resolve(backup.storagePath);

    // Remove file if within directory
    if (resolvedPath.startsWith(backupsDir) && fs.existsSync(resolvedPath)) {
      try {
        fs.unlinkSync(resolvedPath);
      } catch (err) {
        console.warn(`Could not delete backup file ${resolvedPath}:`, err);
      }
    }

    await prisma.databaseBackup.delete({ where: { id: backupId } });

    await AuditService.log({
      userId: adminId,
      action: "DATABASE_BACKUP_DELETED",
      resourceType: "DatabaseBackup",
      resourceId: backup.id,
      changesDiff: { filename: backup.filename },
    });

    return { success: true };
  }

  /**
   * Get preview of records to be affected before Clean Data
   */
  public static async getCleanPreview(mode: "TEST_DATA" | "ALL_DATA" = "TEST_DATA"): Promise<CleanDataPreview> {
    const isProduction = process.env.NODE_ENV === "production";
    const requiredConfirmationPhrase = isProduction ? "CONFIRM PRODUCTION DATA RESET" : "DELETE ALL TEST DATA";

    // Count records across domain tables
    const candidateRole = await prisma.role.findUnique({ where: { code: "CANDIDATE" } });
    const candidateRoleId = candidateRole?.id;

    const candidatesCount = candidateRoleId
      ? await prisma.userRole.count({ where: { roleId: candidateRoleId } })
      : 0;

    const candidateProfilesCount = await prisma.candidateProfile.count();
    const attemptsCount = await prisma.testAttempt.count();
    const resultsCount = await prisma.testResult.count();
    const practiceTestsCount = await prisma.practiceTest.count();
    const mockTestsCount = await prisma.mockTest.count();
    const questionsCount = await prisma.question.count();
    const documentsCount = await prisma.examDocument.count();
    const examsCount = await prisma.exam.count();

    const adminRole = await prisma.role.findFirst({ where: { code: { in: ["ADMIN", "SUPER_ADMIN"] } } });
    const adminsPreservedCount = adminRole
      ? await prisma.userRole.count({ where: { roleId: adminRole.id } })
      : 1;

    return {
      mode,
      candidatesCount,
      candidateProfilesCount,
      attemptsCount,
      resultsCount,
      practiceTestsCount,
      mockTestsCount,
      questionsCount,
      documentsCount,
      examsCount,
      adminsPreservedCount,
      isProduction,
      requiredConfirmationPhrase,
    };
  }

  /**
   * Execute controlled safe data cleaning
   */
  public static async cleanData(
    adminId: string,
    mode: "TEST_DATA" | "ALL_DATA" = "TEST_DATA",
    confirmationPhrase: string
  ) {
    const isProduction = process.env.NODE_ENV === "production";
    const requiredPhrase = isProduction ? "CONFIRM PRODUCTION DATA RESET" : "DELETE ALL TEST DATA";

    if (confirmationPhrase !== requiredPhrase) {
      throw new BadRequestError(`Invalid confirmation phrase. Required: "${requiredPhrase}".`);
    }

    this.acquireLock("CLEAN", adminId);

    try {
      await AuditService.log({
        userId: adminId,
        action: "DATA_CLEAN_STARTED",
        resourceType: "Database",
        resourceId: "system",
        changesDiff: { mode, isProduction },
      });

      // 1. Fetch candidate user IDs to safely remove candidate records without touching Admins
      const candidateRole = await prisma.role.findUnique({ where: { code: "CANDIDATE" } });
      const candidateMappings = candidateRole
        ? await prisma.userRole.findMany({
            where: { roleId: candidateRole.id },
            select: { userId: true },
          })
        : [];
      const candidateUserIds = candidateMappings.map((m) => m.userId);

      // Execute clean transaction
      await prisma.$transaction(async (tx) => {
        // Disable foreign key checks for atomic truncate/delete
        await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

        // A. Candidate lifecycle data (always cleaned in both modes)
        await tx.answerEvent.deleteMany({});
        await tx.attemptEvent.deleteMany({});
        await tx.testAnswer.deleteMany({});
        await tx.testResult.deleteMany({});
        await tx.testAttempt.deleteMany({});

        await tx.practiceResult.deleteMany({});
        await tx.practiceAnswer.deleteMany({});
        await tx.practiceAttempt.deleteMany({});
        await tx.practiceQuestionOption.deleteMany({});
        await tx.practiceTestQuestion.deleteMany({});
        await tx.practiceTest.deleteMany({});
        await tx.practiceResource.deleteMany({});

        await tx.candidateAddress.deleteMany({});
        await tx.candidateEducation.deleteMany({});
        await tx.candidateExperience.deleteMany({});
        await tx.candidateProfile.deleteMany({});
        await tx.candidateExamStatistic.deleteMany({});
        await tx.candidateTopicStatistic.deleteMany({});

        // Delete only candidate users (Admins are preserved!)
        if (candidateUserIds.length > 0) {
          await tx.userRole.deleteMany({ where: { userId: { in: candidateUserIds } } });
          await tx.emailVerification.deleteMany({ where: { userId: { in: candidateUserIds } } });
          await tx.passwordResetOTP.deleteMany({ where: { userId: { in: candidateUserIds } } });
          await tx.user.deleteMany({ where: { id: { in: candidateUserIds } } });
        }

        // B. If ALL_DATA mode is selected, remove exam catalog as well
        if (mode === "ALL_DATA") {
          await tx.mockTestQuestion.deleteMany({});
          await tx.mockTestSection.deleteMany({});
          await tx.mockTest.deleteMany({});

          await tx.questionOption.deleteMany({});
          await tx.questionReview.deleteMany({});
          await tx.question.deleteMany({});

          await tx.blueprintRule.deleteMany({});
          await tx.blueprintSection.deleteMany({});
          await tx.examBlueprint.deleteMany({});

          await tx.syllabusTopic.deleteMany({});
          await tx.syllabusSection.deleteMany({});
          await tx.syllabus.deleteMany({});

          await tx.examDocument.deleteMany({});
          await tx.examVersion.deleteMany({});
          await tx.exam.deleteMany({});
          await tx.examCategory.deleteMany({});
        }

        await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
      });

      // Clean candidate local documents in storage
      const candidateDocsDir = path.resolve(process.env.STORAGE_BASE_PATH || "./storage", "private", "candidate-documents");
      if (fs.existsSync(candidateDocsDir)) {
        try {
          const files = fs.readdirSync(candidateDocsDir);
          for (const f of files) {
            fs.unlinkSync(path.join(candidateDocsDir, f));
          }
        } catch (err) {
          console.warn("Could not clean candidate documents directory:", err);
        }
      }

      await AuditService.log({
        userId: adminId,
        action: "DATA_CLEAN_COMPLETED",
        resourceType: "Database",
        resourceId: "system",
        changesDiff: { mode, candidatesRemoved: candidateUserIds.length },
      });

      return {
        success: true,
        mode,
        candidatesRemoved: candidateUserIds.length,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Clean data operation failed:", err);
      await AuditService.log({
        userId: adminId,
        action: "DATA_CLEAN_FAILED",
        resourceType: "Database",
        resourceId: "system",
        changesDiff: { mode, error: errorMsg },
      });
      throw new Error(`Data cleaning failed: ${errorMsg}`);
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Get preview of seed data to be populated
   */
  public static async getSeedPreview() {
    return {
      superAdminCount: 1,
      candidateCount: 0,
      examCategoriesCount: 2,
      examsCount: 1,
      examVersionsCount: 1,
      blueprintsCount: 1,
      syllabiCount: 1,
      mockTestsCount: 4,
      questionsCount: 10,
    };
  }

  /**
   * Execute authoritative fresh data seed
   */
  public static async seedFreshData(adminId: string) {
    this.acquireLock("SEED", adminId);

    try {
      await AuditService.log({
        userId: adminId,
        action: "FRESH_DATA_SEED_STARTED",
        resourceType: "Database",
        resourceId: "system",
      });

      // Execute authoritative seed script via tsx CLI wrapper
      console.log("🌱 [DatabaseManagement] Running authoritative fresh seed...");
      execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });

      await AuditService.log({
        userId: adminId,
        action: "FRESH_DATA_SEED_COMPLETED",
        resourceType: "Database",
        resourceId: "system",
      });

      return {
        success: true,
        message: "Authoritative fresh seed data populated successfully.",
        candidateCount: 0,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Seed fresh data failed:", err);
      await AuditService.log({
        userId: adminId,
        action: "FRESH_DATA_SEED_FAILED",
        resourceType: "Database",
        resourceId: "system",
        changesDiff: { error: errorMsg },
      });
      throw new Error(`Fresh data seeding failed: ${errorMsg}`);
    } finally {
      this.releaseLock();
    }
  }
}
