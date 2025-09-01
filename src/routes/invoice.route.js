const express = require("express");
const { InvoiceController } = require("../controller/invoice.controller");
const { validateReq } = require("../middleware/validate");
const {
  createInvoiceSchema,
  updateInvoiceSchema,
} = require("../validations/invoice.validations");
const Authorization = require("../utils/authorization.service");
const router = express.Router();

const BASE = "/invoice";

// Invoice routes
router.post(
  `${BASE}`,
  validateReq(createInvoiceSchema),
  Authorization.authenticateToken,
  InvoiceController.createInvoice
);
router.get(
  `${BASE}`,
  Authorization.authenticateToken,
  InvoiceController.getAllInvoices
);
router.post(
  `${BASE}/:code/initiate-payment`,
  InvoiceController.initiatePayment
);
router.get(
  `${BASE}/:code`,
  Authorization.authenticateToken,
  InvoiceController.getInvoiceById
);
router.get(
  `${BASE}/:code/download`,
  Authorization.authenticateToken,
  InvoiceController.downloadInvoiceById
);
router.put(
  `${BASE}/:invoiceId`,
  validateReq(updateInvoiceSchema),
  InvoiceController.updateInvoice
);
router.delete(`${BASE}/:invoiceId`, InvoiceController.deleteInvoice);

// Nigeria-specific routes

// Share invoice via WhatsApp
router.post(
  `${BASE}/:code/share-whatsapp`,
  Authorization.authenticateToken,
  InvoiceController.shareViaWhatsApp
);

// Share PDF invoice via WhatsApp
router.post(
  `${BASE}/:code/share-pdf-whatsapp`,
  Authorization.authenticateToken,
  InvoiceController.sharePDFInvoiceViaWhatsApp
);

// Get invoice analytics
router.get(
  `${BASE}/analytics`,
  Authorization.authenticateToken,
  InvoiceController.getInvoiceAnalytics
);

// Get dashboard summary
router.get(
  `${BASE}/dashboard`,
  Authorization.authenticateToken,
  InvoiceController.getDashboardSummary
);

module.exports = router;
