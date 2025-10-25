const catchAsync = require("../utils/catchAsync");
const { InvoiceService } = require("../services");
const { successResponse, redirect } = require("../utils/responder");
const httpStatus = require("http-status");
const moment = require("moment");
const invoiceRepo = require("../repo/invoice.repo");
const PDFService = require("../services/pdf.service");

class InvoiceController {
  // Create a new invoice
  static createInvoice = catchAsync(async (req, res, next) => {
    const invoiceData = req.body;
    const user = req.user;
    const invoice = await InvoiceService.createInvoice(invoiceData, user.id);
    return successResponse(req, res, invoice);
  });

  // Get all invoices
  static getAllInvoices = catchAsync(async (req, res, next) => {
    const user = req.user;
    const query = req.query;
    const invoices = await InvoiceService.getAllInvoices(user.id, query);
    return successResponse(req, res, invoices);
  });

  static initiatePayment = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const invoices = await InvoiceService.initiatePayment(code);
    return redirect(res, invoices.data.authorization_url);
  });

  // Get a single invoice by ID
  static getInvoiceById = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const user = req.user;
    const invoice = await InvoiceService.getInvoiceById(code, user.id);
    return successResponse(req, res, invoice);
  });

  static downloadInvoiceById = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const user = req.user;
    const invoice = await InvoiceService.downloadInvoiceById(code, user.id);
    return successResponse(req, res, invoice);
  });

  // Update an invoice by ID
  static updateInvoice = catchAsync(async (req, res, next) => {
    const { invoiceId } = req.params;
    const user = req.user;

    console.log("🔍 Update invoice request:", {
      invoiceId,
      userId: user.id,
      body: req.body,
    });

    // Find invoice by invoiceNumber (code)
    const invoice = await invoiceRepo.findOne({
      query: { invoiceNumber: invoiceId, entity: user.id },
    });

    console.log("🔍 Invoice lookup result:", invoice ? "Found" : "Not found");

    if (!invoice) {
      console.log("❌ Invoice not found for:", { invoiceId, userId: user.id });
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const updatedData = req.body;
    const updatedInvoice = await InvoiceService.updateInvoice(
      invoice._id,
      updatedData
    );
    return successResponse(req, res, updatedInvoice);
  });

  // Delete an invoice by ID
  static deleteInvoice = catchAsync(async (req, res, next) => {
    const { invoiceId } = req.params;
    const deletedInvoice = await InvoiceService.deleteInvoice(invoiceId);
    return successResponse(req, res, deletedInvoice);
  });

  // Download invoice as PDF using HTML templates
  static downloadInvoicePDF = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const { preview = false, template = "invoice1" } = req.query; // Default to HTML template
    const user = req.user;

    try {
      // Get invoice to verify ownership
      const invoice = await InvoiceService.getInvoiceById(code, user.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Map old PDF template names to new HTML template names for backward compatibility
      const templateMapping = {
        pdf0: "invoice1",
        pdf1: "invoice2",
        pdf2: "invoice3",
        pdf3: "invoice1", // fallback to invoice1
        invoice1: "invoice1",
        invoice2: "invoice2",
        invoice3: "invoice3",
      };

      const htmlTemplate = templateMapping[template] || "invoice1";

      // Generate PDF with HTML template
      const pdfBuffer = await PDFService.generateInvoicePdfFromHtml(
        invoice,
        invoice.entity,
        invoice.customer,
        invoice.entity.subscriptionPlan,
        htmlTemplate
      );

      // Set response headers for PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);

      // Set Content-Disposition based on preview parameter
      if (preview === "true" || preview === true) {
        // For preview - display inline in browser
        res.setHeader(
          "Content-Disposition",
          `inline; filename="invoice_${invoice.invoiceNumber}_${moment().format(
            "DD-MM-YYYY"
          )}.pdf"`
        );
      } else {
        // For download - force download
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="invoice_${
            invoice.invoiceNumber
          }_${moment().format("DD-MM-YYYY")}.pdf"`
        );
      }

      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating PDF",
        error: error.message,
      });
    }
  });

  // Get available HTML templates
  static getAvailableTemplates = catchAsync(async (req, res, next) => {
    const templates = [
      {
        id: "invoice1",
        name: "Classic",
        description:
          "Clean and professional design with modern blue theme and diagonal corner",
        preview: "/invoice/templates/invoice1/preview",
        features: [
          "Professional layout",
          "Modern blue theme",
          "Diagonal corner design",
          "Company info box",
          "Clickable payment links",
        ],
      },
      {
        id: "invoice2",
        name: "Modern",
        description: "Contemporary design with red accents and flex layout",
        preview: "/invoice/templates/invoice2/preview",
        features: [
          "Modern flex layout",
          "Red color scheme",
          "Company branding",
          "Clickable payment links",
        ],
      },
      {
        id: "invoice3",
        name: "Contemporary",
        description: "Clean design with orange accents and modern typography",
        preview: "/invoice/templates/invoice3/preview",
        features: [
          "Contemporary design",
          "Orange accents",
          "Clean typography",
          "Clickable payment links",
        ],
      },
      {
        id: "invoice4",
        name: "Modern Teal",
        description:
          "Professional design with dark teal/blue, white, and yellow/gold color scheme",
        preview: "/invoice/templates/invoice4/preview",
        features: [
          "Modern teal color scheme",
          "Professional layout",
          "Curved decorative elements",
          "Clean typography",
          "Clickable payment links",
        ],
      },
    ];

    return successResponse(req, res, { templates });
  });

  // Generate template preview
  static generateTemplatePreview = catchAsync(async (req, res, next) => {
    const { templateId } = req.params;
    const user = req.user;

    try {
      // Create sample invoice data for preview
      const sampleInvoice = {
        _id: "preview",
        invoiceNumber: "INV-PREVIEW-001",
        currency: "NGN",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "published",
        paymentStatus: "unpaid",
        notes:
          "This is a preview of how your invoice will look with this template.",
        paymentTerms: "Net 30",
        items: [
          {
            name: "Sample Service",
            description: "Professional service delivery",
            quantity: 2,
            unitPrice: 50000,
            total: 100000,
          },
          {
            name: "Additional Service",
            description: "Extra service for your business",
            quantity: 1,
            unitPrice: 25000,
            total: 25000,
          },
        ],
        subtotal: 125000,
        tax: 9375,
        taxRate: 7.5,
        total: 134375,
      };

      const sampleEntity = {
        _id: "preview-entity",
        name: "Your Business Name",
        email: "contact@yourbusiness.com",
        phone: "+234 800 000 0000",
        address: "123 Business Street, Lagos, Nigeria",
        website: "www.yourbusiness.com",
      };

      const sampleCustomer = {
        _id: "preview-customer",
        name: "Sample Customer",
        email: "customer@example.com",
        phone: "+234 900 000 0000",
        address: "456 Customer Avenue, Lagos, Nigeria",
      };

      const sampleSubscription = {
        name: "premium", // No watermark for preview
      };

      // Map template IDs to HTML templates
      const templateMapping = {
        pdf0: "invoice1",
        pdf1: "invoice2",
        pdf2: "invoice3",
        pdf3: "invoice1",
        invoice1: "invoice1",
        invoice2: "invoice2",
        invoice3: "invoice3",
        invoice4: "invoice4",
      };

      const htmlTemplate = templateMapping[templateId] || "invoice1";

      // Generate PDF with HTML template
      const pdfBuffer = await PDFService.generateInvoicePdfFromHtml(
        sampleInvoice,
        sampleEntity,
        sampleCustomer,
        sampleSubscription,
        htmlTemplate
      );

      // Set response headers for PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="template_${templateId}_preview.pdf"`
      );

      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Template preview generation error:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating template preview",
        error: error.message,
      });
    }
  });

  // Share invoice via WhatsApp
  static shareViaWhatsApp = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const { customerPhone } = req.body;
    const user = req.user;

    const result = await InvoiceService.shareViaWhatsApp(
      code,
      user.id,
      customerPhone
    );
    return successResponse(req, res, result);
  });

  // Share PDF invoice via WhatsApp
  static sharePDFInvoiceViaWhatsApp = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const { customerPhone, pdfUrl } = req.body;
    const user = req.user;

    const result = await InvoiceService.sharePDFInvoiceViaWhatsApp(
      code,
      user.id,
      customerPhone,
      pdfUrl
    );
    return successResponse(req, res, result);
  });

  // Get invoice analytics
  static getInvoiceAnalytics = catchAsync(async (req, res, next) => {
    const user = req.user;
    const filters = req.query;

    const analytics = await InvoiceService.getInvoiceAnalytics(
      user.id,
      filters
    );
    return successResponse(req, res, analytics);
  });

  // Get dashboard summary
  static getDashboardSummary = catchAsync(async (req, res, next) => {
    const user = req.user;

    const summary = await InvoiceService.getDashboardSummary(user.id);
    return successResponse(req, res, summary);
  });

  // Download invoice as PDF using HTML templates
  static downloadInvoiceHTMLPDF = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const { preview = false, template = "invoice2" } = req.query;
    const user = req.user;

    try {
      // Get invoice to verify ownership
      const invoice = await InvoiceService.getInvoiceById(code, user.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Generate PDF with HTML template
      const pdfBuffer = await PDFService.generateInvoicePdfFromHtml(
        invoice,
        invoice.entity,
        invoice.customer,
        invoice.entity.subscriptionPlan,
        template
      );

      // Set response headers for PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);

      // Set Content-Disposition based on preview parameter
      if (preview === "true" || preview === true) {
        // For preview - display inline in browser
        res.setHeader(
          "Content-Disposition",
          `inline; filename="invoice_${invoice.invoiceNumber}_${moment().format(
            "DD-MM-YYYY"
          )}.pdf"`
        );
      } else {
        // For download - force download
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="invoice_${
            invoice.invoiceNumber
          }_${moment().format("DD-MM-YYYY")}.pdf"`
        );
      }

      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error("HTML PDF generation error:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating PDF from HTML template",
        error: error.message,
      });
    }
  });
}

module.exports = {
  InvoiceController,
};
