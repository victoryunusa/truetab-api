const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const { requestId } = require('./middleware/requestId');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { prisma } = require('./lib/prisma');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./modules/auth/auth.routes');

const countryRoutes = require('./modules/countries/country.routes');
const brandRoutes = require('./modules/brands/brand.routes');
const branchRoutes = require('./modules/branches/branch.routes');
const subscriptionRoutes = require('./modules/subscriptions/subscription.routes');
const userRoutes = require('./modules/users/user.routes');
const inviteRoutes = require('./modules/invite/invite.routes');
const customerRoutes = require('./modules/customers/customer.routes');

const floorRoutes = require('./modules/floor/floor.routes');
const registersRoutes = require('./modules/registers/register.routes');
const taxesRoutes = require('./modules/tax/tax.routes');
const serviceChargeRoutes = require('./modules/service-charge/service.routes');
const tipsRoutes = require('./modules/tips/tip.routes');
const tipSettlementRoutes = require('./modules/tip-settlement/tip-settlement.routes');

const orderRoutes = require('./modules/orders/order.routes');

const menuRoutes = require('./modules/menu/menu.routes');
const recipeRoutes = require('./modules/recipes/recipe.routes');
const supplierRoutes = require('./modules/inventory/suppliers.routes');
const productRoutes = require('./modules/inventory/products.routes');
const stockRoutes = require('./modules/inventory/stock.routes');
const poRoutes = require('./modules/inventory/po.routes');
const adjustmentsRoutes = require('./modules/inventory/adjustment.routes');
const transfersRoutes = require('./modules/inventory/transfer.routes');
const promotionRoutes = require('./modules/promotions/promotion.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const shiftsRoutes = require('./modules/shifts/shifts.routes');
const payrollRoutes = require('./modules/payroll/payroll.routes');
const loyaltyRoutes = require('./modules/loyalty/loyalty.routes');
const reservationRoutes = require('./modules/reservations/reservation.routes');
const marketingRoutes = require('./modules/marketing/marketing.routes');
const giftCardsRoutes = require('./modules/gift-cards/gift-cards.routes');
const reviewsRoutes = require('./modules/reviews/reviews.routes');
const kdsRoutes = require('./modules/kds/kds.routes');
const deliveryRoutes = require('./modules/delivery/delivery.routes');
const deliveryWebhookRoutes = require('./modules/delivery/webhook.routes');
const settingsRoutes = require('./modules/settings/settings.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

//Admin routes
const demoRoutes = require('./modules/admin/demo-requests/demo.routes');

const app = express();

// Trust proxy - Required for rate limiting behind proxies (Render, etc.)
app.set('trust proxy', 1);

// Core Middlewares
app.use(requestId);
app.use(generalLimiter);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (!origin || allowed.includes(origin) || allowed.includes('*')) {
        return callback(null, true);
      }
      console.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Brand-ID',
      'X-Branch-ID',
      'X-Requested-With',
    ],
  })
);

// Security headers optimized for APIs
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false, // Disable for API
  })
);

// Webhook routes MUST come before body parsers to get raw body
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }), subscriptionRoutes);
app.use('/api/delivery/webhook', express.raw({ type: 'application/json' }), deliveryWebhookRoutes);

// Now apply body parsers for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('dev'));

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  })
);

app.use((req, res, next) => {
  // Set timeout for all requests (30 seconds)
  req.setTimeout(30000, () => {
    console.warn(`Request timeout for ${req.method} ${req.url}`);
  });
  next();
});

// Routes
app.use('/api/admin/demo-requests', demoRoutes);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/branches', branchRoutes);
// Webhook routes already mounted above, mount rest of subscription routes
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/customers', customerRoutes);

app.use('/api/floor', floorRoutes);
app.use('/api/registers', registersRoutes);
app.use('/api/taxes', taxesRoutes);
app.use('/api/service-charge', serviceChargeRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/tip-settlement', tipSettlementRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/menu', menuRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/inventory', supplierRoutes);
app.use('/api/inventory', productRoutes);
app.use('/api/inventory', stockRoutes);
app.use('/api/inventory', poRoutes);
app.use('/api/inventory', adjustmentsRoutes);
app.use('/api/inventory', transfersRoutes);

app.use('/api/promotions', promotionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/gift-cards', giftCardsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/online-menu', require('./modules/online-ordering/menu.routes'));
app.use('/api/cart', require('./modules/online-ordering/cart.routes'));
app.use('/api/checkout', require('./modules/online-ordering/checkout.routes'));
app.use('/api/wallet', require('./modules/wallet/wallet.routes'));
app.use('/api/wallet/bank-accounts', require('./modules/wallet/bank-account.routes'));
app.use('/api/webhooks', require('./modules/online-ordering/webhook.routes'));

// Healthcheck
app.get('/api/health', async (req, res) => {
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
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', ...checks });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
