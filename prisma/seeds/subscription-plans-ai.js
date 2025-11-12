const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Subscription Plans with AI Features
 *
 * Pricing Strategy:
 * - Starter: Basic POS features, no AI
 * - Professional: Core AI features with limits
 * - Enterprise: Full AI suite with higher limits
 * - Ultimate: Unlimited AI + white-label options
 */

const PLANS = [
  // {
  //   name: 'Nine Base',
  //   description: 'Perfect for small restaurants getting started',
  //   priceMonthly: 29,
  //   priceYearly: 290, // ~17% discount
  //   currency: 'USD',
  //   maxBranches: 1,
  //   maxStaff: 5,
  //   trialDays: 14,
  //   isDefault: true,
  //   features: {
  //     // Core POS Features
  //     pos_enabled: true,
  //     inventory_management: true,
  //     basic_reports: true,
  //     table_management: true,
  //     online_ordering: false,
  //     multi_branch: false,

  //     // AI Features - NONE for Starter
  //     ai_enabled: false,

  //     // Support
  //     support_level: 'email',
  //     support_response: '48h',
  //   },
  // },
  {
    name: 'Nine Base',
    description: 'Perfect for small restaurants getting started',
    priceMonthly: 99,
    priceYearly: 990, // ~17% discount
    currency: 'USD',
    maxBranches: 1,
    maxStaff: 10,
    trialDays: 14,
    isDefault: false,
    features: {
      // Core POS Features
      pos_enabled: true,
      inventory_management: true,
      basic_reports: true,
      advanced_reports: true,
      table_management: true,
      online_ordering: true,
      multi_branch: true,
      kitchen_display: true,
      payroll: true,
      shift_management: true,

      // AI Features - Core Suite
      ai_enabled: true,
      ai_recommendations: true, // Smart Menu Recommendations
      ai_chatbot: true, // Customer Support Bot
      ai_analytics: true, // Basic Analytics & Insights
      ai_monthly_requests: 1000, // 1,000 AI requests/month (~33/day)

      // Support
      support_level: 'priority_email',
      support_response: '24h',
    },
  },
  {
    name: 'Nine Core',
    description: 'Advanced features with AI-powered insights',
    priceMonthly: 199,
    priceYearly: 1990, // ~17% discount
    currency: 'USD',
    maxBranches: 3,
    maxStaff: 50,
    trialDays: 14,
    isDefault: false,
    features: {
      // Core POS Features
      pos_enabled: true,
      inventory_management: true,
      basic_reports: true,
      advanced_reports: true,
      custom_reports: true,
      table_management: true,
      online_ordering: true,
      multi_branch: true,
      kitchen_display: true,
      delivery_integration: true,
      loyalty_program: true,
      payroll: true,
      reservations: true,
      shift_management: true,

      // AI Features - Full Suite
      ai_enabled: true,
      ai_recommendations: true, // Smart Menu Recommendations
      ai_forecasting: true, // Sales & Inventory Forecasting
      ai_nlp: true, // Natural Language Processing
      ai_pricing: true, // Intelligent Pricing
      ai_chatbot: true, // Customer Support Bot
      ai_analytics: true, // Advanced Analytics & Insights
      ai_monthly_requests: 5000, // 5,000 AI requests/month (~166/day)

      // API Access
      api_access: true,
      webhook_support: true,

      // Support
      support_level: 'phone_email',
      support_response: '12h',
      dedicated_onboarding: true,
    },
  },
  {
    name: 'Nine Pro',
    description: 'Full AI suite for growing restaurant chains',
    priceMonthly: 499,
    priceYearly: 4990, // ~17% discount
    currency: 'USD',
    maxBranches: null, // Unlimited
    maxStaff: null, // Unlimited
    trialDays: 14,
    isDefault: false,
    features: {
      // Core POS Features
      pos_enabled: true,
      inventory_management: true,
      basic_reports: true,
      advanced_reports: true,
      custom_reports: true,
      table_management: true,
      online_ordering: true,
      multi_branch: true,
      kitchen_display: true,
      delivery_integration: true,
      loyalty_program: true,
      white_label: true,
      custom_domain: true,
      payroll: true,
      reservations: true,
      shift_management: true,

      // AI Features - Full Suite + Unlimited
      ai_enabled: true,
      ai_recommendations: true,
      ai_forecasting: true,
      ai_nlp: true,
      ai_pricing: true,
      ai_chatbot: true,
      ai_analytics: true,
      ai_monthly_requests: null, // Unlimited AI requests
      ai_priority_processing: true, // Faster AI responses

      // API Access
      api_access: true,
      api_rate_limit: null, // Unlimited
      webhook_support: true,
      custom_integrations: true,

      // Support
      support_level: '24/7_dedicated',
      support_response: '1h',
      dedicated_account_manager: true,
      dedicated_onboarding: true,
      quarterly_business_review: true,
    },
  },
];

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans with AI features...\n');

  for (const plan of PLANS) {
    try {
      const existing = await prisma.subscriptionPlan.findFirst({
        where: {
          name: plan.name,
          currency: plan.currency,
        },
      });

      if (existing) {
        // Update existing plan
        await prisma.subscriptionPlan.update({
          where: { id: existing.id },
          data: plan,
        });
        console.log(`✅ Updated: ${plan.name} - $${plan.priceMonthly}/mo`);
      } else {
        // Create new plan
        await prisma.subscriptionPlan.create({
          data: plan,
        });
        console.log(`✨ Created: ${plan.name} - $${plan.priceMonthly}/mo`);
      }

      // Display AI features
      if (plan.features.ai_enabled) {
        const aiFeatures = Object.keys(plan.features)
          .filter(k => k.startsWith('ai_') && plan.features[k] === true)
          .map(k => k.replace('ai_', ''));

        console.log(`   AI Features: ${aiFeatures.join(', ')}`);

        if (plan.features.ai_monthly_requests) {
          console.log(`   AI Limit: ${plan.features.ai_monthly_requests} requests/month`);
        } else if (plan.features.ai_monthly_requests === null) {
          console.log(`   AI Limit: Unlimited requests`);
        }
      } else {
        console.log(`   AI Features: None`);
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Error seeding plan ${plan.name}:`, error.message);
    }
  }

  console.log('✅ Subscription plans seeded successfully!\n');

  // Display pricing comparison
  console.log('📊 Pricing Comparison:\n');
  console.log('Plan          Monthly   Yearly    AI Requests/mo   AI Features');
  console.log('─'.repeat(75));

  PLANS.forEach(plan => {
    const monthly = `$${plan.priceMonthly}`.padEnd(9);
    const yearly = `$${plan.priceYearly}`.padEnd(9);
    const requests = plan.features.ai_monthly_requests
      ? plan.features.ai_monthly_requests.toString().padEnd(16)
      : plan.features.ai_enabled
        ? 'Unlimited'.padEnd(16)
        : 'None'.padEnd(16);

    const featureCount = Object.keys(plan.features).filter(
      k => k.startsWith('ai_') && plan.features[k] === true
    ).length;

    console.log(
      `${plan.name.padEnd(13)} ${monthly} ${yearly} ${requests} ${featureCount} features`
    );
  });
  console.log('');
}

async function main() {
  try {
    await seedSubscriptionPlans();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedSubscriptionPlans, PLANS };
