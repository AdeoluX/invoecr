const catchAsync = require('../utils/catchAsync');
const { UtilsService } = require('../services');
const { successResponse } = require('../utils/responder');
const httpStatus = require('http-status');

class UtilsController {
  // Signup
  static listBanks = catchAsync(async (req, res, next) => {
    const entity = await UtilsService.listAllBanks()
    return successResponse(req, res, entity, 'Operation Successful');
  });

  static verifyBanks = catchAsync(async (req, res, next) => {
    const { accountNumber, bankCode } = req.body;
    const entity = await UtilsService.verifyBankNumber(accountNumber, bankCode)
    return successResponse(req, res, entity, 'Operation Successful');
  });

  static webhook = catchAsync(async (req, res, next) => {
    successResponse(req, res, {}, 'Operation Successful');
    const data = req.body;
    const entity = await UtilsService.webhook(data)
    return;
  });
}

module.exports = {
  UtilsController,
};
