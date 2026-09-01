// Diagnostic helper: connects to the same cPanel FTPS account used for
// deployment and prints the tail of the Passenger app logs. Used as a
// post-mortem step in CI when the health check fails, so the actual
// server-side error is visible in the Actions log instead of having to
// guess blind.
const ftp = require("basic-ftp");
const { Writable } = require("stream");

const LOG_FILES = ["stderr.log", "stdout.log"];
const TAIL_BYTES = 8000;

async function fetchTail(client, remotePath) {
  const size = await client.size(remotePath);
  const chunks = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(chunk);
      cb();
    },
  });
  const startAt = Math.max(0, size - TAIL_BYTES);
  await client.downloadTo(sink, remotePath, startAt);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const client = new ftp.Client(30_000);
  client.ftp.verbose = false;

  const host = process.env.CPANEL_FTP_SERVER || process.env.CPANEL_HOST || "103.224.246.193";
  const user = process.env.CPANEL_FTP_USERNAME || process.env.CPANEL_USERNAME || "rupakgup";
  const password = process.env.CPANEL_FTP_PASSWORD || process.env.CPANEL_PASSWORD;
  const port = parseInt(process.env.CPANEL_FTP_PORT || "21", 10);

  try {
    await client.access({
      host,
      user,
      password,
      port,
      secure: "explicit",
      secureOptions: { rejectUnauthorized: false },
    });

    const remoteList = await client.list();
    const hasSubdomainFolder = remoteList.some(
      (item) => item.name === "aiexam.rupakgupta.com" && (item.isDirectory || item.type === 2)
    );
    if (hasSubdomainFolder) {
      await client.cd("aiexam.rupakgupta.com");
    }

    for (const logFile of LOG_FILES) {
      console.log(`\n===== Last ${TAIL_BYTES} bytes of ${logFile} =====`);
      try {
        const tail = await fetchTail(client, logFile);
        console.log(tail || "(empty)");
      } catch (err) {
        console.log(`(could not read ${logFile}: ${err.message || err})`);
      }
    }

    console.log("\n===== Remote app root listing =====");
    for (const item of await client.list()) {
      console.log(`${item.isDirectory ? "DIR " : "FILE"}  ${item.size ?? ""}\t${item.name}`);
    }
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error("fetch-remote-log.js failed:", err.message || err);
  process.exit(0); // diagnostic only — never fail the job because of this script
});
