const ftp = require("basic-ftp");
const path = require("path");

async function deploy() {
  const client = new ftp.Client();
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
