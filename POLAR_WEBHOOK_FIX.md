# Polar Webhook Signature Verification Fix

## Problem
The Polar webhook endpoint was returning various errors:
1. **404 error** - Incorrect URL path
2. **500 error** - Webhook handler failing
3. **"Missing signature header"** - Wrong header name
4. **"Invalid body format"** - Body parser issue
5. **"Invalid signature"** - Custom signature verification not matching Polar's format

## Root Causes

### 1. Body Parser Middleware Order
The global `express.json()` middleware was parsing the request body before it reached the webhook handler, preventing access to the raw body needed for signature verification.

### 2. Custom Signature Verification
The custom HMAC SHA256 signature verification in `polar.service.js` did not match Polar's actual signature format. Polar uses the Standard Webhooks specification.

## Solution

### 1. Installed Official Polar SDK
```bash
npm install @polar-sh/sdk
```

### 2. Fixed Middleware Order in `src/app.js`
Moved webhook routes **before** the global JSON body parser to ensure raw body access:

```javascript
// Webhook routes MUST come before body parsers to get raw body
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }), subscriptionRoutes);

// Now apply body parsers for all other routes
app.use(express.json({ limit: '10mb' }));
```

### 3. Updated Webhook Controller
Replaced custom signature verification with Polar's official SDK:

**Before:**
```javascript
const polarService = require('../../services/polar.service');
// ... custom verification logic ...
if (!polarService.verifyWebhookSignature(rawBody, signature, timestamp)) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

**After:**
```javascript
const { validateEvent, WebhookVerificationError } = require('@polar-sh/sdk/webhooks');

try {
  event = validateEvent(req.body, req.headers, webhookSecret);
  console.log('Polar webhook received:', event.type);
} catch (error) {
  if (error instanceof WebhookVerificationError) {
    console.error('Webhook verification failed:', error.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }
}
```

### 4. Removed Duplicate Body Parser
Removed the duplicate `express.raw()` calls from `subscription.routes.js` since it's now handled in `app.js`.

## Technical Details

### Standard Webhooks Format
Polar uses the [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks) specification, which:
- Uses `webhook-id`, `webhook-timestamp`, and `webhook-signature` headers
- Implements HMAC SHA256 with base64-encoded secrets
- Includes timestamp-based replay attack protection
- Uses a versioned signature format (e.g., `v1,xxx`)

### Benefits of Using Official SDK
1. **Automatic signature verification** - Handles all edge cases correctly
2. **Type safety** - Validates event payload structure
3. **Future-proof** - Automatically supports new Polar webhook events
4. **Error handling** - Proper error types for different failure scenarios

## Verification

To test the webhook locally:

1. Use ngrok to expose your local server:
   ```bash
   ngrok http 9000
   ```

2. Configure the ngrok URL in Polar dashboard:
   ```
   https://your-ngrok-url.ngrok.io/api/subscription/webhook/polar
   ```

3. Trigger a test webhook from Polar dashboard

4. Check server logs for:
   ```
   Polar webhook received: subscription.created
   ```

## Environment Variables Required

```env
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_ORGANIZATION_ID=your_org_id
```

## Files Modified

1. `src/app.js` - Middleware order fix
2. `src/modules/subscriptions/subscription.routes.js` - Removed duplicate body parser
3. `src/modules/subscriptions/polar-webhook.controller.js` - Use official SDK validation
4. `package.json` - Added `@polar-sh/sdk` dependency

## Status

✅ **FIXED** - Polar webhooks now properly verify signatures using the official SDK and Standard Webhooks specification.
