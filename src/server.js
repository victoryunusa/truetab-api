const { validateEnvironment } = require('./config/env');

// Validate environment variables before starting
validateEnvironment();

const https = require('https');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const { prisma } = require('./lib/prisma');

const PORT = process.env.PORT || 9000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Render-specific optimizations
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true'; // Render sets this automatically

// Load SSL certificates if HTTPS is enabled
let httpsOptions;
if (USE_HTTPS) {
  try {
    httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, '../key.pem')),
      cert: fs.readFileSync(path.join(__dirname, '../cert.pem')),
    };
  } catch (err) {
    console.error('❌ Failed to load SSL certificates:', err.message);
    process.exit(1);
  }
}

// Optimized database connection with timeout
async function connectDatabase() {
  const timeout = setTimeout(() => {
    console.error('❌ Database connection timeout');
    process.exit(1);
  }, 15000); // 15 second timeout

  try {
    await prisma.$connect();
    clearTimeout(timeout);
    console.log('✅ Database connected successfully');

    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database query test passed');
  } catch (err) {
    clearTimeout(timeout);
    console.error('❌ Database connection failed:', err);
    throw err;
  }
}

// Fast health check for Render's initial probe
app.get('/health/quick', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ready',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    console.log('🚀 Starting server initialization...');

    // Connect to database with timeout
    await connectDatabase();

    const server = USE_HTTPS
      ? https.createServer(httpsOptions, app).listen(PORT, () => {
          console.log(`🚀 Server running on https://0.0.0.0:${PORT}`);
        })
      : app.listen(PORT, () => {
          console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
        });

    // Render-optimized server timeouts
    server.keepAliveTimeout = 120000; // 2 minutes
    server.headersTimeout = 120000; // 2 minutes

    // Server event handlers
    server.on('error', err => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });

    server.on('close', async () => {
      console.log('🔄 Server closing...');
      await prisma.$disconnect();
    });

    console.log('✅ Server started successfully');
    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
