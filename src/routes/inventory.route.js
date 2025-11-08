const express = require("express");
const { InventoryController } = require("../controller/inventory.controller");
const { validateReq } = require("../middleware/validate");
const Authorization = require("../utils/authorization.service");
const {
  createInventorySchema,
  updateInventorySchema,
} = require("../validations/inventory.validations");
const router = express.Router();

const BASE = "/inventory";

router.post(
  `${BASE}`,
  validateReq(createInventorySchema),
  Authorization.authenticateToken,
  InventoryController.createInventory
);

router.get(
  `${BASE}`,
  Authorization.authenticateToken,
  InventoryController.getInventories
);

router.get(
  `${BASE}/:inventoryId`,
  Authorization.authenticateToken,
  InventoryController.getInventoryById
);

router.patch(
  `${BASE}/:inventoryId`,
  validateReq(updateInventorySchema),
  Authorization.authenticateToken,
  InventoryController.updateInventory
);

router.delete(
  `${BASE}/:inventoryId`,
  Authorization.authenticateToken,
  InventoryController.deleteInventory
);

module.exports = router;
