const express = require("express");
const { CustomerController } = require("../controller/customer.controller");
const { validateReq } = require("../middleware/validate");
const Authorization = require("../utils/authorization.service");
const {
  createCustomerSchema,
  updateCustomerSchema,
} = require("../validations/customer.validations");
const router = express.Router();

const BASE = "/customer";

// Customer routes
router.post(
  `${BASE}`,
  validateReq(createCustomerSchema),
  Authorization.authenticateToken,
  CustomerController.createCustomer
);

router.get(
  `${BASE}`,
  Authorization.authenticateToken,
  CustomerController.getAllCustomers
);

router.get(
  `${BASE}/:id`,
  Authorization.authenticateToken,
  CustomerController.getCustomerById
);

router.put(
  `${BASE}/:id`,
  validateReq(updateCustomerSchema),
  Authorization.authenticateToken,
  CustomerController.updateCustomer
);

router.delete(
  `${BASE}/:id`,
  Authorization.authenticateToken,
  CustomerController.deleteCustomer
);

module.exports = router;
