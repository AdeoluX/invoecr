const express = require("express");
const { UtilsController } = require("../controller/utils.controller");
const { validateReq } = require("../middleware/validate");
const { verifyBankAccount } = require("../validations/utils.validations");
const router = express.Router();

const BASE = "/webhook";

// Webhook endpoint - no authentication required (Paystack calls this)
router.post(`${BASE}`, UtilsController.webhook);

module.exports = router;
