# 📄 **Invoice PDF Generation & Download System**

## 📋 **Overview**

The invoice PDF generation system creates professional, branded PDF invoices with intelligent watermarking based on subscription plans. Free plan users get a "FREE TRIAL" watermark, while paid plan users get clean, professional invoices.

## 🚀 **Features**

### **1. Professional PDF Generation**

- **A4 Format**: Standard business document size
- **Professional Layout**: Clean, organized invoice structure
- **Branded Design**: Business logo and branding support
- **Multi-language Support**: Nigerian date formats and currency

### **2. Smart Watermarking System**

- **Free Plan**: Red "FREE TRIAL" watermark (semi-transparent)
- **Paid Plans**: No watermark, clean professional look
- **Automatic Detection**: Based on user's subscription plan
- **Customizable**: Easy to modify watermark text and style

### **3. Comprehensive Invoice Content**

- **Header Section**: Invoice title, number, dates, status
- **Business Info**: Company details, logo, contact information
- **Customer Info**: Bill-to details, shipping information
- **Items Table**: Product/services with quantities and prices
- **Totals Section**: Subtotal, VAT, final amount
- **Footer**: Payment terms, generation timestamp

## 🔧 **API Endpoint**

### **GET `/api/v1/invoice/:code/pdf`**

Download invoice as PDF with watermark based on subscription plan.

**Headers Required:**

```
Authorization: Bearer <your_jwt_token>
```

**URL Parameters:**

- `code`: Invoice code (e.g., INV-2024-001)

**Response:**

- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="invoice_INV-2024-001.pdf"`
- **Body**: PDF binary data for download

## 💳 **Watermark Logic**

### **Free Plan Users**

```javascript
// Red "FREE TRIAL" watermark
if (subscriptionPlan.name === "free") {
  // Add semi-transparent red watermark
  // Rotated 45 degrees for visibility
  // Positioned at center of page
}
```

### **Paid Plan Users**

```javascript
// No watermark - clean professional look
if (subscriptionPlan.name !== "free") {
  // Generate PDF without watermark
  // Professional business appearance
}
```

## 🎨 **PDF Design Features**

### **Layout Structure**

```
┌─────────────────────────────────────────────────────────┐
│                    INVOICE                              │
│  Invoice #: INV-2024-001    Date: 15/01/2024          │
│  Due Date: 30/01/2024       Status: [DRAFT]           │
├─────────────────────────────────────────────────────────┤
│ From:                    │ Bill To:                    │
│ Business Name            │ Customer Name               │
│ Business Address         │ Customer Address            │
│ Phone: +234...          │ Phone: +234...              │
│ Email: business@...      │ Email: customer@...         │
├─────────────────────────────────────────────────────────┤
│ Invoice Details:                                        │
│ Currency: NGN  Payment Terms: Net 30                   │
│ Notes: Thank you for your business!                    │
├─────────────────────────────────────────────────────────┤
│ Items Table:                                            │
│ ┌─────────┬─────────────┬─────┬──────────┬──────────┐  │
│ │ Item    │ Description │ Qty │ Price    │ Amount   │  │
│ ├─────────┼─────────────┼─────┼──────────┼──────────┤  │
│ │ Service │ Web Dev     │  1  │ ₦50,000  │ ₦50,000  │  │
│ └─────────┴─────────────┴─────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────┤
│ Totals:                                                 │
│ Subtotal: ₦75,000                                       │
│ VAT (7.5%): ₦5,625                                      │
│ Total: ₦80,625                                          │
├─────────────────────────────────────────────────────────┤
│ Footer: Generated on 15/01/2024 10:30 AM               │
└─────────────────────────────────────────────────────────┘
```

### **Color Scheme**

- **Primary**: Dark Slate Gray (#2F4F4F)
- **Secondary**: Light Gray (#666)
- **Accent**: Red (#FF0000) for free plan watermark
- **Background**: White (#FFF)
- **Alternate Rows**: Light Gray (#F8F9FA)

### **Typography**

- **Headers**: Helvetica-Bold, 32px
- **Subheaders**: Helvetica-Bold, 16px
- **Body Text**: Helvetica, 12px
- **Table Headers**: Helvetica-Bold, 12px
- **Watermark**: Helvetica-Bold, 48px

## 🔄 **PDF Generation Flow**

### **1. Request Processing**

```
User Request → Authentication Check → Invoice Ownership Verification
```

### **2. Data Retrieval**

```
Get Invoice → Populate Customer Data → Get Entity Details → Get Subscription Plan
```

### **3. PDF Generation**

```
Create PDF Document → Add Watermark (if free plan) → Generate Content → Return Buffer
```

### **4. Response Delivery**

```
Set Headers → Send PDF Buffer → Download Complete
```

## 🛠️ **Technical Implementation**

### **Core Service**

```javascript
// PDFService.generateInvoicePDFBuffer()
const pdfBuffer = await PDFService.generateInvoicePDFBuffer(
  invoiceId,
  entityId
);
```

### **Watermark Function**

```javascript
static addWatermark(doc, subscriptionPlan) {
  if (subscriptionPlan && subscriptionPlan.name === "free") {
    // Add "FREE TRIAL" watermark
    doc.font("Helvetica-Bold")
      .fontSize(48)
      .fillColor("#FF0000")
      .fillOpacity(0.15)
      .rotate(-45, { origin: [centerX, centerY] })
      .text("FREE TRIAL", centerX, centerY, {
        align: "center",
        valign: "center"
      });
  }
}
```

### **Content Generation**

```javascript
// Modular content generation
this.generateHeader(doc, invoice, entity);
this.generateBusinessInfo(doc, entity);
this.generateCustomerInfo(doc, customer);
this.generateItemsTable(doc, invoice);
this.generateTotals(doc, invoice);
this.generateFooter(doc, entity, invoice);
```

## 📱 **Mobile App Integration**

### **Download PDF**

```javascript
// React Native example
const downloadPDF = async (invoiceCode) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/invoice/${invoiceCode}/pdf`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      // Handle PDF download
      // Save to device or open in viewer
    }
  } catch (error) {
    console.error("PDF download failed:", error);
  }
};
```

### **Preview PDF**

```javascript
// Open PDF in app or external viewer
import { Linking } from "react-native";

const openPDF = (invoiceCode) => {
  const url = `${API_BASE}/api/v1/invoice/${invoiceCode}/pdf`;
  Linking.openURL(url);
};
```

## 🧪 **Testing**

### **Test Free Plan Watermark**

```bash
# 1. Create user with free plan
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "free@test.com", "password": "password123", "name": "Free User"}'

# 2. Create invoice
curl -X POST http://localhost:3000/api/v1/invoice \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer": {...}, "items": [...]}'

# 3. Download PDF (should have watermark)
curl -X GET http://localhost:3000/api/v1/invoice/INV-001/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice_free.pdf
```

### **Test Paid Plan (No Watermark)**

```bash
# 1. Upgrade to paid plan
curl -X POST http://localhost:3000/api/v1/subscription/upgrade \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planName": "basic"}'

# 2. Download PDF (should be clean)
curl -X GET http://localhost:3000/api/v1/invoice/INV-001/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice_paid.pdf
```

## 📊 **Performance & Optimization**

### **Memory Management**

- **Streaming**: PDF generated in chunks to avoid memory issues
- **Buffer Handling**: Efficient buffer management for large invoices
- **Garbage Collection**: Proper cleanup after PDF generation

### **Caching Strategy**

- **PDF Caching**: Cache generated PDFs for frequently accessed invoices
- **Template Caching**: Cache PDF templates for faster generation
- **CDN Integration**: Serve PDFs from CDN for better performance

### **Scalability**

- **Async Processing**: Non-blocking PDF generation
- **Queue System**: Handle multiple PDF requests
- **Load Balancing**: Distribute PDF generation across servers

## 🔒 **Security Features**

### **Access Control**

- **Authentication Required**: JWT token validation
- **Ownership Verification**: Users can only download their own invoices
- **Rate Limiting**: Prevent abuse of PDF generation

### **Data Protection**

- **No Data Leakage**: PDFs only contain authorized information
- **Secure Headers**: Proper content disposition headers
- **Audit Logging**: Track PDF downloads for security

## 🚨 **Error Handling**

### **Common Errors**

```javascript
// Invoice not found
if (!invoice) {
  return res.status(404).json({
    success: false,
    message: "Invoice not found"
  });
}

// PDF generation failed
try {
  const pdfBuffer = await PDFService.generateInvoicePDFBuffer(...);
} catch (error) {
  return res.status(500).json({
    success: false,
    message: "Error generating PDF",
    error: error.message
  });
}
```

### **Error Responses**

- **404**: Invoice not found or access denied
- **500**: PDF generation failed
- **401**: Authentication required
- **403**: Insufficient permissions

## 🔮 **Future Enhancements**

### **Planned Features**

1. **Custom Templates**: User-defined PDF layouts
2. **Multi-language**: Support for multiple languages
3. **Digital Signatures**: E-signature integration
4. **Batch Generation**: Generate multiple PDFs at once
5. **Watermark Customization**: User-defined watermark text

### **Integration Opportunities**

1. **Cloud Storage**: Save PDFs to cloud (AWS S3, Google Cloud)
2. **Email Integration**: Send PDFs directly via email
3. **WhatsApp Integration**: Share PDFs via WhatsApp Business API
4. **Print Services**: Integration with local print services

## 📞 **Support & Troubleshooting**

### **Common Issues**

#### **1. PDF Not Downloading**

```bash
# Check authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/invoice/INV-001/pdf

# Verify invoice exists
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/invoice/INV-001
```

#### **2. Watermark Not Appearing**

```bash
# Check subscription plan
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/subscription/current

# Verify plan name is "free" for watermark
```

#### **3. PDF Generation Slow**

```bash
# Check server resources
# Monitor memory usage
# Verify PDF generation logs
```

### **Debug Mode**

```javascript
// Enable detailed logging
process.env.DEBUG = "pdf:*";

// Check PDF generation status
console.log("PDF generation started");
console.log("Watermark added:", hasWatermark);
console.log("PDF buffer size:", pdfBuffer.length);
```

---

**🎉 The PDF generation system is now fully integrated with watermark functionality!**

**Key Benefits:**

- ✅ **Professional PDFs** for all users
- ✅ **Smart Watermarking** based on subscription plans
- ✅ **Mobile App Ready** for easy integration
- ✅ **Secure & Scalable** architecture
- ✅ **Comprehensive Error Handling**
