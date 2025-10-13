# InvoiceFullStack Postman Collection Guide

This guide provides comprehensive documentation for the InvoiceFullStack Backend API Postman collection.

## 📁 **Files Included**

1. **`InvoiceFullStack_Postman_Collection.json`** - Complete API collection
2. **`InvoiceFullStack_Postman_Environment.json`** - Environment variables
3. **`POSTMAN_COLLECTION_GUIDE.md`** - This documentation

## 🚀 **Quick Setup**

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Select `InvoiceFullStack_Postman_Collection.json`
4. Click "Import"

### 2. Import Environment

1. Click the gear icon (⚙️) in the top right
2. Click "Import"
3. Select `InvoiceFullStack_Postman_Environment.json`
4. Click "Import"
5. Select the "InvoiceFullStack Environment" from the dropdown

### 3. Configure Base URL

- Update `baseUrl` in environment variables if your server runs on a different port
- Default: `http://localhost:3000/api/v1`

## 🔐 **Authentication Setup**

### Getting Auth Token

1. Use the **"Sign In"** request in the Authentication folder
2. Copy the `token` from the response
3. Set the `authToken` environment variable with the token value

### Auto-Authentication

The collection is configured with Bearer token authentication:

- Most requests automatically use `{{authToken}}`
- No need to manually add Authorization headers

## 📋 **API Endpoints Overview**

### 🔑 **Authentication (2 endpoints)**

- `POST /auth/sign-up` - Register new user
- `POST /auth/sign-in` - Login user

### 🏢 **Entity Management (6 endpoints)**

- `POST /entity/add-bank` - Add bank account
- `GET /entity/get-banks` - Get bank accounts
- `POST /entity/add-logo` - Upload logo
- `POST /entity/add-signature` - Upload signature
- `PATCH /entity` - Update entity info
- `POST /entity/add-member` - Add team member

### 👥 **Customer Management (5 endpoints)**

- `POST /customer` - Create customer
- `GET /customer` - Get all customers
- `GET /customer/:id` - Get customer by ID
- `PUT /customer/:id` - Update customer
- `DELETE /customer/:id` - Delete customer

### 📄 **Invoice Management (7 endpoints)**

- `POST /invoice` - Create invoice
- `GET /invoice` - Get all invoices
- `GET /invoice/:code` - Get invoice by code
- `PUT /invoice/:invoiceId` - Update invoice
- `DELETE /invoice/:invoiceId` - Delete invoice
- `GET /invoice/dashboard` - Get dashboard summary
- `GET /invoice/analytics` - Get analytics data

### 🎨 **Invoice Templates (2 endpoints)**

- `GET /invoice/templates` - Get available templates
- `GET /invoice/templates/:templateId/preview` - Preview template

### 📄 **PDF Generation (3 endpoints)**

- `GET /invoice/:code/pdf` - Download/Preview PDF
- `GET /invoice/:code/html-pdf` - Alternative PDF endpoint

### 💳 **Payment Processing (3 endpoints)**

- `GET /invoice/:code/initiate-payment` - Initiate payment
- `POST /invoice/:code/share-whatsapp` - Share via WhatsApp
- `POST /invoice/:code/share-pdf-whatsapp` - Share PDF via WhatsApp

### 📊 **Subscription Management (10 endpoints)**

- `GET /subscription/plans` - Get available plans (public)
- `GET /subscription/comparison` - Get plan comparison (public)
- `GET /subscription/current` - Get current subscription
- `POST /subscription/upgrade` - Upgrade plan
- `POST /subscription/downgrade` - Downgrade plan
- `GET /subscription/limits` - Check limits
- `GET /subscription/feature/:feature` - Check feature access
- `GET /subscription/payment-readiness` - Check payment readiness
- `POST /subscription/renew` - Renew subscription

### 💳 **Card Management (7 endpoints)**

- `POST /card/save/initialize` - Initialize card save
- `POST /card/save/verify` - Verify card save
- `GET /card/list` - Get saved cards
- `POST /card/default` - Set default card
- `DELETE /card/:cardId` - Remove card
- `POST /card/charge` - Charge card
- `GET /card/status` - Check card status

### 🛠️ **Utilities (2 endpoints)**

- `GET /utils/get-banks` - List Nigerian banks
- `POST /utils/resolve-bank` - Resolve bank account

### 🔗 **Webhooks (2 endpoints)**

- `POST /webhook` - Paystack webhook
- `GET /webhook/callback` - Webhook callback

## 🎯 **Key Features**

### 📄 **HTML PDF Templates**

The collection includes support for the new HTML PDF templates:

- **invoice1**: Classic design with modern blue theme
- **invoice2**: Modern design with red accents
- **invoice3**: Contemporary design with orange accents

### 🔄 **Template Parameters**

PDF generation supports these query parameters:

- `template`: Template ID (invoice1, invoice2, invoice3)
- `preview`: true for browser preview, false for download

### 📱 **WhatsApp Integration**

- Share invoices via WhatsApp
- Share PDF invoices via WhatsApp
- Includes phone number and custom message support

### 💳 **Payment Integration**

- Paystack payment processing
- Saved card management
- Subscription billing
- Webhook handling

## 🧪 **Testing Workflow**

### 1. **Authentication Flow**

```
1. Sign Up → Get user account
2. Sign In → Get auth token
3. Set authToken environment variable
```

### 2. **Entity Setup**

```
1. Update Entity → Set business info
2. Add Bank Account → Add payment details
3. Add Logo → Upload business logo
4. Add Signature → Upload signature
```

### 3. **Customer Management**

```
1. Create Customer → Add customer details
2. Get All Customers → Verify creation
3. Update Customer → Modify details
```

### 4. **Invoice Creation**

```
1. Create Invoice → Generate invoice
2. Get Invoice by Code → Verify creation
3. Download PDF → Test PDF generation
4. Share via WhatsApp → Test sharing
```

### 5. **Payment Processing**

```
1. Initiate Payment → Start payment flow
2. Save Card → Store payment method
3. Charge Card → Process payment
```

## 🔧 **Environment Variables**

| Variable            | Description       | Example                        |
| ------------------- | ----------------- | ------------------------------ |
| `baseUrl`           | API base URL      | `http://localhost:3000/api/v1` |
| `authToken`         | Bearer token      | `eyJhbGciOiJIUzI1NiIs...`      |
| `paystackSignature` | Webhook signature | `sha256=...`                   |
| `customerId`        | Customer ID       | `507f1f77bcf86cd799439011`     |
| `invoiceCode`       | Invoice code      | `INV-2024-001`                 |
| `invoiceId`         | Invoice ID        | `507f1f77bcf86cd799439012`     |
| `cardId`            | Card ID           | `507f1f77bcf86cd799439013`     |
| `templateId`        | Template ID       | `invoice1`                     |

## 📝 **Sample Request Bodies**

### Create Invoice

```json
{
  "customer": "customer_id_here",
  "items": [
    {
      "name": "Web Development",
      "description": "Custom website development",
      "quantity": 1,
      "unitPrice": 50000
    }
  ],
  "issueDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "paymentTerms": "Net 30 days",
  "notes": "Thank you for your business!",
  "currency": "NGN",
  "taxRate": 7.5
}
```

### Create Customer

```json
{
  "name": "ABC Company Ltd",
  "email": "contact@abccompany.com",
  "phone": "+2348023456789",
  "address": "456 Customer Street, Lagos, Nigeria",
  "companyName": "ABC Company Ltd"
}
```

### Update Entity

```json
{
  "businessName": "Updated Business Name",
  "businessType": "Technology",
  "address": "123 Business Street, Lagos, Nigeria",
  "phoneNumber": "+2348012345678",
  "website": "www.mybusiness.com"
}
```

## 🚨 **Error Handling**

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🔍 **Testing Tips**

### 1. **Use Environment Variables**

- Always use `{{variableName}}` syntax
- Update variables after successful requests
- Use the "Tests" tab to extract values from responses

### 2. **Test Scripts**

Add this to the "Tests" tab of Sign In request:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("authToken", response.data.token);
}
```

### 3. **Pre-request Scripts**

Add this to requests that need dynamic data:

```javascript
pm.environment.set("timestamp", new Date().toISOString());
```

### 4. **Collection Runner**

- Use Collection Runner for automated testing
- Set up test data in environment variables
- Run specific folders for focused testing

## 📚 **Additional Resources**

- **API Documentation**: Check the backend README.md
- **HTML PDF Templates**: See HTML_PDF_GENERATION.md
- **Subscription Plans**: See SUBSCRIPTION_RENEWAL.md
- **A4 Sizing**: See A4_SIZING_GUIDE.md

## 🆘 **Troubleshooting**

### Common Issues

1. **401 Unauthorized**

   - Check if `authToken` is set correctly
   - Verify token hasn't expired
   - Re-authenticate if needed

2. **404 Not Found**

   - Verify endpoint URL is correct
   - Check if server is running
   - Ensure base URL is correct

3. **400 Bad Request**

   - Check request body format
   - Verify required fields are included
   - Check data types match schema

4. **500 Internal Server Error**
   - Check server logs
   - Verify database connection
   - Check environment variables

### Getting Help

- Check server console for detailed error messages
- Verify all environment variables are set
- Test with minimal request bodies first
- Use the browser developer tools for additional debugging

---

**Happy Testing! 🎉**

This collection provides comprehensive coverage of all InvoiceFullStack backend endpoints with proper authentication, error handling, and documentation.

