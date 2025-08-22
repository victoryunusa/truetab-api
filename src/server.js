const { validateEnvironment } = require("./config/env");

// Validate environment variables before starting
validateEnvironment();

const app = require("./app");
const { prisma } = require("./lib/prisma");

const PORT = process.env.PORT || 9000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
