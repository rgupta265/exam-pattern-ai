const ftp = require("basic-ftp");
const path = require("path");

async function deploy() {
  const client = new ftp.Client(60_000); // 60s idle timeout
  client.ftp.verbose = true;

  const host = process.env.CPANEL_FTP_SERVER || process.env.CPANEL_HOST || "103.224.246.193";
  const user = process.env.CPANEL_FTP_USERNAME || process.env.CPANEL_USERNAME || "rupakgup";
  const password = process.env.CPANEL_FTP_PASSWORD || process.env.CPANEL_PASSWORD;
  const port = parseInt(process.env.CPANEL_FTP_PORT || "21", 10);

  console.log(`Connecting via Secure FTPS to ${host}:${port} as ${user}...`);

  try {
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

    const remoteList = await client.list();

    // 1. Clean up accidental nested 'aiexam.rupakgupta.com' folder if created by previous runs
    const nestedFolder = remoteList.find(
      (item) => item.name === "aiexam.rupakgupta.com" && (item.isDirectory || item.type === 2)
    );
    if (nestedFolder) {
      console.log("Detected accidental nested 'aiexam.rupakgupta.com' folder. Removing...");
      try {
        await client.removeDir("aiexam.rupakgupta.com");
        console.log("Successfully removed accidental nested folder.");
      } catch (err) {
        console.warn("Could not remove nested folder automatically:", err.message);
      }
    }

    // 2. Remove stale legacy root server.js so it never shadows .next/standalone/server.js
    const rootServer = remoteList.find(
      (item) => item.name === "server.js" && !item.isDirectory && item.type !== 2
    );
    if (rootServer) {
      console.log("Removing stale legacy root server.js...");
      try {
        await client.remove("server.js");
        console.log("Removed stale root server.js.");
      } catch (err) {
        console.warn("Could not remove root server.js:", err.message);
      }
    }

    // 3. Fast streaming upload of entire build directly to application root
    const localDir = path.resolve("deploy-dist");
    console.log(`Uploading all files and folders (including .next) from: ${localDir}...`);

    await client.uploadFromDir(localDir);

    console.log("==================================================");
    console.log("All files and folders successfully deployed to cPanel!");
    console.log("Remote location:", await client.pwd());
    console.log("==================================================");
  } catch (err) {
    console.error("FTPS Deployment Error:", err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
