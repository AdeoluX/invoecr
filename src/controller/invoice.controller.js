const catchAsync = require('../utils/catchAsync');
const { InvoiceService } = require('../services');
const { successResponse } = require('../utils/responder');
const httpStatus = require('http-status');

class InvoiceController {
  // Create a new invoice
  static createInvoice = catchAsync(async (req, res, next) => {
    const invoiceData = req.body;
    const invoice = await InvoiceService.createInvoice(invoiceData);
    return successResponse(req, res, invoice);
  });

  // Get all invoices
  static getAllInvoices = catchAsync(async (req, res, next) => {
    const invoices = await InvoiceService.getAllInvoices();
    return successResponse(req, res, invoices);
  });

  // Get a single invoice by ID
  static getInvoiceById = catchAsync(async (req, res, next) => {
    const { invoiceId } = req.params;
    const invoice = await InvoiceService.getInvoiceById(invoiceId);
    return successResponse(req, res, invoice);
  });

  // Update an invoice by ID
  static updateInvoice = catchAsync(async (req, res, next) => {
    const { invoiceId } = req.params;
    const updatedData = req.body;
    const updatedInvoice = await InvoiceService.updateInvoice(invoiceId, updatedData);
    return successResponse(req, res, updatedInvoice);
  });

  // Delete an invoice by ID
  static deleteInvoice = catchAsync(async (req, res, next) => {
    const { invoiceId } = req.params;
    const deletedInvoice = await InvoiceService.deleteInvoice(invoiceId);
    return successResponse(req, res, deletedInvoice);
  });

  static downloadPdf = catchAsync(async (req, res, next) => {
    const { invoiceId } = req.params;
    const fileData = await InvoiceService.generateInvoicePDF(invoiceId, res);
    const base64FileData = fileData.toString('base64');
    // Provide the file name for the download
    const fileName = `invoice_${invoiceId}.pdf`;
    // Call the function to download the PDF
    await downloadPdfFile(base64FileData, res, fileName);
  });
}

module.exports = {
  InvoiceController,
};
