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
router.get(
  `${BASE}`,
  Authorization.authenticateToken,
  EntityController.getEntity
);
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
  Authorization.authenticateToken,
  EntityController.addLogo
);
router.post(
  `${BASE}/add-signature`,
  Authorization.authenticateToken,
  EntityController.addSignature
);
router.delete(
  `${BASE}/remove-logo`,
  Authorization.authenticateToken,
  EntityController.removeLogo
);
router.delete(
  `${BASE}/remove-signature`,
  Authorization.authenticateToken,
  EntityController.removeSignature
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
