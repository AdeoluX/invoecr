const HTMLPDFService = require("./src/services/htmlPdf.service");

const data = {
  invoice: {
    invoiceNumber: "INV-TEST",
    issueDate: new Date(),
    dueDate: new Date(),
    paymentTerms: "Net 30",
    notes: "Test notes",
    currency: "NGN",
    items: [{ name: "Test Item", quantity: 1, unitPrice: 1000 }],
    taxRate: 7.5,
    type: "invoice"
  },
  entity: {
    name: "Test Entity",
    address: "Test Address",
    phone: "1234567890",
    email: "test@example.com",
    website: "test.com"
  },
  customer: {
    name: "Test Customer",
    address: "Customer Address",
    phone: "0987654321",
    email: "customer@example.com"
  },
  templateId: "invoice1"
};

async function test() {
  try {
    console.log("Starting PDF generation test for invoice1...");
    const html1 = await HTMLPDFService.generateHTMLInvoice(data, null, true);
    console.log("Invoice1 HTML snippet (signature style):", html1.substring(html1.indexOf('class="signature-img"') - 100, html1.indexOf('class="signature-img"') + 200));
    
    const pdfBuffer = await HTMLPDFService.generateHTMLPDF(data, null, true);
    console.log("PDF generated successfully, buffer length:", pdfBuffer.length);

    console.log("\nStarting test for invoice4 (signature fallback)...");
    const data4 = { ...data, templateId: "invoice4" };
    const html4 = await HTMLPDFService.generateHTMLInvoice(data4, null, true);
    console.log("Invoice4 HTML snippet (image signature):", html4.substring(html4.indexOf('src="{{ENTITY_SIGNATURE}}"') - 50, html4.indexOf('src="{{ENTITY_SIGNATURE}}"') + 150));
    console.log("Invoice4 HTML snippet (text signature):", html4.substring(html4.indexOf('class="cursive-signature"') - 30, html4.indexOf('class="cursive-signature"') + 150));
    
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

test();
