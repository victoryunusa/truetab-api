const checkoutService = require('./checkout.service');
const paymentGateway = require('../../services/payment-gateway.service');

async function handleWebhook(req, res, next) {
  try {
    const gateway = req.headers['x-payment-gateway'] || 'stripe';
    const signature =
      req.headers['x-webhook-signature'] ||
      req.headers['x-paystack-signature'] ||
      req.headers['verif-hash'];

    // Verify webhook signature
    const event = paymentGateway.verifyWebhookSignature({
      payload: req.body,
      signature,
      gatewayName: gateway,
    });

    // Handle different event types
    switch (gateway) {
      case 'stripe':
        await handleStripeEvent(event);
        break;
      case 'paystack':
        await handlePaystackEvent(event);
        break;
      case 'flutterwave':
        await handleFlutterwaveEvent(event);
        break;
      case 'razorpay':
        await handleRazorpayEvent(event);
        break;
      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await checkoutService.handlePaymentSuccess(event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      await checkoutService.handlePaymentFailure(
        event.data.object.id,
        event.data.object.last_payment_error?.message
      );
      break;
  }
}

async function handlePaystackEvent(event) {
  switch (event.event) {
    case 'charge.success':
      await checkoutService.handlePaymentSuccess(event.data.reference);
      break;
    case 'charge.failed':
      await checkoutService.handlePaymentFailure(event.data.reference, event.data.gateway_response);
      break;
  }
}

async function handleFlutterwaveEvent(event) {
  if (event.event === 'charge.completed' && event.data.status === 'successful') {
    await checkoutService.handlePaymentSuccess(event.data.tx_ref);
  } else if (event.event === 'charge.failed') {
    await checkoutService.handlePaymentFailure(event.data.tx_ref, event.data.processor_response);
  }
}

async function handleRazorpayEvent(event) {
  switch (event.event) {
    case 'payment.captured':
      await checkoutService.handlePaymentSuccess(event.payload.payment.entity.order_id);
      break;
    case 'payment.failed':
      await checkoutService.handlePaymentFailure(
        event.payload.payment.entity.order_id,
        event.payload.payment.entity.error_description
      );
      break;
  }
}

module.exports = {
  handleWebhook,
};
