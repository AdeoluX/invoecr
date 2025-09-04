# 🔄 **Subscription Renewal System**

## 📋 **Overview**

The subscription renewal system automatically handles subscription renewals for the invoice generator app. It integrates with the existing `CardService.chargeCard()` endpoint to process payments and renew subscriptions seamlessly.

## 🚀 **Features**

### **1. Manual Subscription Renewal**

- Users can manually renew their subscriptions
- Uses saved cards for payment processing
- Supports both free and paid plans

### **2. Automatic Subscription Renewal**

- Daily monitoring of subscriptions needing renewal
- Weekly automatic renewal processing
- Configurable renewal windows (default: 7 days ahead)

### **3. Smart Renewal Logic**

- Checks subscription expiry status
- Prevents renewal of active, non-expired subscriptions
- Handles free plan renewals without payment
- Falls back to default cards for automatic renewals

## 🔧 **API Endpoints**

### **POST `/api/v1/subscription/renew`**

Renew the current user's subscription.

**Request Body:**

```json
{
  "cardId": "64f8a1b2c3d4e5f6a7b8c9d3" // Optional: specific card to use
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isFree": false,
    "message": "Subscription renewed successfully",
    "subscription": "basic",
    "status": "active",
    "payment": {
      "success": true,
      "reference": "CHARGE_64f8a1b2c3d4e5f6a7b8c9d0_1705312200000",
      "amount": 2000,
      "currency": "NGN",
      "card": {
        "last4": "1234",
        "brand": "Visa"
      }
    }
  }
}
```

### **GET `/api/v1/subscription/renewal-status`**

Get list of subscriptions needing renewal (for monitoring).

**Query Parameters:**

- `daysAhead` (optional): Days ahead to check (default: 7)

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscriptions needing renewal retrieved",
    "count": 2,
    "entities": [
      {
        "entityId": "64f8a1b2c3d4e5f6a7b8c9d0",
        "email": "tayo@business.com",
        "currentPlan": "basic",
        "currentPlanPrice": 2000,
        "expiryDate": "2024-02-15T10:30:00.000Z",
        "daysUntilExpiry": 3
      }
    ]
  }
}
```

### **POST `/api/v1/subscription/process-renewals`**

Process automatic renewals for subscriptions (admin/cron endpoint).

**Query Parameters:**

- `daysAhead` (optional): Days ahead to process (default: 7)

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Automatic renewals processed",
    "results": {
      "processed": 2,
      "successful": 1,
      "failed": 1,
      "errors": [
        {
          "entityId": "64f8a1b2c3d4e5f6a7b8c9d1",
          "error": "Payment failed: No default card found"
        }
      ]
    }
  }
}
```

## ⚙️ **Cron Jobs**

### **Daily Renewal Check (9:00 AM)**

- Monitors subscriptions expiring in the next 7 days
- Logs entities needing renewal for monitoring
- No automatic processing, just monitoring

### **Weekly Renewal Processing (Sunday 2:00 AM)**

- Automatically processes renewals for subscriptions expiring in 7 days
- Uses default cards for payment
- Logs results and errors

### **Custom Renewal Checks**

- Support for custom cron schedules
- Configurable days ahead for checking
- Useful for testing or specific business requirements

## 🔄 **Renewal Flow**

### **1. Manual Renewal**

```
User Request → Check Subscription Status → Validate Renewal Eligibility →
Charge Card → Update Subscription → Return Success Response
```

### **2. Automatic Renewal**

```
Cron Job → Find Expiring Subscriptions → Attempt Renewal →
Process Payment → Update Subscription → Log Results
```

### **3. Renewal Validation**

- ✅ Subscription exists and is valid
- ✅ Subscription is expired or expiring soon
- ✅ User has saved cards (for paid plans)
- ✅ Payment processing successful

## 💳 **Payment Integration**

### **CardService.chargeCard() Integration**

The renewal system uses the existing `CardService.chargeCard()` method:

```javascript
const chargeResult = await CardService.chargeCard(
  entityId,
  plan.price,
  email,
  `Subscription renewal for ${plan.displayName} plan`,
  cardId
);
```

### **Payment Flow**

1. **Card Selection**: Uses specified card or default card
2. **Amount Calculation**: Charges the plan price
3. **Payment Processing**: Integrates with Paystack
4. **Success Handling**: Updates subscription on successful payment
5. **Error Handling**: Returns detailed error information

## 🛠️ **Setup & Configuration**

### **1. Install Dependencies**

```bash
npm install node-cron
```

### **2. Initialize Cron Jobs**

```javascript
// In your main app.js or start.js
const { subscriptionCronJobs } = require("./src/utils/subscription-cron");
subscriptionCronJobs.init();
```

### **3. Environment Variables**

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_CALLBACK_URL=your_callback_url

# Database Configuration
MONGODB_URI=your_mongodb_connection_string
```

## 📊 **Monitoring & Logging**

### **Cron Job Status**

```javascript
const status = subscriptionCronJobs.getStatus();
console.log("Cron Jobs Status:", status);
```

### **Log Examples**

```
✅ Subscription renewal cron jobs initialized
📅 Daily renewal check cron job scheduled (9:00 AM daily)
🔄 Weekly renewal processing cron job scheduled (2:00 AM Sundays)

🕐 Daily subscription renewal check started
📅 Found 2 subscriptions needing renewal in the next 7 days
  - Entity 64f8a1b2c3d4e5f6a7b8c9d0: basic plan expires in 3 days

🔄 Weekly automatic renewal processing started
📊 Automatic renewal results: { processed: 2, successful: 1, failed: 1, errors: 1 }
```

## 🔒 **Security & Validation**

### **Authentication**

- All renewal endpoints require valid JWT tokens
- User can only renew their own subscription
- Admin endpoints for monitoring and processing

### **Business Logic Validation**

- Prevents renewal of active, non-expired subscriptions
- Validates subscription plan existence
- Ensures payment readiness before processing

### **Error Handling**

- Comprehensive error logging
- Graceful fallbacks for failed renewals
- Detailed error responses for debugging

## 🧪 **Testing**

### **Test Manual Renewal**

```bash
# 1. Get auth token
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# 2. Renew subscription
curl -X POST http://localhost:3000/api/v1/subscription/renew \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cardId": "optional_card_id"}'
```

### **Test Cron Jobs**

```javascript
// Test custom renewal check
const jobId = subscriptionCronJobs.setupCustomRenewalCheck("*/5 * * * *", 7);

// Check status
const status = subscriptionCronJobs.getStatus();
console.log(status);

// Stop test job
subscriptionCronJobs.stopJob(jobId);
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Cron Jobs Not Starting**

```bash
# Check if node-cron is installed
npm list node-cron

# Check console for initialization messages
# Look for: "✅ Subscription renewal cron jobs initialized"
```

#### **2. Payment Failures**

- Verify Paystack configuration
- Check if user has saved cards
- Validate subscription plan pricing
- Review Paystack webhook responses

#### **3. Database Connection Issues**

- Ensure MongoDB is running
- Check connection string
- Verify Entity and SubscriptionPlan models

### **Debug Mode**

```javascript
// Enable detailed logging
process.env.DEBUG = "subscription:*";

// Check cron job status
const status = subscriptionCronJobs.getStatus();
console.log("Cron Jobs:", JSON.stringify(status, null, 2));
```

## 📈 **Performance & Scalability**

### **Optimization Tips**

1. **Batch Processing**: Process renewals in batches for large user bases
2. **Database Indexing**: Ensure proper indexes on subscription expiry dates
3. **Rate Limiting**: Implement rate limiting for manual renewal requests
4. **Caching**: Cache subscription plan details to reduce database queries

### **Monitoring Metrics**

- Renewal success rate
- Average processing time
- Failed renewal reasons
- Card payment success rate

## 🔮 **Future Enhancements**

### **Planned Features**

1. **Email Notifications**: Alert users before subscription expiry
2. **Retry Logic**: Automatic retry for failed payments
3. **Multiple Payment Methods**: Support for bank transfers, USSD
4. **Renewal Preferences**: User-configurable renewal settings
5. **Analytics Dashboard**: Renewal metrics and insights

### **Integration Opportunities**

1. **WhatsApp Notifications**: Send renewal reminders via Termii
2. **SMS Alerts**: SMS notifications for critical renewal events
3. **Webhook Support**: External system integration for renewal events
4. **Multi-currency**: Support for USD and other currencies

## 📞 **Support**

For technical support or questions about the subscription renewal system:

- **Documentation**: Check this README and API documentation
- **Logs**: Review console logs and error messages
- **Testing**: Use the provided test endpoints
- **Monitoring**: Check cron job status and renewal metrics

---

**🎉 The subscription renewal system is now fully integrated with your invoice generator app!**
