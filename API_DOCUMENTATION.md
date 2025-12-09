# InvoiceFullStack API Documentation

**Base URL:** `/api/v1`

**Authentication:** Most endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Entity (Business Profile)](#2-entity-business-profile)
3. [Customers](#3-customers)
4. [Invoices](#4-invoices)
5. [Inventory](#5-inventory)
6. [Subscriptions](#6-subscriptions)
7. [Cards (Payment Methods)](#7-cards-payment-methods)
8. [Utilities](#8-utilities)
9. [Webhooks](#9-webhooks)

---

## Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (if available)"
}
```

---

## 1. Authentication

### Sign Up

Create a new business/entity account.

**Endpoint:** `POST /api/v1/auth/sign-up`

**Authentication:** None required

**Request Body:**

```json
{
  "email": "business@example.com",
  "password": "securePassword123",
  "confirm_password": "securePassword123",
  "name": "My Business Name",
  "type": "business",
  "phone": "+2348012345678",
  "first_name": "John",
  "last_name": "Doe",
  "logo": "https://example.com/logo.png",
  "address": "123 Business Street, Lagos, Nigeria"
}
```

| Field            | Type   | Required | Description                                   |
| ---------------- | ------ | -------- | --------------------------------------------- |
| email            | string | ✅       | Business email address                        |
| password         | string | ✅       | Password                                      |
| confirm_password | string | ✅       | Password confirmation                         |
| name             | string | ✅       | Business name                                 |
| type             | string | ❌       | Account type (e.g., "business", "individual") |
| phone            | string | ❌       | Phone number                                  |
| first_name       | string | ❌       | Owner's first name                            |
| last_name        | string | ❌       | Owner's last name                             |
| logo             | string | ❌       | Logo URL                                      |
| address          | string | ❌       | Business address                              |

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Successfully signed up",
  "data": {
    "entity": {
      "_id": "64abc123def456789",
      "code": "ent_abc123def456789",
      "name": "My Business Name",
      "email": "business@example.com",
      "phone": "+2348012345678",
      "type": "business",
      "businessType": "freelancer",
      "country": "NG",
      "vatRate": 7.5,
      "subscriptionStatus": "active",
      "invoicesCreated": 0,
      "customersCreated": 0,
      "teamMembersCount": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Sign In

Authenticate an existing user.

**Endpoint:** `POST /api/v1/auth/sign-in`

**Authentication:** None required

**Request Body:**

```json
{
  "email": "business@example.com",
  "password": "securePassword123"
}
```

| Field    | Type   | Required | Description              |
| -------- | ------ | -------- | ------------------------ |
| email    | string | ✅       | Registered email address |
| password | string | ✅       | Account password         |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Successfully signed in",
  "data": {
    "entity": {
      "_id": "64abc123def456789",
      "code": "ent_abc123def456789",
      "name": "My Business Name",
      "email": "business@example.com",
      "phone": "+2348012345678",
      "type": "business",
      "businessType": "freelancer",
      "country": "NG",
      "state": "Lagos",
      "city": "Ikeja",
      "vatRate": 7.5,
      "subscriptionStatus": "active",
      "subscriptionPlan": {
        "_id": "64xyz789",
        "name": "free",
        "displayName": "Free Plan",
        "maxInvoices": 10,
        "maxCustomers": 5
      },
      "invoicesCreated": 5,
      "customersCreated": 3,
      "teamMembersCount": 1,
      "logo": {
        "url": "https://cloudinary.com/logo.png",
        "public_id": "logos/abc123"
      },
      "signature": null,
      "whatsappNumber": "+2348012345678",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:20:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. Entity (Business Profile)

### Update Entity Profile

Update business profile information.

**Endpoint:** `PATCH /api/v1/entity`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "name": "Updated Business Name",
  "phone": "+2348098765432",
  "email": "newemail@example.com",
  "address": "456 New Street, Lagos",
  "whatsappNumber": "+2348012345678",
  "state": "Lagos",
  "city": "Victoria Island",
  "country": "NG",
  "businessType": "digital_marketing"
}
```

| Field          | Type   | Required | Description                                                                                                                                                                                                                    |
| -------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| name           | string | ❌       | Business name                                                                                                                                                                                                                  |
| phone          | string | ❌       | Phone number                                                                                                                                                                                                                   |
| email          | string | ❌       | Email address                                                                                                                                                                                                                  |
| address        | string | ❌       | Business address                                                                                                                                                                                                               |
| whatsappNumber | string | ❌       | WhatsApp number for sharing                                                                                                                                                                                                    |
| state          | string | ❌       | State                                                                                                                                                                                                                          |
| city           | string | ❌       | City                                                                                                                                                                                                                           |
| country        | string | ❌       | Country code                                                                                                                                                                                                                   |
| businessType   | string | ❌       | One of: freelancer, tailor, salon, caterer, mechanic, contractor, digital_marketing, creative_agency, it_consultant, ngo, church, restaurant, retail_shop, transport, healthcare, education, real_estate, manufacturing, other |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": {
    "_id": "64abc123def456789",
    "name": "Updated Business Name",
    "email": "newemail@example.com",
    "businessType": "digital_marketing",
    ...
  }
}
```

---

### Add Bank Account

Link a bank account for receiving payments.

**Endpoint:** `POST /api/v1/entity/add-bank`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "accountNumber": "0123456789",
  "bankCode": "058",
  "isActive": true
}
```

| Field         | Type    | Required | Description                                     |
| ------------- | ------- | -------- | ----------------------------------------------- |
| accountNumber | string  | ✅       | 10-digit NUBAN account number                   |
| bankCode      | string  | ✅       | Bank code (use `/utils/get-banks` to get codes) |
| isActive      | boolean | ✅       | Whether this is the active bank for payments    |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": {
    "_id": "64bank123",
    "accountNumber": "0123456789",
    "accountName": "JOHN DOE",
    "bankCode": "058",
    "bankName": "Guaranty Trust Bank",
    "isActive": true,
    "entity": "64abc123def456789"
  }
}
```

---

### Get Bank Accounts

Get all linked bank accounts.

**Endpoint:** `GET /api/v1/entity/get-banks`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": [
    {
      "_id": "64bank123",
      "accountNumber": "0123456789",
      "accountName": "JOHN DOE",
      "bankCode": "058",
      "bankName": "Guaranty Trust Bank",
      "isActive": true,
      "entity": "64abc123def456789"
    }
  ]
}
```

---

### Add Logo

Upload a business logo.

**Endpoint:** `POST /api/v1/entity/add-logo`

**Authentication:** ✅ Required

**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| logo | file | ✅ | Image file (JPEG, PNG) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": {
    "logo": {
      "url": "https://res.cloudinary.com/.../logo.png",
      "public_id": "invoices/logos/abc123"
    }
  }
}
```

---

### Remove Logo

Remove the business logo.

**Endpoint:** `DELETE /api/v1/entity/remove-logo`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logo removed successfully",
  "data": {}
}
```

---

### Add Signature

Upload a signature for invoices.

**Endpoint:** `POST /api/v1/entity/add-signature`

**Authentication:** ✅ Required

**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| signature | file | ✅ | Image file (JPEG, PNG) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": {
    "signature": {
      "url": "https://res.cloudinary.com/.../signature.png",
      "public_id": "invoices/signatures/abc123"
    }
  }
}
```

---

### Remove Signature

Remove the signature.

**Endpoint:** `DELETE /api/v1/entity/remove-signature`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Signature removed successfully",
  "data": {}
}
```

---

### Add Team Member

Add a team member to the entity.

**Endpoint:** `POST /api/v1/entity/add-member`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "type": "staff"
}
```

| Field      | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| first_name | string | ✅       | Member's first name         |
| last_name  | string | ✅       | Member's last name          |
| email      | string | ✅       | Member's email address      |
| type       | string | ✅       | Member type (e.g., "staff") |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": {
    "_id": "64member123",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "type": "staff",
    "parent_id": "64abc123def456789"
  }
}
```

---

## 3. Customers

### Create Customer

Add a new customer.

**Endpoint:** `POST /api/v1/customer`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "+2348012345678",
  "address": "123 Customer Street, Lagos",
  "companyName": "Customer Company Ltd"
}
```

| Field       | Type   | Required | Description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| name        | string | ✅       | Customer name (2-100 chars)         |
| email       | string | ❌       | Valid email address                 |
| phone       | string | ❌       | Phone number (international format) |
| address     | string | ❌       | Customer address (max 500 chars)    |
| companyName | string | ❌       | Company name (max 100 chars)        |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "64customer123",
    "code": "cus_abc123def456789",
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "+2348012345678",
    "address": "123 Customer Street, Lagos",
    "companyName": "Customer Company Ltd",
    "entity": "64abc123def456789",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get All Customers

Retrieve all customers for the authenticated entity.

**Endpoint:** `GET /api/v1/customer`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| search | string | Search by name, email, or phone |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "_id": "64customer123",
        "code": "cus_abc123def456789",
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "+2348012345678",
        "address": "123 Customer Street, Lagos",
        "companyName": "Customer Company Ltd",
        "entity": "64abc123def456789",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

---

### Get Customer by ID

Retrieve a single customer.

**Endpoint:** `GET /api/v1/customer/:id`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Customer ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "64customer123",
    "code": "cus_abc123def456789",
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "+2348012345678",
    "address": "123 Customer Street, Lagos",
    "companyName": "Customer Company Ltd",
    "entity": "64abc123def456789",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update Customer

Update customer information.

**Endpoint:** `PUT /api/v1/customer/:id`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Customer ID |

**Request Body:**

```json
{
  "name": "Updated Customer Name",
  "email": "newemail@example.com",
  "phone": "+2348098765432",
  "address": "456 New Address, Lagos",
  "companyName": "New Company Name"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "64customer123",
    "code": "cus_abc123def456789",
    "name": "Updated Customer Name",
    "email": "newemail@example.com",
    ...
  }
}
```

---

### Delete Customer

Delete a customer.

**Endpoint:** `DELETE /api/v1/customer/:id`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Customer ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Customer deleted successfully"
  }
}
```

---

## 4. Invoices

### Create Invoice

Create a new invoice.

**Endpoint:** `POST /api/v1/invoice`

**Authentication:** ✅ Required

**Request Body (with existing customer):**

```json
{
  "customer_id": "64customer123",
  "currency": "NGN",
  "items": [
    {
      "name": "Web Development",
      "description": "Full website development",
      "quantity": 1,
      "unitPrice": 500000
    },
    {
      "name": "Logo Design",
      "description": "Company logo design",
      "quantity": 2,
      "unitPrice": 50000
    }
  ],
  "issueDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "status": "draft",
  "notes": "Thank you for your business!",
  "terms": "Payment due within 30 days",
  "subtotal": 600000,
  "tax": 45000,
  "template": "invoice1"
}
```

**Request Body (with new customer):**

```json
{
  "customer": {
    "name": "New Customer",
    "email": "newcustomer@example.com",
    "phone": "+2348012345678",
    "address": "123 Street, Lagos",
    "companyName": "Customer Co."
  },
  "currency": "NGN",
  "items": [
    {
      "name": "Consulting",
      "description": "Business consulting services",
      "quantity": 5,
      "unitPrice": 100000
    }
  ],
  "issueDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "status": "draft",
  "subtotal": 500000,
  "tax": 37500,
  "template": "invoice2"
}
```

| Field                | Type   | Required | Description                                                 |
| -------------------- | ------ | -------- | ----------------------------------------------------------- |
| customer_id          | string | ✅\*     | Existing customer ID (\*use either customer_id OR customer) |
| customer             | object | ✅\*     | New customer object (\*use either customer_id OR customer)  |
| customer.name        | string | ✅       | Customer name                                               |
| customer.email       | string | ❌       | Customer email                                              |
| customer.phone       | string | ❌       | Customer phone                                              |
| customer.address     | string | ❌       | Customer address                                            |
| customer.companyName | string | ❌       | Customer company name                                       |
| currency             | string | ❌       | Currency: USD, EUR, GBP, NGN (default: NGN)                 |
| items                | array  | ✅       | Array of invoice items                                      |
| items[].name         | string | ✅       | Item name                                                   |
| items[].description  | string | ✅       | Item description                                            |
| items[].quantity     | number | ✅       | Quantity (min: 1)                                           |
| items[].unitPrice    | number | ✅       | Unit price (min: 0)                                         |
| issueDate            | date   | ✅       | Invoice issue date                                          |
| dueDate              | date   | ❌       | Payment due date                                            |
| status               | string | ❌       | Status: draft, sent, paid, overdue (default: draft)         |
| notes                | string | ❌       | Invoice notes                                               |
| terms                | string | ❌       | Payment terms                                               |
| subtotal             | number | ✅       | Subtotal amount                                             |
| tax                  | number | ❌       | Tax amount (default: 0)                                     |
| template             | string | ❌       | Template: pdf0-3, invoice1-3 (default: pdf0)                |

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "64invoice123",
    "invoiceNumber": "inv_abc123def456789012",
    "currency": "NGN",
    "customer": {
      "_id": "64customer123",
      "name": "New Customer",
      "email": "newcustomer@example.com"
    },
    "entity": "64abc123def456789",
    "items": [
      {
        "name": "Consulting",
        "description": "Business consulting services",
        "quantity": 5,
        "unitPrice": 100000,
        "total": 500000
      }
    ],
    "issueDate": "2024-01-15T00:00:00.000Z",
    "dueDate": "2024-02-15T00:00:00.000Z",
    "status": "draft",
    "paymentStatus": "unpaid",
    "notes": "",
    "terms": "",
    "subtotal": 500000,
    "tax": 37500,
    "taxRate": 7.5,
    "total": 537500,
    "country": "NG",
    "paymentGateway": "paystack",
    "template": "invoice2",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get All Invoices

Retrieve all invoices for the authenticated entity.

**Endpoint:** `GET /api/v1/invoice`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| status | string | Filter by status (draft, sent, published) |
| paymentStatus | string | Filter by payment status (unpaid, paid, overdue, partially-paid) |
| startDate | date | Filter by issue date from |
| endDate | date | Filter by issue date to |
| search | string | Search by invoice number or customer name |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "_id": "64invoice123",
        "invoiceNumber": "inv_abc123def456789012",
        "currency": "NGN",
        "customer": {
          "_id": "64customer123",
          "name": "Customer Name",
          "email": "customer@example.com"
        },
        "items": [...],
        "issueDate": "2024-01-15T00:00:00.000Z",
        "dueDate": "2024-02-15T00:00:00.000Z",
        "status": "published",
        "paymentStatus": "unpaid",
        "subtotal": 500000,
        "tax": 37500,
        "total": 537500,
        "template": "invoice1"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### Get Invoice by Code

Retrieve a single invoice by invoice number.

**Endpoint:** `GET /api/v1/invoice/:code`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Invoice number (e.g., inv_abc123def456789012) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "64invoice123",
    "invoiceNumber": "inv_abc123def456789012",
    "currency": "NGN",
    "customer": {
      "_id": "64customer123",
      "code": "cus_abc123",
      "name": "Customer Name",
      "email": "customer@example.com",
      "phone": "+2348012345678",
      "address": "123 Street, Lagos"
    },
    "entity": {
      "_id": "64abc123def456789",
      "name": "My Business",
      "email": "business@example.com",
      "phone": "+2348012345678",
      "address": "456 Business Ave, Lagos",
      "logo": {
        "url": "https://cloudinary.com/logo.png"
      },
      "signature": {
        "url": "https://cloudinary.com/signature.png"
      }
    },
    "items": [
      {
        "name": "Web Development",
        "description": "Full website development",
        "quantity": 1,
        "unitPrice": 500000,
        "total": 500000
      }
    ],
    "issueDate": "2024-01-15T00:00:00.000Z",
    "dueDate": "2024-02-15T00:00:00.000Z",
    "status": "published",
    "paymentStatus": "unpaid",
    "notes": "Thank you for your business!",
    "terms": "Payment due within 30 days",
    "subtotal": 500000,
    "tax": 37500,
    "taxRate": 7.5,
    "total": 537500,
    "paymentLink": "https://paystack.com/pay/abc123",
    "template": "invoice1",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update Invoice

Update an existing invoice.

**Endpoint:** `PUT /api/v1/invoice/:invoiceId`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| invoiceId | string | Invoice number (code) |

**Request Body:**

```json
{
  "status": "published",
  "items": [
    {
      "name": "Updated Item",
      "description": "Updated description",
      "quantity": 2,
      "unitPrice": 250000,
      "total": 500000
    }
  ],
  "dueDate": "2024-03-01",
  "notes": "Updated notes",
  "subtotal": 500000,
  "tax": 37500,
  "total": 537500,
  "template": "invoice2"
}
```

| Field      | Type   | Required | Description                                   |
| ---------- | ------ | -------- | --------------------------------------------- |
| customerId | string | ❌       | Customer ID                                   |
| currency   | string | ❌       | Currency code                                 |
| items      | array  | ❌       | Updated items array                           |
| issueDate  | date   | ❌       | Issue date                                    |
| dueDate    | date   | ❌       | Due date                                      |
| status     | string | ❌       | Status: draft, sent, paid, overdue, published |
| notes      | string | ❌       | Invoice notes                                 |
| terms      | string | ❌       | Payment terms                                 |
| subtotal   | number | ❌       | Subtotal                                      |
| tax        | number | ❌       | Tax amount                                    |
| total      | number | ❌       | Total amount                                  |
| template   | string | ❌       | PDF template                                  |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "64invoice123",
    "invoiceNumber": "inv_abc123def456789012",
    "status": "published",
    ...
  }
}
```

---

### Delete Invoice

Delete an invoice.

**Endpoint:** `DELETE /api/v1/invoice/:invoiceId`

**Authentication:** Not Required (consider adding)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| invoiceId | string | Invoice ID |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Invoice deleted successfully"
  }
}
```

---

### Download Invoice PDF

Download invoice as PDF.

**Endpoint:** `GET /api/v1/invoice/:code/pdf`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Invoice number |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| preview | boolean | If true, displays inline; if false, forces download |
| template | string | Template to use: invoice1, invoice2, invoice3, pdf0-3 |

**Response:** PDF file (application/pdf)

---

### Download Invoice (HTML Template)

Download invoice using HTML templates.

**Endpoint:** `GET /api/v1/invoice/:code/html-pdf`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Invoice number |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| preview | boolean | If true, displays inline; if false, forces download |
| template | string | Template: invoice1, invoice2, invoice3 (default: invoice2) |

**Response:** PDF file (application/pdf)

---

### Get Available Templates

Get list of available invoice templates.

**Endpoint:** `GET /api/v1/invoice/templates`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "invoice1",
        "name": "Classic",
        "description": "Clean and professional design with modern blue theme and diagonal corner",
        "preview": "/invoice/templates/invoice1/preview",
        "features": [
          "Professional layout",
          "Modern blue theme",
          "Diagonal corner design",
          "Company info box",
          "Clickable payment links"
        ]
      },
      {
        "id": "invoice2",
        "name": "Modern",
        "description": "Contemporary design with red accents and flex layout",
        "preview": "/invoice/templates/invoice2/preview",
        "features": [
          "Modern flex layout",
          "Red color scheme",
          "Company branding",
          "Clickable payment links"
        ]
      },
      {
        "id": "invoice3",
        "name": "Contemporary",
        "description": "Clean design with orange accents and modern typography",
        "preview": "/invoice/templates/invoice3/preview",
        "features": [
          "Contemporary design",
          "Orange accents",
          "Clean typography",
          "Clickable payment links"
        ]
      },
      {
        "id": "invoice4",
        "name": "Modern Teal",
        "description": "Professional design with dark teal/blue, white, and yellow/gold color scheme",
        "preview": "/invoice/templates/invoice4/preview",
        "features": [
          "Modern teal color scheme",
          "Professional layout",
          "Curved decorative elements",
          "Clean typography",
          "Clickable payment links"
        ]
      }
    ]
  }
}
```

---

### Preview Template

Generate a preview PDF for a template.

**Endpoint:** `GET /api/v1/invoice/templates/:templateId/preview`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| templateId | string | Template ID (invoice1, invoice2, invoice3, invoice4) |

**Response:** PDF file (application/pdf)

---

### Get Dashboard Summary

Get dashboard statistics.

**Endpoint:** `GET /api/v1/invoice/dashboard`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalInvoices": 50,
    "totalRevenue": 5000000,
    "paidInvoices": 35,
    "unpaidInvoices": 10,
    "overdueInvoices": 5,
    "totalCustomers": 25,
    "recentInvoices": [...],
    "monthlyRevenue": [
      { "month": "Jan", "revenue": 500000 },
      { "month": "Feb", "revenue": 750000 }
    ]
  }
}
```

---

### Get Invoice Analytics

Get detailed invoice analytics.

**Endpoint:** `GET /api/v1/invoice/analytics`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | date | Start date for analytics period |
| endDate | date | End date for analytics period |
| groupBy | string | Group by: day, week, month, year |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalInvoices": 100,
      "totalAmount": 10000000,
      "paidAmount": 7500000,
      "pendingAmount": 2500000,
      "averageInvoiceValue": 100000
    },
    "byStatus": {
      "draft": 10,
      "published": 50,
      "sent": 40
    },
    "byPaymentStatus": {
      "paid": 60,
      "unpaid": 30,
      "overdue": 10
    },
    "trend": [...]
  }
}
```

---

### Initiate Payment

Redirect to payment page for an invoice.

**Endpoint:** `GET /api/v1/invoice/:code/initiate-payment`

**Authentication:** Not Required (public link)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Invoice number |

**Response:** Redirects to Paystack payment page

---

### Share via WhatsApp

Share invoice link via WhatsApp.

**Endpoint:** `POST /api/v1/invoice/:code/share-whatsapp`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Invoice number |

**Request Body:**

```json
{
  "customerPhone": "+2348012345678"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Invoice shared successfully via WhatsApp",
    "whatsappUrl": "https://wa.me/2348012345678?text=...",
    "messageId": "termii_msg_123"
  }
}
```

---

### Share PDF via WhatsApp

Share PDF invoice via WhatsApp.

**Endpoint:** `POST /api/v1/invoice/:code/share-pdf-whatsapp`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| code | string | Invoice number |

**Request Body:**

```json
{
  "customerPhone": "+2348012345678",
  "pdfUrl": "https://example.com/invoice.pdf"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "PDF invoice shared successfully via WhatsApp"
  }
}
```

---

## 5. Inventory

### Create Inventory Item

Add a new inventory item.

**Endpoint:** `POST /api/v1/inventory`

**Authentication:** ✅ Required

**Content-Type:** `multipart/form-data` (if uploading image) or `application/json`

**Request Body:**

```json
{
  "name": "Product Name",
  "description": "Product description",
  "tags": ["category1", "category2"],
  "amount": 25000
}
```

| Field       | Type         | Required | Description                         |
| ----------- | ------------ | -------- | ----------------------------------- |
| name        | string       | ✅       | Item name                           |
| description | string       | ❌       | Item description                    |
| tags        | string/array | ❌       | Category tags                       |
| amount      | number       | ✅       | Price (min: 0)                      |
| image       | file         | ❌       | Product image (multipart/form-data) |

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Inventory item created successfully",
  "data": {
    "_id": "64inventory123",
    "name": "Product Name",
    "description": "Product description",
    "tags": ["category1", "category2"],
    "amount": 25000,
    "image": {
      "url": "https://cloudinary.com/product.png",
      "public_id": "inventory/abc123"
    },
    "entity": "64abc123def456789",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get All Inventory Items

Retrieve all inventory items.

**Endpoint:** `GET /api/v1/inventory`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| search | string | Search by name or description |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Inventories retrieved successfully",
  "data": {
    "inventories": [
      {
        "_id": "64inventory123",
        "name": "Product Name",
        "description": "Product description",
        "tags": ["category1"],
        "amount": 25000,
        "image": {
          "url": "https://cloudinary.com/product.png"
        },
        "entity": "64abc123def456789"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### Get Inventory Item by ID

Retrieve a single inventory item.

**Endpoint:** `GET /api/v1/inventory/:inventoryId`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| inventoryId | string | Inventory item ID |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Inventory retrieved successfully",
  "data": {
    "_id": "64inventory123",
    "name": "Product Name",
    "description": "Product description",
    "tags": ["category1", "category2"],
    "amount": 25000,
    "image": {
      "url": "https://cloudinary.com/product.png",
      "public_id": "inventory/abc123"
    },
    "entity": "64abc123def456789",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update Inventory Item

Update an inventory item.

**Endpoint:** `PATCH /api/v1/inventory/:inventoryId`

**Authentication:** ✅ Required

**Content-Type:** `multipart/form-data` (if uploading image) or `application/json`

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| inventoryId | string | Inventory item ID |

**Request Body:**

```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "tags": ["newcategory"],
  "amount": 30000
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Inventory updated successfully",
  "data": {
    "_id": "64inventory123",
    "name": "Updated Product Name",
    ...
  }
}
```

---

### Delete Inventory Item

Delete an inventory item.

**Endpoint:** `DELETE /api/v1/inventory/:inventoryId`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| inventoryId | string | Inventory item ID |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Inventory deleted successfully",
  "data": {}
}
```

---

## 6. Subscriptions

### Get Available Plans (Public)

Get all available subscription plans.

**Endpoint:** `GET /api/v1/subscription/plans`

**Authentication:** Not Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "64plan_free",
      "name": "free",
      "displayName": "Free Plan",
      "price": 0,
      "currency": "NGN",
      "billingCycle": "monthly",
      "maxInvoices": 10,
      "maxCustomers": 5,
      "maxTeamMembers": 1,
      "features": {
        "whatsappSharing": true,
        "pdfExport": true,
        "onlinePayments": false,
        "analytics": false,
        "recurringInvoices": false,
        "taxReports": false,
        "whiteLabel": false,
        "apiAccess": false
      },
      "nigerianVAT": true,
      "multiCurrency": false,
      "businessTypes": true,
      "isActive": true,
      "isPopular": false,
      "description": "Perfect for getting started",
      "benefits": [
        "10 invoices per month",
        "5 customers",
        "WhatsApp sharing",
        "PDF export"
      ]
    },
    {
      "_id": "64plan_basic",
      "name": "basic",
      "displayName": "Basic Plan",
      "price": 2000,
      "currency": "NGN",
      "billingCycle": "monthly",
      "maxInvoices": -1,
      "maxCustomers": -1,
      "maxTeamMembers": 2,
      "features": {
        "whatsappSharing": true,
        "pdfExport": true,
        "onlinePayments": true,
        "analytics": true,
        "recurringInvoices": false,
        "taxReports": false,
        "whiteLabel": false,
        "apiAccess": false
      },
      "isPopular": true
    },
    {
      "_id": "64plan_premium",
      "name": "premium",
      "displayName": "Premium Plan",
      "price": 3500,
      "currency": "NGN",
      ...
    },
    {
      "_id": "64plan_enterprise",
      "name": "enterprise",
      "displayName": "Enterprise Plan",
      "price": 5000,
      "currency": "NGN",
      ...
    }
  ]
}
```

---

### Get Plan Comparison (Public)

Get subscription plan comparison for pricing page.

**Endpoint:** `GET /api/v1/subscription/comparison`

**Authentication:** Not Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "plans": [...],
    "features": [
      {
        "name": "Max Invoices",
        "free": "10",
        "basic": "Unlimited",
        "premium": "Unlimited",
        "enterprise": "Unlimited"
      },
      {
        "name": "Online Payments",
        "free": false,
        "basic": true,
        "premium": true,
        "enterprise": true
      }
    ]
  }
}
```

---

### Get Current Subscription

Get the authenticated entity's current subscription.

**Endpoint:** `GET /api/v1/subscription/current`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "plan": {
      "_id": "64plan_basic",
      "name": "basic",
      "displayName": "Basic Plan",
      "price": 2000,
      "currency": "NGN",
      "maxInvoices": -1,
      "maxCustomers": -1,
      "features": {...}
    },
    "status": "active",
    "startDate": "2024-01-01T00:00:00.000Z",
    "expiryDate": "2024-02-01T00:00:00.000Z",
    "usage": {
      "invoicesCreated": 25,
      "customersCreated": 15,
      "teamMembersCount": 1
    },
    "limits": {
      "invoicesRemaining": -1,
      "customersRemaining": -1,
      "teamMembersRemaining": 1
    }
  }
}
```

---

### Check Subscription Limits

Check current usage against subscription limits.

**Endpoint:** `GET /api/v1/subscription/limits`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "currentPlan": "basic",
    "planDetails": {
      "name": "basic",
      "maxInvoices": -1,
      "maxCustomers": -1,
      "maxTeamMembers": 2
    },
    "usage": {
      "invoicesCreated": 25,
      "customersCreated": 15,
      "teamMembersCount": 1
    },
    "limits": {
      "invoicesRemaining": -1,
      "customersRemaining": -1,
      "teamMembersRemaining": 1
    },
    "canCreateInvoice": true,
    "canCreateCustomer": true
  }
}
```

---

### Check Feature Access

Check if a specific feature is accessible.

**Endpoint:** `GET /api/v1/subscription/feature/:feature`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| feature | string | Feature name (e.g., analytics, onlinePayments, recurringInvoices) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "feature": "analytics",
    "canAccess": true,
    "message": "Feature accessible"
  }
}
```

---

### Check Payment Readiness

Check if user can upgrade subscription (has saved cards).

**Endpoint:** `GET /api/v1/subscription/payment-readiness`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| planName | string | Target plan name (required) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "planName": "premium",
    "planPrice": 3500,
    "planCurrency": "NGN",
    "hasSavedCards": true,
    "defaultCard": {
      "_id": "64card123",
      "cardType": "visa",
      "last4": "1234",
      "bank": "GTBank"
    },
    "canUpgrade": true,
    "message": "Ready to upgrade with saved card"
  }
}
```

---

### Upgrade Subscription

Upgrade to a higher plan.

**Endpoint:** `POST /api/v1/subscription/upgrade`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "planName": "premium",
  "cardId": "64card123"
}
```

| Field    | Type   | Required | Description                                            |
| -------- | ------ | -------- | ------------------------------------------------------ |
| planName | string | ✅       | Target plan: basic, premium, enterprise                |
| cardId   | string | ❌       | Specific card to charge (uses default if not provided) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Subscription upgraded successfully",
    "subscription": {
      "plan": "premium",
      "status": "active",
      "expiryDate": "2024-02-15T00:00:00.000Z"
    },
    "payment": {
      "amount": 3500,
      "currency": "NGN",
      "reference": "sub_upgrade_abc123"
    }
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Payment failed. Please try again.",
  "payment": {
    "status": "failed",
    "reference": "sub_upgrade_abc123"
  }
}
```

---

### Downgrade Subscription

Downgrade to a lower plan.

**Endpoint:** `POST /api/v1/subscription/downgrade`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "planName": "basic"
}
```

| Field    | Type   | Required | Description                       |
| -------- | ------ | -------- | --------------------------------- |
| planName | string | ✅       | Target plan: free, basic, premium |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Subscription downgraded successfully",
    "subscription": "basic",
    "status": "active"
  }
}
```

---

### Renew Subscription

Manually renew subscription.

**Endpoint:** `POST /api/v1/subscription/renew`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "cardId": "64card123"
}
```

| Field  | Type   | Required | Description                                         |
| ------ | ------ | -------- | --------------------------------------------------- |
| cardId | string | ❌       | Specific card to use (uses default if not provided) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Subscription renewed successfully",
    "newExpiryDate": "2024-03-15T00:00:00.000Z",
    "payment": {
      "amount": 3500,
      "reference": "sub_renew_abc123"
    }
  }
}
```

---

### Get Subscriptions Needing Renewal (Admin)

Get list of subscriptions expiring soon.

**Endpoint:** `GET /api/v1/subscription/renewal-status`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| daysAhead | number | Days ahead to check (default: 7) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Subscriptions needing renewal retrieved",
    "count": 5,
    "entities": [
      {
        "_id": "64entity123",
        "name": "Business Name",
        "email": "business@example.com",
        "subscriptionExpiry": "2024-01-20T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Process Automatic Renewals (Admin/Cron)

Process automatic renewals for expiring subscriptions.

**Endpoint:** `POST /api/v1/subscription/process-renewals`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| daysAhead | number | Days ahead to process (default: 7) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Automatic renewals processed",
    "results": {
      "processed": 5,
      "successful": 4,
      "failed": 1,
      "details": [...]
    }
  }
}
```

---

## 7. Cards (Payment Methods)

### Initialize Card Save

Start the process of saving a new card.

**Endpoint:** `POST /api/v1/card/save/initialize`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "callbackUrl": "https://yourapp.com/callback"
}
```

| Field       | Type   | Required | Description                                                      |
| ----------- | ------ | -------- | ---------------------------------------------------------------- |
| callbackUrl | string | ❌       | URL to redirect after payment (uses env default if not provided) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/abc123",
    "access_code": "abc123xyz",
    "reference": "card_save_ref_123"
  }
}
```

---

### Save Card (Manual/Fallback)

Manually verify and save a card after payment.

**Endpoint:** `POST /api/v1/card/save/verify`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "reference": "card_save_ref_123"
}
```

| Field     | Type   | Required | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| reference | string | ✅       | Payment reference from initialization |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Card saved successfully",
    "card": {
      "_id": "64card123",
      "cardType": "visa",
      "last4": "1234",
      "expMonth": "12",
      "expYear": "2026",
      "bank": "GTBank",
      "brand": "Visa",
      "isDefault": true
    }
  }
}
```

---

### Get All Cards

Get all saved cards.

**Endpoint:** `GET /api/v1/card/list`

**Authentication:** ✅ Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "_id": "64card123",
        "cardType": "visa",
        "last4": "1234",
        "expMonth": "12",
        "expYear": "2026",
        "bank": "GTBank",
        "brand": "Visa",
        "countryCode": "NG",
        "isDefault": true,
        "isActive": true,
        "cardName": "My Visa Card",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "64card456",
        "cardType": "mastercard",
        "last4": "5678",
        "expMonth": "06",
        "expYear": "2025",
        "bank": "Access Bank",
        "brand": "Mastercard",
        "isDefault": false,
        "isActive": true
      }
    ],
    "defaultCard": {
      "_id": "64card123",
      "cardType": "visa",
      "last4": "1234"
    }
  }
}
```

---

### Set Default Card

Set a card as the default payment method.

**Endpoint:** `POST /api/v1/card/default`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "cardId": "64card456"
}
```

| Field  | Type   | Required | Description               |
| ------ | ------ | -------- | ------------------------- |
| cardId | string | ✅       | Card ID to set as default |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Default card updated successfully",
    "card": {
      "_id": "64card456",
      "cardType": "mastercard",
      "last4": "5678",
      "isDefault": true
    }
  }
}
```

---

### Remove Card

Delete a saved card.

**Endpoint:** `DELETE /api/v1/card/:cardId`

**Authentication:** ✅ Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| cardId | string | Card ID to delete |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Card removed successfully"
  }
}
```

---

### Charge Card

Charge a saved card.

**Endpoint:** `POST /api/v1/card/charge`

**Authentication:** ✅ Required

**Request Body:**

```json
{
  "amount": 5000,
  "description": "Subscription payment",
  "cardId": "64card123"
}
```

| Field       | Type   | Required | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| amount      | number | ✅       | Amount to charge (in kobo for NGN)           |
| description | string | ✅       | Payment description                          |
| cardId      | string | ❌       | Specific card (uses default if not provided) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Card charged successfully",
    "reference": "charge_ref_123",
    "amount": 5000
  }
}
```

---

### Check Card Status

Check if a card was saved via webhook.

**Endpoint:** `GET /api/v1/card/status`

**Authentication:** ✅ Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| reference | string | Payment reference to check |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Card was saved successfully via webhook",
    "card": {
      "_id": "64card123",
      "cardType": "visa",
      "last4": "1234"
    }
  }
}
```

---

## 8. Utilities

### List Banks

Get list of all Nigerian banks.

**Endpoint:** `GET /api/v1/utils/get-banks`

**Authentication:** Not Required

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": [
    {
      "id": 1,
      "name": "Access Bank",
      "slug": "access-bank",
      "code": "044",
      "longcode": "044150149",
      "gateway": null,
      "pay_with_bank": false,
      "active": true,
      "country": "Nigeria",
      "currency": "NGN",
      "type": "nuban"
    },
    {
      "id": 2,
      "name": "Guaranty Trust Bank",
      "slug": "guaranty-trust-bank",
      "code": "058",
      "longcode": "058152036",
      "gateway": null,
      "pay_with_bank": false,
      "active": true,
      "country": "Nigeria",
      "currency": "NGN",
      "type": "nuban"
    }
  ]
}
```

---

### Verify Bank Account

Verify a bank account number and get account name.

**Endpoint:** `POST /api/v1/utils/resolve-bank`

**Authentication:** Not Required

**Request Body:**

```json
{
  "accountNumber": "0123456789",
  "bankCode": "058"
}
```

| Field         | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| accountNumber | string | ✅       | 10-digit NUBAN account number   |
| bankCode      | string | ✅       | Bank code from /utils/get-banks |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Operation Successful",
  "data": {
    "account_number": "0123456789",
    "account_name": "JOHN DOE",
    "bank_id": 9
  }
}
```

---

## 9. Webhooks

### Paystack Webhook

Receive payment notifications from Paystack.

**Endpoint:** `POST /api/v1/webhook`

**Authentication:** Verified via `x-paystack-signature` header

**Headers:**
| Header | Description |
|--------|-------------|
| x-paystack-signature | HMAC SHA512 signature from Paystack |

**Request Body:** Paystack event payload

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {}
}
```

---

### Callback Webhook

Handle payment callback redirects.

**Endpoint:** `GET /api/v1/webhook/callback`

**Authentication:** Not Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| reference | string | Payment reference |
| trxref | string | Transaction reference |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "status": "success",
    "reference": "payment_ref_123"
  }
}
```

---

## Data Types Reference

### Entity Object

```json
{
  "_id": "ObjectId",
  "code": "string (ent_xxxxx)",
  "parent_id": "string | null",
  "name": "string",
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone": "string",
  "type": "string",
  "businessType": "string (enum)",
  "country": "string (NG)",
  "state": "string",
  "city": "string",
  "vatRate": "number (default: 7.5)",
  "whatsappNumber": "string",
  "preferredPaymentGateway": "string (paystack)",
  "subscriptionPlan": "ObjectId (ref: SubscriptionPlan)",
  "subscriptionStatus": "string (active|inactive|cancelled|expired)",
  "subscriptionExpiry": "Date",
  "subscriptionStartDate": "Date",
  "invoicesCreated": "number",
  "customersCreated": "number",
  "teamMembersCount": "number",
  "logo": "object {url, public_id}",
  "signature": "object {url, public_id}",
  "address": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Invoice Object

```json
{
  "_id": "ObjectId",
  "invoiceNumber": "string (inv_xxxxx)",
  "currency": "string (NGN|USD)",
  "customer": "ObjectId (ref: Customer)",
  "entity": "ObjectId (ref: Entity)",
  "items": "array of Item objects",
  "issueDate": "Date",
  "dueDate": "Date",
  "status": "string (draft|sent|published)",
  "paymentStatus": "string (unpaid|paid|overdue|partially-paid)",
  "notes": "string",
  "terms": "string",
  "subtotal": "number",
  "tax": "number",
  "taxRate": "number (default: 7.5)",
  "total": "number",
  "country": "string (NG)",
  "paymentGateway": "string (paystack)",
  "whatsappShared": "boolean",
  "whatsappShareDate": "Date",
  "paymentLink": "string",
  "termiiMessageId": "string",
  "template": "string (invoice1|invoice2|invoice3|invoice4|pdf0-3)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Item Object

```json
{
  "name": "string",
  "description": "string",
  "unitPrice": "number",
  "quantity": "number (default: 1)",
  "total": "number (unitPrice * quantity)"
}
```

### Customer Object

```json
{
  "_id": "ObjectId",
  "code": "string (cus_xxxxx)",
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "companyName": "string",
  "entity": "ObjectId (ref: Entity)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Inventory Object

```json
{
  "_id": "ObjectId",
  "name": "string",
  "description": "string",
  "tags": "array of strings",
  "amount": "number",
  "image": "object {url, public_id}",
  "entity": "ObjectId (ref: Entity)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Card Object

```json
{
  "_id": "ObjectId",
  "entity": "ObjectId (ref: Entity)",
  "authorizationCode": "string",
  "cardType": "string (visa|mastercard|verve|american_express)",
  "last4": "string",
  "expMonth": "string",
  "expYear": "string",
  "bank": "string",
  "countryCode": "string (default: NG)",
  "brand": "string",
  "isDefault": "boolean",
  "isActive": "boolean",
  "cardName": "string (default: My Card)",
  "description": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Subscription Plan Object

```json
{
  "_id": "ObjectId",
  "name": "string (free|basic|premium|enterprise)",
  "displayName": "string",
  "price": "number",
  "currency": "string (NGN|USD)",
  "billingCycle": "string (monthly|yearly)",
  "maxInvoices": "number (-1 for unlimited)",
  "maxCustomers": "number (-1 for unlimited)",
  "maxTeamMembers": "number (-1 for unlimited)",
  "features": {
    "whatsappSharing": "boolean",
    "pdfExport": "boolean",
    "onlinePayments": "boolean",
    "analytics": "boolean",
    "recurringInvoices": "boolean",
    "taxReports": "boolean",
    "whiteLabel": "boolean",
    "apiAccess": "boolean"
  },
  "nigerianVAT": "boolean",
  "multiCurrency": "boolean",
  "businessTypes": "boolean",
  "isActive": "boolean",
  "isPopular": "boolean",
  "description": "string",
  "benefits": "array of strings",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## HTTP Status Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 200  | OK - Request successful                 |
| 201  | Created - Resource created successfully |
| 400  | Bad Request - Invalid request data      |
| 401  | Unauthorized - Missing or invalid token |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource not found          |
| 500  | Internal Server Error - Server error    |

---

## Error Codes

Common error responses include:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

```json
{
  "success": false,
  "message": "Subscription limit reached",
  "error": "You have reached your invoice limit. Please upgrade your plan."
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing for production use.

---

## Environment Variables

The API requires the following environment variables:

```env
# Database
MONGODB_URI=mongodb://...

# JWT
JWT_SECRET=your_jwt_secret

# Paystack
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_CALLBACK_URL=https://yourapp.com/callback

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Termii (for WhatsApp)
TERMII_API_KEY=...
TERMII_SENDER_ID=...

# Frontend
FRONTEND_URL=https://yourapp.com
```

---

## Mobile Implementation Notes

1. **Authentication**: Store the JWT token securely (e.g., Keychain for iOS, EncryptedSharedPreferences for Android)

2. **Token Refresh**: The current implementation doesn't have token refresh. Plan for re-authentication when token expires.

3. **File Uploads**: Use `multipart/form-data` for logo, signature, and inventory image uploads.

4. **Pagination**: All list endpoints support pagination. Default is 10 items per page.

5. **Currency**: Primary currency is NGN (Nigerian Naira). USD is also supported for invoices.

6. **Webhooks**: For payment status updates, implement polling or push notifications as the webhook only updates the server.

7. **Offline Support**: Consider caching customer and inventory data for offline invoice creation.

---

_Documentation generated on: December 2024_
_API Version: v1_
