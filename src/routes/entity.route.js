const express = require("express");
const { EntityController } = require("../controller/entity.controller");
const { validateReq } = require("../middleware/validate");
const Authorization = require("../utils/authorization.service");
const {
  addBankSchema,
  editEntitySchema,
  addMemberSchema,
} = require("../validations/entity.validations");
const router = express.Router();

const BASE = "/entity";

router.post(
  `${BASE}/add-bank`,
  validateReq(addBankSchema),
  Authorization.authenticateToken,
  EntityController.addBank
);
router.get(
  `${BASE}/get-banks`,
  Authorization.authenticateToken,
  EntityController.getBanks
);
router.post(
  `${BASE}/add-logo`,
  validateReq(addBankSchema),
  Authorization.authenticateToken,
  EntityController.addLogo
);
router.post(
  `${BASE}/add-signature`,
  validateReq(addBankSchema),
  Authorization.authenticateToken,
  EntityController.addSignature
);
//entity
router.patch(
  `${BASE}`,
  validateReq(editEntitySchema),
  Authorization.authenticateToken,
  EntityController.editEntity
);
router.post(
  `${BASE}/add-member`,
  validateReq(addMemberSchema),
  Authorization.authenticateToken,
  EntityController.addMember
);

module.exports = router;
