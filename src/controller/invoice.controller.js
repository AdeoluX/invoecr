const catchAsync = require("../utils/catchAsync");
const { InvoiceService, SubscriptionService } = require("../services");
const { successResponse, redirect } = require("../utils/responder");
const httpStatus = require("http-status");
const moment = require("moment");
const invoiceRepo = require("../repo/invoice.repo");
const PDFService = require("../services/pdf.service");
const HTMLPDFService = require("../services/htmlPdf.service");

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

    // Find invoice by invoiceNumber (code)
    const invoice = await invoiceRepo.findOne({
      query: { invoiceNumber: invoiceId, entity: user.id },
    });

    if (!invoice) {
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
//
  // Convert a Quote to an Invoice
  static convertToInvoice = catchAsync(async (req, res, next) => {
    const { invoiceId } = req.params;
    const user = req.user;
    const result = await InvoiceService.convertToInvoice(invoiceId, user.id);
    return successResponse(req, res, result);
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
        res.setHeader("Content-Disposition", "inline");
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
        description: "Clean and professional with modern blue theme",
        preview: "/invoice/templates/invoice1/preview",
        features: ["Professional layout", "Modern blue theme", "Diagonal accents"],
        isPremium: false,
      },
      {
        id: "invoice2",
        name: "Modern Red",
        description: "Contemporary design with bold red accents",
        preview: "/invoice/templates/invoice2/preview",
        features: ["Flex layout", "Red color scheme", "High contrast"],
        isPremium: false,
      },
      {
        id: "invoice3",
        name: "Contemporary",
        description: "Clean design with warm orange accents",
        preview: "/invoice/templates/invoice3/preview",
        features: ["Clean typography", "Orange accents", "Professional"],
        isPremium: false,
      },
      {
        id: "invoice4",
        name: "Modern Teal Premium",
        description: "Premium teal design with modern typography and sophisticated layout",
        preview: "/invoice/templates/invoice4/preview",
        features: ["Teal Premium", "Geometric header", "Plus Jakarta Sans"],
        isPremium: false,
      },

      {
        id: "invoice5",
        name: "Elegant Serif",
        description: "Luxury design for high-end professional services",
        preview: "/invoice/templates/invoice5/preview",
        features: ["Gold accents", "Serif typography", "Luxury feel"],
        isPremium: true,
      },
      {
        id: "invoice6",
        name: "Minimalist Mono",
        description: "Bold black and white architectural design",
        preview: "/invoice/templates/invoice6/preview",
        features: ["B&W High Contrast", "Swiss design", "Minimalist"],
        isPremium: true,
      },
      {
        id: "invoice7",
        name: "Bold Corporate",
        description: "Strong structural design with deep slate tones",
        preview: "/invoice/templates/invoice7/preview",
        features: ["Sidebar info", "Slate & Steel", "Structured"],
        isPremium: true,
      },
      {
        id: "invoice8",
        name: "Creative Gradient",
        description: "Vibrant design with modern glassmorphism and gradients",
        preview: "/invoice/templates/invoice8/preview",
        features: ["Purple Gradients", "Rounded", "Glassmorphism"],
        isPremium: true,
      },
      {
        id: "invoice9",
        name: "Industrial Grid",
        description: "Technical, grid-based layout for modern industries",
        preview: "/invoice/templates/invoice9/preview",
        features: ["Technical Grid", "Monospaced font", "Bold borders"],
        isPremium: true,
      },
      {
        id: "invoice10",
        name: "Eco Green",
        description: "Soft, organic design with friendly green accents",
        preview: "/invoice/templates/invoice10/preview",
        features: ["Organic Green", "Rounded corners", "Friendly"],
        isPremium: true,
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
        pdf3: "invoice4",
        invoice1: "invoice1",
        invoice2: "invoice2",
        invoice3: "invoice3",
        invoice4: "invoice4",
        invoice5: "invoice5",
        invoice6: "invoice6",
        invoice7: "invoice7",
        invoice8: "invoice8",
        invoice9: "invoice9",
        invoice10: "invoice10",
      };

      const htmlTemplate = templateMapping[templateId] || "invoice1";
      const previewData = {
        invoice: sampleInvoice,
        entity: sampleEntity,
        customer: sampleCustomer,
        templateId: htmlTemplate,
      };

      // Generate PDF with HTML template
      const pdfBuffer = await HTMLPDFService.generateHTMLPDF(
        previewData,
        null,
        true
      );

      // Set response headers for PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", pdfBuffer.length);
      res.setHeader("Content-Disposition", "inline");

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

  /**
   * Generate invoice template HTML preview
   */
  static generateTemplateHTMLPreview = catchAsync(async (req, res, next) => {
    const { templateId } = req.params;

    try {
      // Create sample data for preview
      const previewData = {
        invoice: {
          invoiceNumber: "PREVIEW-001",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          currency: "NGN",
          status: "draft",
          items: [
            {
              name: "Sample Product 1",
              description: "High-quality sample product description",
              quantity: 2,
              unitPrice: 15000,
            },
            {
              name: "Professional Service",
              description: "Expert consulting and implementation",
              quantity: 5,
              unitPrice: 25000,
            },
          ],
          taxRate: 7.5,
          notes: "This is a sample invoice for template preview purposes.",
          paymentTerms: "Due on receipt",
        },
        entity: {
          name: "Your Business Name",
          address: "123 Business Avenue, Suite 100\nLagos, Nigeria",
          phone: "+234 800 000 0000",
          email: "hello@yourbusiness.com",
          website: "www.yourbusiness.com",
          logo: { secure_url: "" },
          signature: { secure_url: "" },
        },
        customer: {
          name: "Sample Customer Ltd",
          address: "45 Customer Road, Victoria Island\nLagos, Nigeria",
          phone: "+234 700 000 0000",
          email: "finance@samplecustomer.com",
        },
        templateId: templateId,
      };

      const htmlContent = await HTMLPDFService.generateHTMLInvoice(
        previewData,
        null,
        true
      );

      res.setHeader("Content-Type", "text/html");
      return res.send(htmlContent);
    } catch (error) {
      console.error("Template HTML preview generation error:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating template HTML preview",
        error: error.message,
      });
    }
  });


  // Share invoice via WhatsApp
  static shareViaWhatsApp = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const { customerPhone } = req.body;
    const user = req.user;

    // Feature gating for WhatsApp Sharing
    const canAccessWhatsApp = await SubscriptionService.canAccessFeature(
      user.id,
      "whatsappSharing"
    );
    if (!canAccessWhatsApp) {
      return res.status(403).json({
        success: false,
        message: "WhatsApp sharing is not available on your current plan.",
      });
    }

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

    // Feature gating for WhatsApp Sharing
    const canAccessWhatsApp = await SubscriptionService.canAccessFeature(
      user.id,
      "whatsappSharing"
    );
    if (!canAccessWhatsApp) {
      return res.status(403).json({
        success: false,
        message: "WhatsApp sharing is not available on your current plan.",
      });
    }

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

    const canAccessAnalytics = await SubscriptionService.canAccessFeature(
      user.id,
      "analytics"
    );
    if (!canAccessAnalytics) {
      return res.status(403).json({
        success: false,
        message: "Analytics & Reports are not available on your current plan.",
      });
    }

    const analytics = await InvoiceService.getInvoiceAnalytics(
      user.id,
      filters
    );
    return successResponse(req, res, analytics);
  });

  // Get dashboard summary
  static getDashboardSummary = catchAsync(async (req, res, next) => {
    const user = req.user;

    const canAccessAnalytics = await SubscriptionService.canAccessFeature(
      user.id,
      "analytics"
    );
    if (!canAccessAnalytics) {
      // Return a basic summary or empty data instead of 403 to avoid breaking the dashboard UI
      return successResponse(req, res, {
        summary: {
          totalRevenue: 0,
          totalInvoices: 0,
          paymentSuccessRate: 0,
          whatsappConversionRate: 0,
        },
      });
    }

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
        res.setHeader("Content-Disposition", "inline");
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

  /**
   * Get invoice HTML for in-app preview
   */
  static getInvoiceHTML = catchAsync(async (req, res, next) => {
    const { code } = req.params;
    const { template = "invoice1" } = req.query;
    const user = req.user;

    const invoice = await InvoiceService.getInvoiceById(code, user.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const data = {
      invoice,
      entity: invoice.entity,
      customer: invoice.customer,
      templateId: template,
    };

    const htmlContent = await HTMLPDFService.generateHTMLInvoice(
      data,
      invoice.entity.subscriptionPlan,
      true
    );

    res.setHeader("Content-Type", "text/html");
    return res.send(htmlContent);
  });

  /**
   * Generate invoice template HTML preview
   */
  static generateTemplateHTMLPreview = catchAsync(async (req, res, next) => {
    const { templateId } = req.params;

    try {
      // Create sample data for preview
      const previewData = {
        invoice: {
          invoiceNumber: "PREVIEW-001",
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          currency: "NGN",
          status: "draft",
          items: [
            {
              name: "Sample Product 1",
              description: "High-quality sample product description",
              quantity: 2,
              unitPrice: 15000,
            },
            {
              name: "Professional Service",
              description: "Expert consulting and implementation",
              quantity: 5,
              unitPrice: 25000,
            },
          ],
          taxRate: 7.5,
          notes: "This is a sample invoice for template preview purposes.",
          paymentTerms: "Due on receipt",
        },
        entity: {
          name: "Your Business Name",
          address: "123 Business Avenue, Suite 100\nLagos, Nigeria",
          phone: "+234 800 000 0000",
          email: "hello@yourbusiness.com",
          website: "www.yourbusiness.com",
          logo: { secure_url: "" },
          signature: { secure_url: "" },
        },
        customer: {
          name: "Sample Customer Ltd",
          address: "45 Customer Road, Victoria Island\nLagos, Nigeria",
          phone: "+234 700 000 0000",
          email: "finance@samplecustomer.com",
        },
        templateId: templateId,
      };

      const htmlContent = await HTMLPDFService.generateHTMLInvoice(
        previewData,
        null,
        true
      );

      res.setHeader("Content-Type", "text/html");
      return res.send(htmlContent);
    } catch (error) {
      console.error("Template HTML preview generation error:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating template HTML preview",
        error: error.message,
      });
    }
  });
}


module.exports = {
  InvoiceController,
};
