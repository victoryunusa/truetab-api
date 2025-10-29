const { PrismaClient, InvoiceStatus } = require('@prisma/client');
const dayjs = require('dayjs');
const prisma = new PrismaClient();

/**
 * Generate unique invoice number
 */
async function generateInvoiceNumber() {
  const year = dayjs().year();
  const prefix = `INV-${year}-`;

  // Get the last invoice for this year
  const lastInvoice = await prisma.subscriptionInvoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop());
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Create invoice from subscription payment
 */
async function createInvoice({
  subscriptionId,
  brandId,
  amount,
  currency,
  period,
  periodStart,
  periodEnd,
  provider,
  stripeInvoiceId = null,
  stripePaymentIntentId = null,
  polarInvoiceId = null,
  polarPaymentId = null,
  planName = null,
  taxAmount = 0,
  discountAmount = 0,
}) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const invoiceNumber = await generateInvoiceNumber();

  // Format billing period
  const billingPeriod =
    period === 'yearly'
      ? dayjs(periodStart).year().toString()
      : dayjs(periodStart).format('MMMM YYYY');

  // Create line items
  const lineItems = [
    {
      description: `${planName || subscription.plan.name} - ${period === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
      period: `${dayjs(periodStart).format('MMM DD, YYYY')} - ${dayjs(periodEnd).format('MMM DD, YYYY')}`,
      quantity: 1,
      unitPrice: amount,
      amount: amount,
    },
  ];

  const totalAmount = amount + taxAmount - discountAmount;

  const invoice = await prisma.subscriptionInvoice.create({
    data: {
      invoiceNumber,
      subscriptionId,
      brandId,
      amount,
      currency,
      status: InvoiceStatus.PAID, // Mark as paid immediately for successful payments
      period,
      billingPeriod,
      periodStart,
      periodEnd,
      paidAt: new Date(),
      provider,
      stripeInvoiceId,
      stripePaymentIntentId,
      polarInvoiceId,
      polarPaymentId,
      lineItems,
      taxAmount,
      discountAmount,
      totalAmount,
    },
    include: {
      subscription: {
        include: {
          plan: true,
          brand: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return invoice;
}

/**
 * Get all invoices for a brand
 */
async function getBrandInvoices({ brandId, page = 1, limit = 10 }) {
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.subscriptionInvoice.findMany({
      where: { brandId },
      include: {
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.subscriptionInvoice.count({
      where: { brandId },
    }),
  ]);

  return {
    data: invoices,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get single invoice by ID
 */
async function getInvoiceById({ invoiceId }) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      subscription: {
        include: {
          plan: true,
          brand: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return { data: invoice };
}

/**
 * Get invoice by invoice number
 */
async function getInvoiceByNumber({ invoiceNumber }) {
  const invoice = await prisma.subscriptionInvoice.findUnique({
    where: { invoiceNumber },
    include: {
      subscription: {
        include: {
          plan: true,
          brand: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  return { data: invoice };
}

/**
 * Update invoice status
 */
async function updateInvoiceStatus({ invoiceId, status, paidAt = null }) {
  const invoice = await prisma.subscriptionInvoice.update({
    where: { id: invoiceId },
    data: {
      status,
      paidAt: status === InvoiceStatus.PAID && !paidAt ? new Date() : paidAt,
    },
  });

  return { data: invoice };
}

/**
 * Get payment history summary for a brand
 */
async function getPaymentSummary({ brandId }) {
  const invoices = await prisma.subscriptionInvoice.findMany({
    where: { brandId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const summary = {
    totalPaid: 0,
    totalPending: 0,
    totalFailed: 0,
    invoiceCount: invoices.length,
    paidInvoices: 0,
    pendingInvoices: 0,
    failedInvoices: 0,
    lastPaymentDate: null,
    lastPaymentAmount: null,
  };

  invoices.forEach(invoice => {
    if (invoice.status === InvoiceStatus.PAID) {
      summary.totalPaid += invoice.totalAmount;
      summary.paidInvoices++;
      if (!summary.lastPaymentDate || invoice.paidAt > summary.lastPaymentDate) {
        summary.lastPaymentDate = invoice.paidAt;
        summary.lastPaymentAmount = invoice.totalAmount;
      }
    } else if (invoice.status === InvoiceStatus.PENDING) {
      summary.totalPending += invoice.totalAmount;
      summary.pendingInvoices++;
    } else if (invoice.status === InvoiceStatus.FAILED) {
      summary.totalFailed += invoice.totalAmount;
      summary.failedInvoices++;
    }
  });

  return { data: summary };
}

/**
 * Download invoice as PDF (placeholder - integrate with PDF generation library)
 */
async function downloadInvoicePDF({ invoiceId }) {
  const invoice = await getInvoiceById({ invoiceId });

  // TODO: Integrate with PDF generation library (e.g., PDFKit, Puppeteer)
  // For now, return the invoice data that can be used to generate PDF on frontend

  return {
    data: {
      ...invoice.data,
      // Add company details that should appear on invoice
      companyDetails: {
        name: 'Nine',
        address: 'Your Company Address',
        email: 'billing@ninetab.com',
        website: 'https://ninetab.com',
      },
    },
  };
}

module.exports = {
  createInvoice,
  getBrandInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  updateInvoiceStatus,
  getPaymentSummary,
  downloadInvoicePDF,
  generateInvoiceNumber,
};
