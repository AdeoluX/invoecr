const express = require('express');
const {
  InvoiceController,
} = require('../controller/invoice.controller');
const { validateReq } = require('../middleware/validate');
const { createInvoiceSchema } = require('../validations/invoice.validations');
const router = express.Router();

const BASE = '/invoice';

// Invoice routes
router.post(`${BASE}`, validateReq(createInvoiceSchema), InvoiceController.createInvoice);
router.get(`${BASE}`, InvoiceController.getAllInvoices);
router.get(`${BASE}/:invoiceId`, InvoiceController.getInvoiceById);
router.put(`${BASE}/:invoiceId`, InvoiceController.updateInvoice);
router.delete(`${BASE}/:invoiceId`, InvoiceController.deleteInvoice);

module.exports = router;
