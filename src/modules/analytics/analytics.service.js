const { prisma } = require('../../lib/prisma');
const dayjs = require('dayjs');

/**
 * Get sales overview for dashboard
 */
async function getSalesOverview(brandId, branchId = null, startDate, endDate) {
  try {
    const where = {
      brandId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: {
        in: ['COMPLETED', 'PAID'],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    // Get total orders, revenue, and average order value
    const orders = await prisma.order.findMany({
      where,
      select: {
        total: true,
        subtotal: true,
        tax: true,
        tip: true,
        createdAt: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalTax = orders.reduce((sum, order) => sum + Number(order.tax || 0), 0);
    const totalTips = orders.reduce((sum, order) => sum + Number(order.tip || 0), 0);

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalTips: parseFloat(totalTips.toFixed(2)),
    };
  } catch (error) {
    console.error('Error getting sales overview:', error);
    throw new Error('Failed to retrieve sales overview');
  }
}

/**
 * Get revenue trends over time
 */
async function getRevenueTrends(brandId, branchId = null, startDate, endDate, interval = 'day') {
  try {
    const where = {
      brandId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      status: {
        in: ['COMPLETED', 'PAID'],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group by interval
    const grouped = {};
    orders.forEach(order => {
      let key;
      const date = dayjs(order.createdAt);
      
      if (interval === 'hour') {
        key = date.format('YYYY-MM-DD HH:00');
      } else if (interval === 'day') {
        key = date.format('YYYY-MM-DD');
      } else if (interval === 'week') {
        key = date.startOf('week').format('YYYY-MM-DD');
      } else if (interval === 'month') {
        key = date.format('YYYY-MM');
      } else {
        key = date.format('YYYY-MM-DD');
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, revenue: 0, orders: 0 };
      }
      grouped[key].revenue += Number(order.total);
      grouped[key].orders += 1;
    });

    // Convert to array and sort
    const trends = Object.values(grouped).map(item => ({
      date: item.date,
      revenue: parseFloat(item.revenue.toFixed(2)),
      orders: item.orders,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  } catch (error) {
    console.error('Error getting revenue trends:', error);
    throw new Error('Failed to retrieve revenue trends');
  }
}

/**
 * Get top selling items
 */
async function getTopSellingItems(brandId, branchId = null, startDate, endDate, limit = 10) {
  try {
    const where = {
      order: {
        brandId,
        status: {
          in: ['COMPLETED', 'PAID'],
        },
      },
    };

    if (startDate && endDate) {
      where.order.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (branchId) {
      where.order.branchId = branchId;
    }

    const orderItems = await prisma.orderItem.findMany({
      where,
      include: {
        item: {
          select: {
            defaultName: true,
            id: true,
          },
        },
      },
    });

    // Aggregate by menu item
    const itemStats = {};
    orderItems.forEach(item => {
      const itemId = item.itemId;
      const itemName = item.item?.name || 'Unknown Item';
      
      if (!itemStats[itemId]) {
        itemStats[itemId] = {
          itemId,
          itemName,
          quantitySold: 0,
          revenue: 0,
        };
      }
      
      itemStats[itemId].quantitySold += item.quantity;
      itemStats[itemId].revenue += Number(item.price) * item.quantity;
    });

    // Convert to array, sort, and limit
    const topItems = Object.values(itemStats)
      .map(item => ({
        ...item,
        revenue: parseFloat(item.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);

    return topItems;
  } catch (error) {
    console.error('Error getting top selling items:', error);
    throw new Error('Failed to retrieve top selling items');
  }
}

/**
 * Get customer insights
 */
async function getCustomerInsights(brandId, branchId = null, startDate, endDate) {
  try {
    const orderWhere = {
      brandId,
      status: {
        in: ['COMPLETED', 'PAID'],
      },
    };

    if (startDate && endDate) {
      orderWhere.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (branchId) {
      orderWhere.branchId = branchId;
    }

    // Get total unique customers
    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        customerId: true,
        total: true,
      },
    });

    const customerMap = {};
    orders.forEach(order => {
      if (order.customerId) {
        if (!customerMap[order.customerId]) {
          customerMap[order.customerId] = {
            orders: 0,
            totalSpent: 0,
          };
        }
        customerMap[order.customerId].orders += 1;
        customerMap[order.customerId].totalSpent += Number(order.total);
      }
    });

    const uniqueCustomers = Object.keys(customerMap).length;
    const repeatCustomers = Object.values(customerMap).filter(c => c.orders > 1).length;
    const averageOrdersPerCustomer = uniqueCustomers > 0 
      ? Object.values(customerMap).reduce((sum, c) => sum + c.orders, 0) / uniqueCustomers 
      : 0;
    
    const totalCustomerSpent = Object.values(customerMap).reduce((sum, c) => sum + c.totalSpent, 0);
    const averageCustomerValue = uniqueCustomers > 0 ? totalCustomerSpent / uniqueCustomers : 0;

    // Get new customers in period
    const customerWhere = { brandId };
    if (startDate && endDate) {
      customerWhere.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const newCustomers = await prisma.customer.count({
      where: customerWhere,
    });

    return {
      totalCustomers: uniqueCustomers,
      newCustomers,
      repeatCustomers,
      repeatRate: uniqueCustomers > 0 ? parseFloat(((repeatCustomers / uniqueCustomers) * 100).toFixed(2)) : 0,
      averageOrdersPerCustomer: parseFloat(averageOrdersPerCustomer.toFixed(2)),
      averageCustomerValue: parseFloat(averageCustomerValue.toFixed(2)),
    };
  } catch (error) {
    console.error('Error getting customer insights:', error);
    throw new Error('Failed to retrieve customer insights');
  }
}

/**
 * Get order statistics
 */
async function getOrderStatistics(brandId, branchId = null, startDate, endDate) {
  try {
    const where = {
      brandId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    const statusBreakdown = {};
    ordersByStatus.forEach(item => {
      statusBreakdown[item.status] = item._count.id;
    });

    // Get orders by type (bill type)
    const ordersByType = await prisma.order.groupBy({
      by: ['billType'],
      where,
      _count: {
        id: true,
      },
    });

    const typeBreakdown = {};
    ordersByType.forEach(item => {
      typeBreakdown[item.billType] = item._count.id;
    });

    // Get orders by payment method
    const payments = await prisma.payment.groupBy({
      by: ['method'],
      where: {
        order: where,
      },
      _count: {
        id: true,
      },
    });

    const paymentMethodBreakdown = {};
    payments.forEach(item => {
      paymentMethodBreakdown[item.method] = item._count.id;
    });

    // Get average fulfillment time for completed orders
    const completedOrders = await prisma.order.findMany({
      where: {
        ...where,
        status: {
          in: ['COMPLETED', 'PAID'],
        },
        completedAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
    });

    let avgFulfillmentTime = 0;
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((sum, order) => {
        const diff = dayjs(order.completedAt).diff(dayjs(order.createdAt), 'minute');
        return sum + diff;
      }, 0);
      avgFulfillmentTime = totalTime / completedOrders.length;
    }

    return {
      statusBreakdown,
      typeBreakdown,
      paymentMethodBreakdown,
      avgFulfillmentTime: parseFloat(avgFulfillmentTime.toFixed(2)),
    };
  } catch (error) {
    console.error('Error getting order statistics:', error);
    throw new Error('Failed to retrieve order statistics');
  }
}

/**
 * Get comprehensive dashboard data
 */
async function getDashboardAnalytics(brandId, branchId = null, startDate, endDate) {
  try {
    const [
      salesOverview,
      revenueTrends,
      topItems,
      customerInsights,
      orderStats,
    ] = await Promise.all([
      getSalesOverview(brandId, branchId, startDate, endDate),
      getRevenueTrends(brandId, branchId, startDate, endDate, 'day'),
      getTopSellingItems(brandId, branchId, startDate, endDate, 10),
      getCustomerInsights(brandId, branchId, startDate, endDate),
      getOrderStatistics(brandId, branchId, startDate, endDate),
    ]);

    return {
      salesOverview,
      revenueTrends,
      topSellingItems: topItems,
      customerInsights,
      orderStatistics: orderStats,
      period: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    throw new Error('Failed to retrieve dashboard analytics');
  }
}

module.exports = {
  getSalesOverview,
  getRevenueTrends,
  getTopSellingItems,
  getCustomerInsights,
  getOrderStatistics,
  getDashboardAnalytics,
};
