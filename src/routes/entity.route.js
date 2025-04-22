const express = require('express');
const {
  EntityController,
} = require('../controller/entity.controller');
const { validateReq } = require('../middleware/validate');
const Authorization = require('../utils/authorization.service');
const { addBankSchema } = require('../validations/entity.validations');
const router = express.Router();

const BASE = '/entity';

router.post(`${BASE}/add-bank`, validateReq(addBankSchema), Authorization.authenticateToken, EntityController.addBank);
router.get(`${BASE}/get-bank`, Authorization.authenticateToken, EntityController.getBanks);
router.post(`${BASE}/add-logo`, validateReq(addBankSchema), Authorization.authenticateToken, EntityController.addLogo);
router.post(`${BASE}/add-signature`, validateReq(addBankSchema), Authorization.authenticateToken, EntityController.addSignature);

module.exports = router;
