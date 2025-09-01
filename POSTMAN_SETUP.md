# 📮 Postman Collection Setup Guide

## 🎯 **Overview**

This Postman collection provides a complete API testing environment for your Nigeria-focused Invoice Generator app, including:

- **Authentication** (Signup/Signin)
- **Subscription Plans** (Free, Basic, Premium, Enterprise)
- **Card Management** (Save, Charge, Manage)
- **Invoice Management** (Create, Share via WhatsApp)
- **Mock Server** with realistic sample responses

## 🚀 **Quick Setup**

### **1. Import Collection**

1. Open **Postman**
2. Click **Import** button
3. Upload `postman-collection.json`
4. Collection will appear in your workspace

### **2. Import Environment**

1. Click **Import** button again
2. Upload `postman-environment.json`
3. Select the environment from dropdown (top-right)
4. Update `mockUrl` variable with your mock server URL

### **3. Set Authentication Token**

After successful signup/signin:

1. Copy the `token` from response
2. Paste into `authToken` environment variable
3. All authenticated requests will now work

## 🔧 **Mock Server Setup**

### **Option 1: Postman Mock Server (Recommended)**

1. **Create Mock Server:**

   - Right-click collection → **Mock this collection**
   - Choose environment
   - Set mock server URL
   - Click **Create Mock Server**

2. **Update Environment:**
   - Copy mock server URL
   - Update `mockUrl` variable

### **Option 2: Custom Mock Server**

Use tools like:

- **JSON Server** (Node.js)
- **Mockoon** (Desktop app)
- **WireMock** (Java)
- **Your own Express.js server**

## 📋 **API Endpoints Overview**

### **🔐 Authentication**

| Method | Endpoint              | Description       |
| ------ | --------------------- | ----------------- |
| `POST` | `/api/v1/auth/signup` | User registration |
| `POST` | `/api/v1/auth/signin` | User login        |

### **💳 Subscription Plans**

| Method | Endpoint                                 | Description             |
| ------ | ---------------------------------------- | ----------------------- |
| `GET`  | `/api/v1/subscription/plans`             | Get all plans           |
| `GET`  | `/api/v1/subscription/comparison`        | Plan comparison         |
| `GET`  | `/api/v1/subscription/current`           | Current subscription    |
| `GET`  | `/api/v1/subscription/payment-readiness` | Check payment readiness |
| `POST` | `/api/v1/subscription/upgrade`           | Upgrade plan            |

### **💳 Card Management**

| Method | Endpoint                       | Description       |
| ------ | ------------------------------ | ----------------- |
| `POST` | `/api/v1/card/save/initialize` | Start card saving |
| `GET`  | `/api/v1/card/list`            | Get saved cards   |
| `POST` | `/api/v1/card/default`         | Set default card  |
| `POST` | `/api/v1/card/charge`          | Charge saved card |

### **📄 Invoice Management**

| Method | Endpoint                                   | Description            |
| ------ | ------------------------------------------ | ---------------------- |
| `POST` | `/api/v1/invoice`                          | Create invoice         |
| `POST` | `/api/v1/invoice/:code/share-whatsapp`     | Share via WhatsApp     |
| `POST` | `/api/v1/invoice/:code/share-pdf-whatsapp` | Share PDF via WhatsApp |

## 🧪 **Testing Workflow**

### **1. User Registration & Authentication**

```bash
# 1. Sign up new user
POST /api/v1/auth/signup
{
  "name": "Adejuwon Tayo Business",
  "email": "tayo@business.com",
  "password": "password123",
  "type": "freelancer",
  "phone": "+2348012345678"
}

# 2. Sign in to get token
POST /api/v1/auth/signin
{
  "email": "tayo@business.com",
  "password": "password123"
}

# 3. Copy token to environment variable
```

### **2. Subscription Plan Testing**

```bash
# 1. View available plans
GET /api/v1/subscription/plans

# 2. Check current subscription
GET /api/v1/subscription/current

# 3. Check payment readiness
GET /api/v1/subscription/payment-readiness?planName=basic

# 4. Upgrade subscription
POST /api/v1/subscription/upgrade
{
  "planName": "basic"
}
```

### **3. Card Management Testing**

```bash
# 1. Initialize card saving
POST /api/v1/card/save/initialize
{
  "callbackUrl": "https://yourapp.com/callback"
}

# 2. View saved cards
GET /api/v1/card/list

# 3. Set default card
POST /api/v1/card/default
{
  "cardId": "64f8a1b2c3d4e5f6a7b8c9d3"
}

# 4. Charge saved card
POST /api/v1/card/charge
{
  "amount": 2000,
  "description": "Subscription payment"
}
```

### **4. Invoice Testing**

```bash
# 1. Create invoice
POST /api/v1/invoice
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+2348012345678"
  },
  "items": [
    {
      "description": "Web Development",
      "quantity": 1,
      "price": 50000
    }
  ]
}

# 2. Share via WhatsApp
POST /api/v1/invoice/INV-2024-001/share-whatsapp
{
  "customerPhone": "+2348012345678"
}
```

## 🔒 **Authentication Setup**

### **Bearer Token Configuration**

The collection uses **Bearer Token** authentication:

1. **Automatic**: Set `authToken` environment variable
2. **Manual**: Add `Authorization: Bearer <token>` header

### **Token Management**

```javascript
// After successful login, copy token to environment
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Set in environment variables
authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🌍 **Environment Variables**

| Variable      | Description              | Example Value              |
| ------------- | ------------------------ | -------------------------- |
| `mockUrl`     | Mock server base URL     | `https://mock-server.com`  |
| `baseUrl`     | API base URL             | `https://api.yourapp.com`  |
| `authToken`   | JWT authentication token | `eyJhbGciOiJIUzI1NiIs...`  |
| `entityId`    | Current user's entity ID | `64f8a1b2c3d4e5f6a7b8c9d0` |
| `invoiceCode` | Sample invoice code      | `INV-2024-001`             |
| `cardId`      | Sample card ID           | `64f8a1b2c3d4e5f6a7b8c9d3` |

## 📱 **Mobile Development Testing**

### **For Your Mobile Developer:**

1. **Use Mock Server**: Perfect for development without backend
2. **Realistic Responses**: All endpoints return proper data structures
3. **Error Scenarios**: Test various response codes and error messages
4. **Authentication Flow**: Complete JWT token testing

### **Testing Scenarios:**

- ✅ **Happy Path**: All successful operations
- ❌ **Error Cases**: Invalid data, missing fields
- 🔒 **Auth Errors**: Expired tokens, unauthorized access
- 💳 **Payment Flow**: Card saving, charging, subscription upgrades

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Collection Not Importing**: Check JSON format validity
2. **Environment Not Loading**: Verify environment file structure
3. **Authentication Failing**: Ensure `authToken` is set correctly
4. **Mock Server Not Working**: Check URL and collection setup

### **Debug Steps:**

1. **Check Console**: Look for error messages
2. **Verify Variables**: Ensure environment variables are set
3. **Test Endpoints**: Try individual requests
4. **Check Headers**: Verify Content-Type and Authorization

## 📚 **Additional Resources**

- **Postman Learning Center**: https://learning.postman.com/
- **Mock Server Documentation**: https://learning.postman.com/docs/designing-and-developing-your-api/mocking-data/
- **Collection Variables**: https://learning.postman.com/docs/sending-requests/variables/
- **Environment Setup**: https://learning.postman.com/docs/sending-requests/managing-environments/

## 🎉 **Ready to Test!**

Your Postman collection is now ready with:

- ✅ **Complete API Coverage**
- ✅ **Realistic Sample Data**
- ✅ **Authentication Flow**
- ✅ **Mock Server Ready**
- ✅ **Mobile Development Ready**

Happy testing! 🚀
