const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

// Paths that were produced by earlier/abandoned deployment approaches and can
// still be sitting in the app root from before this pipeline existed. They
// are never touched by the current artifact, so once created they linger
// forever. Some of them (a root-level server.js, in particular) can silently
// shadow every future deployment. Wipe them before every deploy so stale
// state can never come back from the dead.
const LEGACY_REMOTE_PATHS = [
  { path: "server.js", type: "file" },
  { path: ".next.old", type: "dir" },
  { path: "deploy-temp", type: "dir" },
  { path: "exampattern-standalone-artifact.zip", type: "file" },
  { path: ".git", type: "dir" },
  { path: ".ftp-deploy-sync-state.json", type: "file" },
];

// Files that must exist on the remote server (with a sane minimum size) once
// the upload finishes, or the deployment is not actually usable even though
// the FTP transfer itself reported no errors.
const REQUIRED_REMOTE_FILES = [
  { path: ".next/standalone/server.js", minBytes: 100 },
  { path: ".next/standalone/.next/BUILD_ID", minBytes: 1 },
  { path: ".next/standalone/.next/routes-manifest.json", minBytes: 100 },
  { path: "app.js", minBytes: 100 },
];

async function removeLegacyPaths(client) {
  console.log("Cleaning up legacy artifacts from earlier deployment approaches...");
  for (const entry of LEGACY_REMOTE_PATHS) {
    try {
      if (entry.type === "dir") {
        await client.removeDir(entry.path);
      } else {
        await client.remove(entry.path, true);
      }
      console.log(`  Removed stale ${entry.type}: ${entry.path}`);
    } catch {
      // Not present — nothing to clean up, which is the common case.
    }
  }
}

async function verifyRemoteDeployment(client) {
  console.log("Verifying uploaded build on the remote server...");
  const missing = [];
  for (const file of REQUIRED_REMOTE_FILES) {
    try {
      const size = await client.size(file.path);
      if (size < file.minBytes) {
        missing.push(`${file.path} (found ${size} bytes, expected at least ${file.minBytes})`);
      } else {
        console.log(`  OK: ${file.path} (${size} bytes)`);
      }
    } catch (err) {
      missing.push(`${file.path} (${err.message || "not found"})`);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      "Deployment verification FAILED — the following required files are missing or too small on the remote server:\n" +
        missing.map((m) => `  - ${m}`).join("\n")
    );
  }
  console.log("Deployment verification: PASS — all required build files are present on the server.");
}

async function connect() {
  const client = new ftp.Client(30_000); // 30s idle timeout, generous for a ~2,700 file tree
  client.ftp.verbose = true;

  const host = process.env.CPANEL_FTP_SERVER || process.env.CPANEL_HOST || "103.224.246.193";
  const user = process.env.CPANEL_FTP_USERNAME || process.env.CPANEL_USERNAME || "rupakgup";
  const password = process.env.CPANEL_FTP_PASSWORD || process.env.CPANEL_PASSWORD;
  const port = parseInt(process.env.CPANEL_FTP_PORT || "21", 10);

  console.log(`Connecting via Secure FTPS to ${host}:${port} as ${user}...`);
  await client.access({
    host,
    user,
    password,
    port,
    secure: "explicit",
    secureOptions: {
      rejectUnauthorized: false,
    },
  });
  console.log("FTPS Connection Established!");

  const initialDir = await client.pwd();
  console.log(`Initial remote directory: ${initialDir}`);

  // Auto-detect if we are in /home/user or already in subdomain root
  const remoteList = await client.list();
  const hasSubdomainFolder = remoteList.some(
    (item) => item.name === "aiexam.rupakgupta.com" && (item.isDirectory || item.type === 2)
  );

  if (hasSubdomainFolder) {
    console.log("Detected subdomain folder 'aiexam.rupakgupta.com'. Entering target directory...");
    await client.cd("aiexam.rupakgupta.com");
    console.log(`Target remote directory is now: ${await client.pwd()}`);
  } else {
    console.log(`Currently already in application target directory: ${await client.pwd()}`);
  }

  return client;
}

async function deploy() {
  const localDir = path.resolve("deploy-dist");
  if (!fs.existsSync(path.join(localDir, ".next", "standalone", "server.js"))) {
    console.error(
      `FATAL: ${localDir} does not contain .next/standalone/server.js — the build artifact is incomplete. Aborting before touching the remote server.`
    );
    process.exit(1);
  }

  const MAX_ATTEMPTS = 3;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const client = await connect();
    try {
      await removeLegacyPaths(client);

      console.log(`Uploading all files and folders (including .next) from: ${localDir}...`);
      await client.uploadFromDir(localDir);
      console.log("Upload transfer completed without a transport error.");

      await verifyRemoteDeployment(client);

      console.log("==================================================");
      console.log("All files and folders successfully deployed to cPanel!");
      console.log("Remote location:", await client.pwd());
      console.log("==================================================");
      client.close();
      return;
    } catch (err) {
      lastError = err;
      console.error(`Deployment attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message || err);
      client.close();
      if (attempt < MAX_ATTEMPTS) {
        const backoffMs = 5000 * attempt;
        console.log(`Retrying in ${backoffMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  console.error("FTPS Deployment Error: all attempts failed.");
  console.error(lastError);
  process.exit(1);
}

deploy();
