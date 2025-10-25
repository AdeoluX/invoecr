# HTML PDF Generation

This document explains how to use the new HTML PDF generation feature that uses Playwright to convert HTML templates to PDF invoices.

## Overview

The HTML PDF generation system allows you to create professional PDF invoices using HTML templates with dynamic data replacement. It uses Playwright to render HTML and convert it to PDF format.

## Features

- **Four HTML Templates**: invoice1, invoice2, invoice3, and invoice4
- **Dynamic Data Replacement**: Automatically replaces placeholders with actual invoice data
- **Playwright Integration**: Uses Playwright for reliable HTML to PDF conversion
- **Template Flexibility**: Easy to customize and add new templates

## Available Templates

### invoice1.html

- Classic table-based layout
- Clean and professional design
- Suitable for traditional business invoices

### invoice2.html

- Modern flex-based layout
- Red color scheme with professional styling
- Includes company branding section

### invoice3.html

- Contemporary design with orange accents
- Clean typography and modern layout
- Professional business appearance

### invoice4.html

- Modern design with dark teal/blue, white, and yellow/gold color scheme
- Professional layout with curved decorative elements
- Clean typography and modern styling

## Usage

### 1. Generate PDF from HTML Template

```javascript
const { PDFService } = require("./src/services/pdf.service");

// Generate PDF using HTML template
const pdfBuffer = await PDFService.generateInvoicePdfFromHtml(
  invoice, // Invoice data
  entity, // Entity/Business data
  customer, // Customer data
  subscriptionPlan, // Subscription plan data
  "invoice1" // Template ID (invoice1, invoice2, or invoice3)
);
```

### 2. API Endpoint

```
GET /invoice/:code/html-pdf?template=invoice1&preview=true
```

**Parameters:**

- `code`: Invoice code/number
- `template`: Template ID (invoice1, invoice2, invoice3, invoice4) - defaults to invoice1
- `preview`: Set to true for inline viewing, false for download

**Example:**

```bash
# Generate PDF with invoice1 template
GET /invoice/INV-2024-001/html-pdf?template=invoice1

# Preview PDF in browser
GET /invoice/INV-2024-001/html-pdf?template=invoice2&preview=true

# Generate PDF with invoice4 template
GET /invoice/INV-2024-001/html-pdf?template=invoice4
```

### 3. Direct Service Usage

```javascript
const HTMLPDFService = require("./src/services/htmlPdf.service");

// Generate PDF buffer for download
const pdfBuffer = await HTMLPDFService.generateInvoicePDFBuffer(
  invoiceId, // Invoice ID
  entityId, // Entity ID
  "invoice1" // Template ID
);
```

## Template Placeholders

All templates support the following placeholders that are automatically replaced with actual data:

### Invoice Data

- `{{INVOICE_NUMBER}}` - Invoice number
- `{{INVOICE_CODE}}` - Invoice code
- `{{INVOICE_DATE}}` - Issue date
- `{{DUE_DATE}}` - Due date
- `{{PAYMENT_TERMS}}` - Payment terms
- `{{NOTES}}` - Invoice notes
- `{{CURRENCY}}` - Currency code
- `{{STATUS}}` - Invoice status
- `{{PAYMENT_STATUS}}` - Payment status
- `{{PAYMENT_LINK}}` - Payment link

### Entity Data

- `{{ENTITY_NAME}}` - Business name
- `{{ENTITY_ADDRESS}}` - Business address
- `{{ENTITY_PHONE}}` - Business phone
- `{{ENTITY_EMAIL}}` - Business email
- `{{ENTITY_LOGO}}` - Business logo URL (from entity.logo.secure_url)
- `{{ENTITY_LOGO_DISPLAY}}` - Logo display CSS property (block/none)
- `{{ENTITY_SIGNATURE}}` - Business signature URL (from entity.signature.secure_url)
- `{{ENTITY_SIGNATURE_DISPLAY}}` - Signature display CSS property (block/none)
- `{{ENTITY_SIGNATURE_DISPLAY_NONE}}` - Inverse signature display CSS property (none/block)

### Customer Data

- `{{CUSTOMER_NAME}}` - Customer name
- `{{CUSTOMER_ADDRESS}}` - Customer address
- `{{CUSTOMER_PHONE}}` - Customer phone
- `{{CUSTOMER_EMAIL}}` - Customer email

### Financial Data

- `{{SUBTOTAL}}` - Subtotal amount
- `{{TAX_RATE}}` - Tax rate percentage
- `{{TAX_AMOUNT}}` - Tax amount
- `{{TOTAL}}` - Total amount

### Items Table

- `{{ITEMS_TABLE}}` - Dynamic items table (automatically generated)

### Payment Links

- `{{PAYMENT_LINK}}` - Clickable payment link (rendered as "Click here to pay" anchor tag)

**Payment Link Features:**

- Clickable "Click here to pay" text
- Opens in new tab (`target="_blank"`)
- Template-specific styling:
  - **invoice1**: Blue (#0066cc)
  - **invoice2**: Red (#cc0000)
  - **invoice3**: Orange (#ef532e)
- Bold font weight for visibility
- Clean appearance (no underline)

## Testing

Run the test script to verify the implementation:

```bash
cd BE
node test-html-pdf.js
```

This will generate test PDFs for all three templates using sample data.

## Customization

### Adding New Templates

1. Create a new HTML file in `src/services/htmlTemplates/invoices/`
2. Use the standard placeholders for dynamic data
3. Update the `replaceTemplateData` method in `htmlPdf.service.js` if needed
4. Add template-specific logic in the appropriate `replaceInvoiceXData` method

### Modifying Existing Templates

1. Edit the HTML file in `src/services/htmlTemplates/invoices/`
2. Use the standard placeholders for data replacement
3. Customize CSS styling as needed
4. Test with the test script

## Dependencies

- **Playwright**: For HTML to PDF conversion
- **Node.js**: Runtime environment
- **Express**: Web framework (for API endpoints)

## Error Handling

The system includes comprehensive error handling:

- Template file validation
- Data validation
- Browser launch error handling
- PDF generation error handling
- Graceful fallbacks for missing data

## Performance Considerations

- Playwright browser instances are created and destroyed for each request
- Consider implementing browser pooling for high-traffic applications
- HTML templates are read from disk for each request
- Consider caching templates for better performance

## Troubleshooting

### Common Issues

1. **Template not found**: Ensure template file exists in the correct directory
2. **Playwright errors**: Check if Playwright is properly installed
3. **Data not replaced**: Verify placeholder syntax matches exactly
4. **PDF generation fails**: Check browser permissions and system resources

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=html-pdf:*
```

## Future Enhancements

- Template preview functionality
- Custom CSS injection
- Multiple page support
- Watermark support
- QR code integration
- Browser pooling for better performance
