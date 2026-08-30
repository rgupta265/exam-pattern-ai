import { DatabaseManagementService } from "../src/services/database/database-management.service";
import { prisma } from "../src/lib/prisma";
import fs from "fs";

async function main() {
  console.log("🚀 Testing Phase 18 Database Management Service...");

  // 1. Find or create admin user for test context
  let admin = await prisma.user.findFirst({
    where: { userRoles: { some: { role: { code: { in: ["ADMIN", "SUPER_ADMIN"] } } } } },
  });

  if (!admin) {
    admin = await prisma.user.findFirst();
  }

  const adminId = admin?.id || "00000000-0000-0000-0000-000000000001";
  console.log(`👤 Using Admin ID: ${adminId}`);

  // 2. Status
  console.log("📊 Testing getStatus()...");
  const status = await DatabaseManagementService.getStatus();
  console.log("Status Result:", status);

  const rawShow: any = await prisma.$queryRawUnsafe("SHOW CREATE TABLE `users`;");
  console.log("SHOW CREATE TABLE `users` raw output:", rawShow);
  if (status.status !== "connected") {
    throw new Error("Database status is not connected!");
  }
  if (!status.database) {
    throw new Error("Database name missing in status!");
  }

  // 3. Create Backup
  console.log("💾 Testing createBackup()...");
  const backup = await DatabaseManagementService.createBackup(adminId);
  console.log("Backup Created:", backup);

  if (!backup.filename || backup.tablesCount === 0) {
    throw new Error("Backup creation returned invalid metadata!");
  }

  // 4. List Backups
  console.log("📋 Testing listBackups()...");
  const backups = await DatabaseManagementService.listBackups();
  console.log(`Found ${backups.length} backups in history.`);
  const found = backups.find((b) => b.id === backup.id);
  if (!found) {
    throw new Error("Created backup not found in listBackups()!");
  }

  // 5. Download Resolution & SQL Integrity
  console.log("⬇️ Testing getBackupForDownload()...");
  const download = await DatabaseManagementService.getBackupForDownload(backup.id, adminId);
  console.log("Download metadata:", download);

  if (!fs.existsSync(download.filePath)) {
    throw new Error("Backup file does not exist on disk!");
  }

  const fileContent = fs.readFileSync(download.filePath, "utf8");
  console.log("File sample (first 400 chars):", fileContent.slice(0, 400));
  if (!fileContent.includes("SET FOREIGN_KEY_CHECKS = 0;") || !fileContent.includes("DROP TABLE IF EXISTS")) {
    console.log("Has SET FOREIGN_KEY_CHECKS:", fileContent.includes("SET FOREIGN_KEY_CHECKS = 0;"));
    console.log("Has DROP TABLE IF EXISTS:", fileContent.includes("DROP TABLE IF EXISTS"));
    throw new Error("Backup file does not contain valid standard MySQL SQL dump statements!");
  }
  console.log("✅ Backup file verified: valid MySQL 8 dump structure confirmed.");

  // 6. Clean Preview
  console.log("🔍 Testing getCleanPreview()...");
  const cleanPreview = await DatabaseManagementService.getCleanPreview("TEST_DATA");
  console.log("Clean Preview:", cleanPreview);
  if (cleanPreview.adminsPreservedCount < 1) {
    throw new Error("Admins preserved count must be at least 1!");
  }

  // 7. Seed Preview
  console.log("🌱 Testing getSeedPreview()...");
  const seedPreview = await DatabaseManagementService.getSeedPreview();
  console.log("Seed Preview:", seedPreview);
  if (seedPreview.candidateCount !== 0) {
    throw new Error("Candidate seed count must be strictly 0!");
  }

  // 8. Delete Backup Test
  console.log("🗑️ Testing deleteBackup()...");
  await DatabaseManagementService.deleteBackup(backup.id, adminId);
  const afterDelete = await DatabaseManagementService.listBackups();
  if (afterDelete.some((b) => b.id === backup.id)) {
    throw new Error("Backup still exists in database after delete!");
  }
  if (fs.existsSync(download.filePath)) {
    throw new Error("Backup file still exists on disk after delete!");
  }
  console.log("✅ Backup deletion and file cleanup verified.");

  console.log("\n🎉 ALL PHASE 18 DATABASE SERVICE TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
