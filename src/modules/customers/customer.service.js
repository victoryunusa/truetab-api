const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new customer
 */
async function createCustomer({ brandId, ...customerData }) {
  // Check if customer with same phone/email already exists in brand
  if (customerData.phone || customerData.email) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        brandId,
        OR: [
          ...(customerData.phone ? [{ phone: customerData.phone }] : []),
          ...(customerData.email ? [{ email: customerData.email }] : []),
        ],
      },
    });

    if (existingCustomer) {
      throw new Error("Customer with this phone or email already exists");
    }
  }

  return prisma.customer.create({
    data: {
      brandId,
      ...customerData,
    },
    include: {
      addresses: true,
    },
  });
}

/**
 * List customers with search and pagination
 */
async function listCustomers({ brandId, query, phone, email, limit = 20, offset = 0 }) {
  const where = {
    brandId,
  };

  // Add search conditions
  if (query || phone || email) {
    const searchConditions = [];

    if (query) {
      searchConditions.push(
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } }
      );
    }

    if (phone) {
      searchConditions.push({ phone: { contains: phone } });
    }

    if (email) {
      searchConditions.push({ email: { contains: email, mode: "insensitive" } });
    }

    where.OR = searchConditions;
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        addresses: true,
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Last 5 orders for preview
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map((customer) => ({
      ...customer,
      orderCount: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.total), 0),
      lastOrderDate: customer.orders[0]?.createdAt || null,
    })),
    pagination: {
      total,
      offset,
      limit,
      hasMore: offset + customers.length < total,
    },
  };
}

/**
 * Get customer by ID
 */
async function getCustomerById({ customerId, brandId }) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
    include: {
      addresses: true,
      orders: {
        include: {
          items: {
            include: {
              item: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Last 10 orders
      },
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Calculate customer stats
  const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
  const orderCount = customer.orders.length;
  const averageOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

  return {
    ...customer,
    stats: {
      totalSpent,
      orderCount,
      averageOrderValue,
      firstOrderDate: customer.orders[customer.orders.length - 1]?.createdAt || null,
      lastOrderDate: customer.orders[0]?.createdAt || null,
    },
  };
}

/**
 * Update customer
 */
async function updateCustomer({ customerId, brandId, ...updateData }) {
  // Check if customer exists and belongs to brand
  const existingCustomer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
  });

  if (!existingCustomer) {
    throw new Error("Customer not found");
  }

  // Check for duplicate phone/email if being updated
  if (updateData.phone || updateData.email) {
    const duplicateCustomer = await prisma.customer.findFirst({
      where: {
        brandId,
        id: { not: customerId }, // Exclude current customer
        OR: [
          ...(updateData.phone ? [{ phone: updateData.phone }] : []),
          ...(updateData.email ? [{ email: updateData.email }] : []),
        ],
      },
    });

    if (duplicateCustomer) {
      throw new Error("Another customer with this phone or email already exists");
    }
  }

  return prisma.customer.update({
    where: { id: customerId },
    data: updateData,
    include: {
      addresses: true,
    },
  });
}

/**
 * Delete customer
 */
async function deleteCustomer({ customerId, brandId }) {
  // Check if customer exists and belongs to brand
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
    include: {
      orders: { select: { id: true } },
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Check if customer has orders
  if (customer.orders.length > 0) {
    throw new Error("Cannot delete customer with existing orders");
  }

  // Delete addresses first, then customer
  await prisma.$transaction([
    prisma.customerAddress.deleteMany({
      where: { customerId },
    }),
    prisma.customer.delete({
      where: { id: customerId },
    }),
  ]);

  return { message: "Customer deleted successfully" };
}

/**
 * Add address to customer
 */
async function addCustomerAddress({ customerId, brandId, ...addressData }) {
  // Verify customer exists and belongs to brand
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return prisma.customerAddress.create({
    data: {
      customerId,
      ...addressData,
    },
  });
}

/**
 * Update customer address
 */
async function updateCustomerAddress({ addressId, customerId, brandId, ...updateData }) {
  // Verify address exists and belongs to customer in brand
  const address = await prisma.customerAddress.findFirst({
    where: {
      id: addressId,
      customer: { id: customerId, brandId },
    },
  });

  if (!address) {
    throw new Error("Address not found");
  }

  return prisma.customerAddress.update({
    where: { id: addressId },
    data: updateData,
  });
}

/**
 * Delete customer address
 */
async function deleteCustomerAddress({ addressId, customerId, brandId }) {
  // Verify address exists and belongs to customer in brand
  const address = await prisma.customerAddress.findFirst({
    where: {
      id: addressId,
      customer: { id: customerId, brandId },
    },
  });

  if (!address) {
    throw new Error("Address not found");
  }

  await prisma.customerAddress.delete({
    where: { id: addressId },
  });

  return { message: "Address deleted successfully" };
}

/**
 * Search customers by phone (quick lookup)
 */
async function searchCustomersByPhone({ brandId, phone }) {
  return prisma.customer.findMany({
    where: {
      brandId,
      phone: { contains: phone },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    },
    take: 10,
  });
}

/**
 * Get customer order history
 */
async function getCustomerOrderHistory({ customerId, brandId, limit = 20, offset = 0 }) {
  // Verify customer exists and belongs to brand
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { customerId, brandId },
      include: {
        items: {
          include: {
            item: { select: { name: true } },
          },
        },
        branch: { select: { name: true } },
        table: { select: { number: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.order.count({ where: { customerId, brandId } }),
  ]);

  return {
    orders,
    pagination: {
      total,
      offset,
      limit,
      hasMore: offset + orders.length < total,
    },
  };
}

module.exports = {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  searchCustomersByPhone,
  getCustomerOrderHistory,
};