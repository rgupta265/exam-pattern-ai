import "../src/lib/database/config";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function refreshDatabase() {
  console.log("🔄 Starting full database clean & refresh...");

  try {
    // 1. Disable foreign key checks
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0;");

    // 2. Fetch all table names in current MySQL database
    const tables: { TABLE_NAME: string }[] = await prisma.$queryRawUnsafe(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE();
    `);

    console.log(`  Clearing ${tables.length} tables...`);
    for (const { TABLE_NAME } of tables) {
      if (TABLE_NAME !== "_prisma_migrations") {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\`;`);
      }
    }

    // 3. Re-enable foreign key checks
    await prisma.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("✨ All tables truncated cleanly!");

    // 4. Run prisma seed
    console.log("🌱 Populating fresh authoritative seed data...");
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

    console.log("🎉 Database refresh completed successfully!");
  } catch (error) {
    console.error("❌ Failed to refresh database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

refreshDatabase();
