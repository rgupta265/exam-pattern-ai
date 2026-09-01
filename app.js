// ==========================================
// ExamPattern AI — Passenger Startup Wrapper
// ==========================================
// This file serves as the entry point for Phusion Passenger / LiteSpeed in cPanel.
// It initializes and boots the Next.js production server with resource limits.
/* eslint-disable @typescript-eslint/no-require-imports */

// Limit threadpool size to prevent hitting CloudLinux NPROC / pthread limits
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || "2";
process.env.PRISMA_CLIENT_ENGINE_TYPE = process.env.PRISMA_CLIENT_ENGINE_TYPE || "library";

const fs = require("fs");
const path = require("path");

// 1. Manually parse .env without external dependencies
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  try {
    const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (e) {
    console.error("Error reading .env:", e);
  }
}

// 2. Set production environment
process.env.NODE_ENV = "production";

// 2.5. Self-extract a pending deployment package, if one was just uploaded.
// The FTPS deploy step no longer mirrors ~2,700 individual build files one
// by one (that took 15+ minutes and was the bottleneck before the health
// check could even run) — it uploads ONE compressed archive plus this
// file, then touches tmp/restart.txt. On restart, Passenger boots this
// (already-current) app.js, which extracts the archive here before doing
// anything else.
const pendingPackage = path.join(__dirname, ".deploy-incoming.tar.gz");
if (fs.existsSync(pendingPackage)) {
  const { execFileSync } = require("child_process");
  console.log("Found pending deployment package: " + pendingPackage + " — extracting...");
  try {
    execFileSync("tar", ["-xzf", pendingPackage, "-C", __dirname], { stdio: "inherit" });
    console.log("Deployment package extracted successfully.");
  } catch (err) {
    console.error(
      "Critical Error: failed to extract deployment package " + pendingPackage + ": " +
      (err && err.message ? err.message : err)
    );
    // Leave the package in place so it can be inspected/retried, and don't
    // boot on a possibly half-extracted build.
    process.exit(1);
  }
  try {
    fs.unlinkSync(pendingPackage);
  } catch {
    // Harmless if another concurrent Passenger worker already removed it
    // after also extracting it — extraction above already succeeded.
  }
}

// 3. Always boot the standalone server produced by the CI pipeline at
//    .next/standalone/server.js. A legacy fallback to a root-level
//    server.js used to live here; it was removed because a stray file
//    left over from an old deployment approach could silently shadow
//    every future deploy (the root file never gets updated once CI only
//    ever produces .next/standalone/server.js), which caused Passenger
//    to keep booting a broken/outdated build indefinitely.
const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");
const standaloneBuildId = path.join(__dirname, ".next", "standalone", ".next", "BUILD_ID");

if (!fs.existsSync(standaloneBuildId)) {
  console.error(
    "Critical Error: No production build found at " + standaloneBuildId + "\n" +
    "The deployment artifact is missing or incomplete (.next/standalone/.next/BUILD_ID not found).\n" +
    "Re-run the GitHub Actions deployment workflow — check the 'Deploy to cPanel' job log for details."
  );
  process.exit(1);
}

if (fs.existsSync(standaloneServer)) {
  require(standaloneServer);
} else {
  console.error("Critical Error: server.js not found at " + standaloneServer);
  process.exit(1);
}
