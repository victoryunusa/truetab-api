const { validateEnvironment } = require("./config/env");

// Validate environment variables before starting
validateEnvironment();

const https = require("https");
const fs = require("fs");
const path = require("path");
const app = require("./app");
const { prisma } = require("./lib/prisma");

const PORT = process.env.PORT || 9000;
const USE_HTTPS = process.env.USE_HTTPS === "true";

// Load SSL certificates if HTTPS is enabled
let httpsOptions;
if (USE_HTTPS) {
  try {
    httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, "../key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "../cert.pem")),
    };
  } catch (err) {
    console.error("❌ Failed to load SSL certificates:", err.message);
    process.exit(1);
  }
}

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    if (USE_HTTPS) {
      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`🚀 Server running on https://localhost:${PORT}`);
      });
    } else {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
