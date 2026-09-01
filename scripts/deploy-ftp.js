const ftp = require("basic-ftp");
const path = require("path");

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  const host = process.env.CPANEL_FTP_SERVER || process.env.CPANEL_HOST || "103.224.246.193";
  const user = process.env.CPANEL_FTP_USERNAME || process.env.CPANEL_USERNAME || "rupakgup";
  const password = process.env.CPANEL_FTP_PASSWORD || process.env.CPANEL_PASSWORD;
  const port = parseInt(process.env.CPANEL_FTP_PORT || "21", 10);
  const targetDir = process.env.CPANEL_FTP_APP_DIR || "./";

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
    console.log(`Current remote directory: ${await client.pwd()}`);

    if (targetDir && targetDir !== "./" && targetDir !== "/") {
      await client.cd(targetDir);
      console.log(`Changed remote directory to: ${await client.pwd()}`);
    }

    const localDir = path.resolve("deploy-dist");
    console.log(`Uploading all files and folders (including .next) from: ${localDir}...`);

    await client.uploadFromDir(localDir);

    console.log("All files and directories (including .next) uploaded successfully!");
  } catch (err) {
    console.error("FTPS Deployment Error:", err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
