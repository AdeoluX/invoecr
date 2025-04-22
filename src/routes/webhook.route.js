const express = require('express');
const { 
    UtilsController
} = require('../controller/utils.controller');
const { validateReq } = require('../middleware/validate');
const { verifyBankAccount } = require('../validations/utils.validations');
const router = express.Router();

const BASE = '/webhook';

router.post(`${BASE}`, UtilsController.webhook);

module.exports = router;
