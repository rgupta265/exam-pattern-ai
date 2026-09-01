const ftp = require("basic-ftp");
const path = require("path");
const fs = require("fs");

// Remote name the deployment package is uploaded under. app.js looks for
// exactly this file on startup and self-extracts it — see app.js.
const REMOTE_PACKAGE_NAME = ".deploy-incoming.tar.gz";

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

async function connect() {
  const client = new ftp.Client(60_000);
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

async function deployOnce(localPackagePath, appJsPath) {
  const localSize = fs.statSync(localPackagePath).size;
  const client = await connect();
  try {
    await removeLegacyPaths(client);

    // Upload app.js directly (a few KB) so the self-extraction logic below
    // is always current, even on the very first run of this new pipeline
    // before any tarball has ever been extracted.
    console.log("Uploading app.js (Passenger startup wrapper)...");
    await client.uploadFrom(appJsPath, "app.js");

    // Upload the ENTIRE build as a single compressed archive instead of
    // mirroring ~2,700 individual files over FTP one by one — that was
    // taking 15+ minutes and was the bottleneck before the health check
    // could even run. A single file transfer takes seconds.
    console.log(`Uploading deployment package (${(localSize / 1024 / 1024).toFixed(1)} MB) as ${REMOTE_PACKAGE_NAME}...`);
    await client.uploadFrom(localPackagePath, REMOTE_PACKAGE_NAME);

    const remoteSize = await client.size(REMOTE_PACKAGE_NAME);
    if (remoteSize !== localSize) {
      throw new Error(
        `Uploaded package size mismatch: local ${localSize} bytes vs remote ${remoteSize} bytes — transfer likely truncated.`
      );
    }
    console.log(`Verified package on server: ${remoteSize} bytes (matches local).`);

    // Touch the Passenger restart signal LAST. app.js extracts the package
    // on its next boot, so the restart must happen only after the package
    // has been fully verified on the server.
    console.log("Writing Passenger restart signal (tmp/restart.txt)...");
    const restartContents = Buffer.from(`Deployment: ${new Date().toISOString()}\n`);
    const remoteCwd = await client.pwd();
    await client.ensureDir("tmp"); // creates tmp/ if needed and cd's into it
    const tmpStream = require("stream").Readable.from(restartContents);
    await client.uploadFrom(tmpStream, "restart.txt");
    await client.cd(remoteCwd);

    console.log("==================================================");
    console.log("Package and restart signal deployed to cPanel!");
    console.log("Passenger will extract the package and reload on its next request.");
    console.log("==================================================");
  } finally {
    client.close();
  }
}

async function deploy() {
  const packagePath = path.resolve(process.env.DEPLOY_PACKAGE_PATH || "deploy-package.tar.gz");
  const appJsPath = path.resolve("app.js");

  if (!fs.existsSync(packagePath)) {
    console.error(`FATAL: deployment package not found at ${packagePath}. Aborting before touching the remote server.`);
    process.exit(1);
  }
  if (!fs.existsSync(appJsPath)) {
    console.error(`FATAL: app.js not found at ${appJsPath}. Aborting before touching the remote server.`);
    process.exit(1);
  }

  const MAX_ATTEMPTS = 3;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await deployOnce(packagePath, appJsPath);
      return;
    } catch (err) {
      lastError = err;
      console.error(`Deployment attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message || err);
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
