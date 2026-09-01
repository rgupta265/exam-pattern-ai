// ==========================================
// ExamPattern AI — Passenger Startup Wrapper
// ==========================================
// This file serves as the entry point for Phusion Passenger in cPanel.
// It initializes and boots the Next.js production server.
/* eslint-disable @typescript-eslint/no-require-imports */

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

// 3. Locate standalone server
const standaloneServerPath = path.join(__dirname, ".next", "standalone", "server.js");

if (fs.existsSync(standaloneServerPath)) {
  // Delegate directly to Next.js standalone production server
  require(standaloneServerPath);
} else {
  console.error("Critical Error: .next/standalone/server.js not found at " + standaloneServerPath);
  process.exit(1);
}
