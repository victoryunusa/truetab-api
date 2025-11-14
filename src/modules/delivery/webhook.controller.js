const svc = require("./delivery.service");

/**
 * Generic webhook handler
 * This is a simplified version - in production, each provider needs:
 * - Signature verification
 * - Request validation
 * - Provider-specific data transformation
 */
async function handleWebhook(req, res, next) {
  try {
    const { integrationId } = req.params;
    const webhookData = req.body;

    // TODO: Verify webhook signature based on provider
    // const isValid = await verifyWebhookSignature(req, integration);
    // if (!isValid) return res.status(401).json({ error: "Invalid signature" });

    // Process the webhook order
    const result = await svc.processWebhookOrder(integrationId, webhookData);

    res.status(200).json({ success: true, orderId: result.order.id });
  } catch (err) {
    console.error("Webhook error:", err);
    // Still return 200 to prevent retries for invalid data
    res.status(200).json({ success: false, error: err.message });
  }
}

/**
 * Uber Eats webhook handler
 */
async function handleUberEatsWebhook(req, res, next) {
  try {
    // Transform Uber Eats webhook format to our standard format
    const uberEatsData = req.body;
    
    // Example transformation (actual structure depends on Uber Eats API)
    const standardData = {
      externalOrderId: uberEatsData.id,
      customerName: uberEatsData.eater?.name,
      customerPhone: uberEatsData.eater?.phone,
      customerEmail: uberEatsData.eater?.email,
      deliveryAddress: uberEatsData.delivery_address,
      items: uberEatsData.cart?.items || [],
      subtotal: uberEatsData.payment?.charges?.subtotal / 100,
      deliveryFee: uberEatsData.payment?.charges?.delivery_fee / 100,
      serviceFee: uberEatsData.payment?.charges?.service_fee / 100,
      tip: uberEatsData.payment?.charges?.tip / 100,
      tax: uberEatsData.payment?.charges?.tax / 100,
      total: uberEatsData.payment?.charges?.total / 100,
      estimatedPickup: uberEatsData.estimated_ready_for_pickup_at,
      estimatedDelivery: uberEatsData.estimated_delivery_time,
    };

    req.body = standardData;
    return handleWebhook(req, res, next);
  } catch (err) {
    next(err);
  }
}

/**
 * DoorDash webhook handler
 */
async function handleDoorDashWebhook(req, res, next) {
  try {
    // Transform DoorDash webhook format to our standard format
    const doorDashData = req.body;
    
    // Example transformation (actual structure depends on DoorDash API)
    const standardData = {
      externalOrderId: doorDashData.order_id,
      customerName: doorDashData.customer?.name,
      customerPhone: doorDashData.customer?.phone_number,
      customerEmail: doorDashData.customer?.email,
      deliveryAddress: doorDashData.delivery_address,
      items: doorDashData.items || [],
      subtotal: doorDashData.subtotal / 100,
      deliveryFee: doorDashData.delivery_fee / 100,
      serviceFee: doorDashData.service_fee / 100,
      tip: doorDashData.tip / 100,
      tax: doorDashData.tax / 100,
      total: doorDashData.total / 100,
      estimatedPickup: doorDashData.pickup_time,
      estimatedDelivery: doorDashData.delivery_time,
    };

    req.body = standardData;
    return handleWebhook(req, res, next);
  } catch (err) {
    next(err);
  }
}

/**
 * Grubhub webhook handler
 */
async function handleGrubhubWebhook(req, res, next) {
  try {
    // Transform Grubhub webhook format to our standard format
    const grubhubData = req.body;
    
    // Example transformation (actual structure depends on Grubhub API)
    const standardData = {
      externalOrderId: grubhubData.order_number,
      customerName: grubhubData.diner?.name,
      customerPhone: grubhubData.diner?.phone,
      customerEmail: grubhubData.diner?.email,
      deliveryAddress: grubhubData.delivery?.address,
      items: grubhubData.order_items || [],
      subtotal: grubhubData.pricing?.subtotal,
      deliveryFee: grubhubData.pricing?.delivery_fee,
      serviceFee: grubhubData.pricing?.service_fee,
      tip: grubhubData.pricing?.tip,
      tax: grubhubData.pricing?.tax,
      total: grubhubData.pricing?.total,
      estimatedPickup: grubhubData.ready_by_time,
      estimatedDelivery: grubhubData.estimated_delivery_time,
    };

    req.body = standardData;
    return handleWebhook(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleWebhook,
  handleUberEatsWebhook,
  handleDoorDashWebhook,
  handleGrubhubWebhook,
};
