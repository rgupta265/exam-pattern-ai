import "../src/lib/database/config";
import { execSync } from "child_process";

const args = process.argv.slice(2).join(" ");
const command = `npx prisma ${args}`;

console.log(`⚡ Executing Prisma CLI with separate DB_* environment variables...`);
console.log(`   Command: ${command}\n`);

try {
  execSync(command, { stdio: "inherit", env: process.env });
} catch (error: any) {
  process.exit(error.status || 1);
}
