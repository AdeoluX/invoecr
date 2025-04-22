const Invoice = require('../models/invoice.model');
const { abortIf } = require('../utils/responder');
const httpStatus = require('http-status').default;
const invoiceRepository = require('../repo/invoice.repo');
const customerRepository = require('../repo/customer.repo');
const PDFDocument = require('pdfkit');
const getPagination = require('../utils/pagination');
const { default: mongoose } = require('mongoose');
const { generateInvoice } = require('../utils/invoice');
const { PaystackPaymentGateway } = require('../utils/paystack.utils');
const transactionRepo = require('../repo/transaction.repo');
const bankRepo = require('../repo/bankAccount.repo');


class InvoiceService {
  // Create a new invoice
  static createInvoice = async (data, entity_id) => {
    let customer;
    abortIf(!data.customer && !data.customerId, httpStatus.BAD_REQUEST, 'Customer is required');
    if(data.customerId){
      customer = await customerRepository.findOne({ query: { _id: data.customerId } });
      abortIf(!customer, httpStatus.NOT_FOUND, 'Customer not found');
    }else if(data.customer){
      customer = await customerRepository.create({
        ...data.customer,
        entity: entity_id,
      })
      abortIf(!customer, httpStatus.BAD_REQUEST, 'Error creating customer');
    }
    const { customer: user, customer_id, ...rest } = data;
    const invoice = await invoiceRepository.create({...rest, customer: customer._id, entity: entity_id, status: 'draft' });
    abortIf(!invoice, httpStatus.BAD_REQUEST, 'Error creating invoice');
    return invoice;
  };

  // Get all invoices
  static getAllInvoices = async (entity_id, filters = {}) => {
    let {
      status,
      search,
      customerCode,
      gteAmount,
      lteAmount,
      startDate,
      endDate,
      orderBy = 'issueDate',
      orderDirection = 'desc',
      page = 1,
      perPage = 10
    } = filters;
  
    const matchStage = {
      entity: new mongoose.Types.ObjectId(entity_id),
    };
  
    if (status) {
      matchStage.status = { $in: status.split(',') };
    }
  
    if (gteAmount || lteAmount) {
      matchStage.subtotal = {};
      if (gteAmount) matchStage.subtotal.$gte = Number(gteAmount);
      if (lteAmount) matchStage.subtotal.$lte = Number(lteAmount);
    }
  
    if (startDate || endDate) {
      matchStage.issueDate = {};
      if (startDate) {
        const start = new Date(startDate);
        abortIf(isNaN(start.getTime()), httpStatus.BAD_REQUEST, 'Invalid startDate format');
        matchStage.issueDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        abortIf(isNaN(end.getTime()), httpStatus.BAD_REQUEST, 'Invalid endDate format');
        end.setHours(23, 59, 59, 999);
        matchStage.issueDate.$lte = end;
      }
    }
  
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customer'
        }
      },
      { $unwind: '$customer' },
      {
        $lookup: {
          from: 'entities',
          localField: 'entity',
          foreignField: '_id',
          as: 'entity'
        }
      },
      { $unwind: '$entity' }
    ];
  
    // Handle customerCode and search
    const searchMatch = {};
    if (customerCode) {
      searchMatch['customer.code'] = customerCode;
    }
    if (search) {
      searchMatch.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
      if (!customerCode) {
        searchMatch.$or.push({ 'customer.code': { $regex: search, $options: 'i' } });
      }
    }
    if (Object.keys(searchMatch).length > 0) {
      pipeline.push({ $match: searchMatch });
    }
  
    // Sorting
    const sort = {};
    const validOrderFields = ['issueDate', 'dueDate', 'subtotal', 'invoiceNumber', 'status'];
    if (!validOrderFields.includes(orderBy)) {
      throw new Error(`Invalid orderBy field. Must be one of: ${validOrderFields.join(', ')}`);
    }
    const validDirections = ['asc', 'desc'];
    if (!validDirections.includes(orderDirection)) {
      throw new Error(`Invalid orderDirection. Must be one of: ${validDirections.join(', ')}`);
    }
    sort[orderBy] = orderDirection === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sort });
  
    // Pagination
    const pagination = getPagination(page, perPage);
    const { skip, limit } = pagination;
    pipeline.push({ $skip: skip }, { $limit: limit });
  
    // Projection
    pipeline.push({
      $project: {
        invoiceNumber: 1,
        status: 1,
        subtotal: 1,
        issueDate: 1,
        dueDate: 1,
        'customer.name': 1,
        'customer.email': 1,
        'customer.code': 1,
        items: 1,
        'entity.name': 1
      }
    });
  
    // Execute the aggregation pipeline
    const invoices = await invoiceRepository.aggregate(pipeline);
  
    // Count total documents
    const countPipeline = [
      { $match: matchStage },
      { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' }
    ];
    if (Object.keys(searchMatch).length > 0) {
      countPipeline.push({ $match: searchMatch });
    }
    countPipeline.push({ $count: 'total' });
    const countResult = await invoiceRepository.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;
  
    // Calculate total pages
    const totalPages = Math.ceil(total / pagination.perPage);
  
    return {
      invoices,
      pagination: {
        total,
        page: pagination.page,
        perPage: pagination.perPage,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1
      }
    };
  };
  

  // Get a single invoice by ID
  static getInvoiceById = async (code, entity_id) => {
    const invoice = await invoiceRepository.findOne({ query: { invoiceNumber: code, entity: entity_id }, populate: [{path: 'customer', select: 'name email'}, {path: 'entity'}] });
    abortIf(!invoice, httpStatus.NOT_FOUND, 'Invoice not found');
    return invoice;
  };

  static downloadInvoiceById = async (code, entity_id) => {
    const invoice = await invoiceRepository.findOne({ query: { invoiceNumber: code, entity: entity_id }, populate: [{path: 'customer', select: 'name email'}, {path: 'entity'}] });
    abortIf(!invoice, httpStatus.NOT_FOUND, 'Invoice not found');
    const generatePDF = await generateInvoice({
      ...invoice.toJSON(), 
      businessName: invoice.entity.name, 
      logoPath: invoice?.entity?.logo || '',
      paymentLink: `${process.env.APP_URL}/payment/${invoice.invoiceNumber}`,
      vatRate: (invoice.tax / invoice.subtotal) * 100,
    }, code);
    return invoice;
  }

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

  static initiatePayment = async (code) => {
    const invoice = await invoiceRepository.findOne({ query: { invoiceNumber: code }, populate: [{path: 'customer', select: 'name email'}, {path: 'entity'}] });
    abortIf(!invoice, httpStatus.NOT_FOUND, 'Invoice not found');
    abortIf(['paid'].includes(invoice.status), httpStatus.BAD_REQUEST, 'Invoice is in draft status');
    let reference = crypto.randomUUID().split('-').join('').slice(0, 17)
    const getSubAccount = await bankRepo.findOne({
      query: {
        entity: invoice.entity,
        isActive: true
      }
    })
    const transaction = await transactionRepo.create({
      customer: invoice.customer._id,
      entity: invoice.entity._id,
      invoice: invoice._id,
      amount: invoice.total,
      currency: 'NGN',
      type: 'PAYMENT',
      status: 'PENDING',
      channel: 'PAYSTACK',
      reference,
      description: `Payment for invoice ${invoice.invoiceNumber}`,
    });
    const paystackGateway = new PaystackPaymentGateway();
    const paymentResponse = await paystackGateway.initiatePayment({
      email: invoice.customer.email,
      amount: invoice.total * 100,
      reference,
      subaccount: getSubAccount.subAccountCode,
      metadata: {
        custom_fields: [
          {
            display_name: 'Company',
            variable_name: 'company_name',
            value: invoice.entity.name
          },
          {
            display_name: 'Logo',
            variable_name: 'logo_url',
            value: invoice?.entity?.logo || ''
          }
        ]
      },
    });
    abortIf(!paymentResponse.success, httpStatus.BAD_REQUEST, paymentResponse.message);
    return paymentResponse;
  }
}

module.exports = {
  InvoiceService,
};
