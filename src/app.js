const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { requestId } = require('./middleware/requestId');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { prisma } = require("./lib/prisma");
const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./modules/auth/auth.routes");

const countryRoutes = require("./modules/countries/country.routes");
const brandRoutes = require("./modules/brands/brand.routes");
const branchRoutes = require("./modules/branches/branch.routes");
const subscriptionRoutes = require("./modules/subscriptions/subscription.routes");
const userRoutes = require("./modules/users/user.routes");
const inviteRoutes = require("./modules/invite/invite.routes");

const floorRoutes = require("./modules/floor/floor.routes");
const registersRoutes = require("./modules/registers/register.routes");
const taxesRoutes = require("./modules/tax/tax.routes");
const serviceChargeRoutes = require("./modules/service-charge/service.routes");
const tipsRoutes = require("./modules/tips/tip.routes");
const tipSettlementRoutes = require("./modules/tip-settlement/tip-settlement.routes");

const orderRoutes = require("./modules/orders/order.routes");

const menuRoutes = require("./modules/menu/menu.routes");
const recipeRoutes = require("./modules/recipes/recipe.routes");
const supplierRoutes = require("./modules/inventory/suppliers.routes");
const productRoutes = require("./modules/inventory/products.routes");
const stockRoutes = require("./modules/inventory/stock.routes");
const poRoutes = require("./modules/inventory/po.routes");
const adjustmentsRoutes = require("./modules/inventory/adjustment.routes");
const transfersRoutes = require("./modules/inventory/transfer.routes");

const app = express();

// Core Middlewares
app.use(requestId);
app.use(generalLimiter);
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/invite", inviteRoutes);

app.use("/api/floor", floorRoutes);
app.use("/api/registers", registersRoutes);
app.use("/api/taxes", taxesRoutes);
app.use("/api/service-charge", serviceChargeRoutes);
app.use("/api/tips", tipsRoutes);
app.use("/api/tip-settlement", tipSettlementRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/menu", menuRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/inventory", supplierRoutes);
app.use("/api/inventory", productRoutes);
app.use("/api/inventory", stockRoutes);
app.use("/api/inventory", poRoutes);
app.use("/api/inventory", adjustmentsRoutes);
app.use("/api/inventory", transfersRoutes);

// Healthcheck
app.get("/api/health", async (req, res) => {
  const checks = { uptime: process.uptime(), db: false, redis: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch (_) {}
  try {
    await redis.ping();
    checks.redis = true;
  } catch (_) {}
  const ok = checks.db && checks.redis;
  res
    .status(ok ? 200 : 503)
    .json({ status: ok ? "ok" : "degraded", ...checks });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
