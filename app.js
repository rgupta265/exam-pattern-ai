// ==========================================
// ExamPattern AI — Passenger Startup Wrapper
// ==========================================
// This file serves as the entry point for Phusion Passenger in cPanel.
// It initializes and boots the Next.js production server.
/* eslint-disable @typescript-eslint/no-require-imports */

const next = require("next");
const http = require("http");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "127.0.0.1";

const app = next({
  dev: false,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (error) {
        console.error("Next.js request error:", error);

        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      }
    });

    server.listen(port, hostname, () => {
      console.log(`> ExamPattern AI Next.js running on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start ExamPattern AI server:", err);
    process.exit(1);
  });
