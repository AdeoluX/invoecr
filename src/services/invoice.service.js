const Invoice = require('../models/invoice.model');
const { abortIf } = require('../utils/responder');
const httpStatus = require('http-status');
const invoiceRepository = require('../repo/invoice.repo');
const PDFDocument = require('pdfkit');


class InvoiceService {
  // Create a new invoice
  static createInvoice = async (data) => {
    const invoice = await invoiceRepository.create(data)
    return invoice;
  };

  // Get all invoices
  static getAllInvoices = async () => {
    const invoices = await invoiceRepository.findAll({
      query: { status: 'draft' },
      select: 'invoiceNumber status',  // Selecting only specific fields
      sort: { issueDate: -1 }, // Sort by issue date in descending order
      populate: [{ path: 'customer', select: 'name email' }, { path: 'items' }], // Populate customer and items
    });
    return invoices;
  };

  // Get a single invoice by ID
  static getInvoiceById = async (invoiceId) => {
    const invoice = await invoiceRepository.findOne({ query: { _id: invoiceId }, populate: [{path: 'customer', select: 'name email'}] });
    abortIf(!invoice, httpStatus.NOT_FOUND, 'Invoice not found');
    return invoice;
  };

  // Update an invoice by ID
  static updateInvoice = async (invoiceId, data) => {
    const invoice = await invoiceRepository.update(invoiceId, data);
    abortIf(!invoice, httpStatus.NOT_FOUND, 'Invoice not found');
    return invoice;
  };

  // Delete an invoice by ID
  static deleteInvoice = async (invoiceId) => {
    const invoice = await invoiceRepository.delete(invoiceId);
    abortIf(!invoice, httpStatus.NOT_FOUND, 'Invoice not found');
    return invoice;
  };

  static generateInvoicePDF = async (invoiceId, res) => {
    // Fetch the invoice data from the database
    const invoice = await InvoiceService.getInvoiceById(invoiceId);
    
    abortIf(!invoice, httpStatus.NOT_FOUND, 'Invoice not found');

    // Create a new PDF document
    const doc = new PDFDocument();

    // Pipe the document directly to the response (this will stream the PDF to the client)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice_${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Add Invoice Header
    doc.fontSize(16).text(`Invoice: ${invoice.invoiceNumber}`, { align: 'center' });
    doc.text(`Issued Date: ${invoice.issueDate.toISOString().split('T')[0]}`, { align: 'center' });

    // Add Customer Info
    doc.fontSize(12).text(`Customer: ${invoice.customer.name}`);
    if (invoice.customer.email) doc.text(`Email: ${invoice.customer.email}`);
    if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`);
    
    // Add Invoice Items Table
    doc.moveDown().fontSize(12).text('Items:', { underline: true });
    let tableTop = doc.y;
    let table = {
      headers: ['Description', 'Quantity', 'Unit Price', 'Total'],
      rows: []
    };

    invoice.items.forEach(item => {
      table.rows.push([
        item.description,
        item.quantity,
        `$${item.unitPrice.toFixed(2)}`,
        `$${(item.quantity * item.unitPrice).toFixed(2)}`
      ]);
    });

    // Render table headers
    table.headers.forEach((header, i) => {
      doc.text(header, 50 + (i * 120), tableTop, { width: 100, align: 'center' });
    });

    // Render table rows
    table.rows.forEach((row, rowIndex) => {
      row.forEach((column, columnIndex) => {
        doc.text(column, 50 + (columnIndex * 120), tableTop + (rowIndex + 1) * 20, { width: 100, align: 'center' });
      });
    });

    // Add Subtotal, Tax, and Total
    doc.moveDown().fontSize(12).text(`Subtotal: $${invoice.subtotal.toFixed(2)}`);
    doc.text(`Tax: $${invoice.tax.toFixed(2)}`);
    doc.text(`Total: $${invoice.total.toFixed(2)}`, { underline: true });

    // Finalize PDF document
    doc.end();
  };
}

module.exports = {
  InvoiceService,
};
