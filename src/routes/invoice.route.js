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
// Get dashboard summary
router.get(
  `${BASE}/dashboard`,
  Authorization.authenticateToken,
  InvoiceController.getDashboardSummary
);
// Get invoice analytics
router.get(
  `${BASE}/analytics`,
  Authorization.authenticateToken,
  InvoiceController.getInvoiceAnalytics
);

// Template selection routes (must come before /:code routes)
router.get(
  `${BASE}/templates`,
  Authorization.authenticateToken,
  InvoiceController.getAvailableTemplates
);

router.get(
  `${BASE}/templates/:templateId/preview`,
  Authorization.authenticateToken,
  InvoiceController.generateTemplatePreview
);

// Parameterized routes (must come after specific routes)
// PUT and DELETE routes must come before GET routes to avoid conflicts
router.put(
  `${BASE}/:invoiceId`,
  // validateReq(updateInvoiceSchema),
  Authorization.authenticateToken,
  InvoiceController.updateInvoice
);
router.delete(`${BASE}/:invoiceId`, InvoiceController.deleteInvoice);

// GET routes
router.get(`${BASE}/:code/initiate-payment`, InvoiceController.initiatePayment);
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

// Download invoice as PDF
router.get(
  `${BASE}/:code/pdf`,
  Authorization.authenticateToken,
  InvoiceController.downloadInvoicePDF
);

// Download invoice as PDF using HTML templates
router.get(
  `${BASE}/:code/html-pdf`,
  Authorization.authenticateToken,
  InvoiceController.downloadInvoiceHTMLPDF
);

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

module.exports = router;
