require('dotenv').config();

// Required environment variables
const requiredEnvVars = {
  // Database
  DATABASE_URL: 'Database connection URL',
  
  // JWT Secrets
  JWT_ACCESS_SECRET: 'JWT access token secret key',
  JWT_REFRESH_SECRET: 'JWT refresh token secret key',
  
  // Redis
  REDIS_URL: 'Redis connection URL',
  
  // Email Configuration
  MAIL_HOST: 'Email server host',
  MAIL_USERNAME: 'Email username',
  MAIL_PASSWORD: 'Email password',
  MAIL_FROM_ADDRESS: 'From email address',
  
  // Cloudinary (for file uploads)
  CLOUDINARY_CLOUD_NAME: 'Cloudinary cloud name',
  CLOUDINARY_API_KEY: 'Cloudinary API key',
  CLOUDINARY_API_SECRET: 'Cloudinary API secret',
  
  // Payment Providers (at least one is required)
  // Note: Stripe or Polar credentials are required
};

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: 'development',
  PORT: '9000',
  LOG_LEVEL: 'info',
  JWT_ACCESS_EXPIRES: '15m',
  JWT_REFRESH_EXPIRES: '7d',
  MAIL_PORT: '465',
  MAIL_FROM_NAME: 'TrueTab',
  APP_URL: 'http://localhost:3000',
  
  // Stripe (optional - for payment processing)
  STRIPE_SECRET_KEY: '',
  STRIPE_WEBHOOK_SECRET: '',
  
  // Polar (optional - for payment processing)
  POLAR_ACCESS_TOKEN: '',
  POLAR_WEBHOOK_SECRET: '',
  POLAR_ORGANIZATION_ID: ''
};

function validateEnvironment() {
  const missingVars = [];
  
  // Check required variables
  for (const [varName, description] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
      missingVars.push(`${varName} - ${description}`);
    }
  }
  
  // Check that at least one payment provider is configured
  const hasStripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET;
  const hasPolar = process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_WEBHOOK_SECRET;
  
  if (!hasStripe && !hasPolar) {
    console.warn('⚠️  Warning: No payment provider configured. Please set up either Stripe or Polar credentials.');
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varInfo => console.error(`  - ${varInfo}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
    }
  }
  
  console.log('✅ Environment variables validated successfully');
}

function getConfig() {
  return {
    // Server
    NODE_ENV: process.env.NODE_ENV,
    PORT: parseInt(process.env.PORT, 10),
    LOG_LEVEL: process.env.LOG_LEVEL,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    
    // Redis
    REDIS_URL: process.env.REDIS_URL,
    
    // JWT
    JWT: {
      ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
      REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES,
    },
    
    // Email
    MAIL: {
      HOST: process.env.MAIL_HOST,
      PORT: parseInt(process.env.MAIL_PORT, 10),
      USERNAME: process.env.MAIL_USERNAME,
      PASSWORD: process.env.MAIL_PASSWORD,
      FROM_NAME: process.env.MAIL_FROM_NAME,
      FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
    },
    
    // Cloudinary
    CLOUDINARY: {
      CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      API_KEY: process.env.CLOUDINARY_API_KEY,
      API_SECRET: process.env.CLOUDINARY_API_SECRET,
    },
    
    // Stripe
    STRIPE: {
      SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
    
    // Polar
    POLAR: {
      ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
      WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
      ORGANIZATION_ID: process.env.POLAR_ORGANIZATION_ID,
    },
    
    // App
    APP_URL: process.env.APP_URL,
  };
}

module.exports = {
  validateEnvironment,
  getConfig,
};
