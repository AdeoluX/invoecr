const catchAsync = require("../utils/catchAsync");
const { InvoiceService } = require("../services");
const { successResponse } = require("../utils/responder");
const httpStatus = require("http-status");

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
    return successResponse(req, res, invoices);
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
    const updatedData = req.body;
    const updatedInvoice = await InvoiceService.updateInvoice(
      invoiceId,
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

  // Download invoice as PDF
  static downloadInvoicePDF = catchAsync(async (req, res, next) => {
    const { code } = req.params;
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

      // Generate PDF with watermark based on subscription plan
      const PDFService = require("../services/pdf.service");
      const pdfBuffer = await PDFService.generateInvoicePDFBuffer(
        invoice._id,
        user.id
      );

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice_${invoice.invoiceCode}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

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
}

module.exports = {
  InvoiceController,
};
