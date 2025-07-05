const catchAsync = require('../utils/catchAsync');
const { EntityService } = require('../services');
const { successResponse } = require('../utils/responder');
const httpStatus = require('http-status');

class EntityController {
  static addBank = catchAsync(async (req, res, next) => {
    const { accountNumber, bankCode, isActive } = req.body;
    const user = req.user;
    const addBankService = await EntityService.addBank({ accountNumber, bankCode, userId: user.id, isActive })
    return successResponse(req, res, addBankService, 'Operation Successful');
  });

  static getBanks = catchAsync(async (req, res, next) => {
    const user = req.user;
    const banks = await EntityService.getBanks({ userId: user.id })
    return successResponse(req, res, banks, 'Operation Successful');
  });

  static addLogo = catchAsync(async (req, res, next) => {
    const { accountNumber, bankCode } = req.body;
    const entity = await UtilsService.verifyBankNumber(accountNumber, bankCode)
    return successResponse(req, res, entity, 'Operation Successful');
  });

  static addSignature = catchAsync(async (req, res, next) => {
    const { accountNumber, bankCode } = req.body;
    const entity = await UtilsService.verifyBankNumber(accountNumber, bankCode)
    return successResponse(req, res, entity, 'Operation Successful');
  });

  static editEntity = catchAsync(async (req, res, next) => {
    const entity = req.user;
    const data = req.body;
    const editEntity = await EntityService.editEntity({ data, entity });
    return successResponse(req, res, editEntity, 'Operation Successful');
  })

  static addMember = catchAsync(async (req, res, next) => {
    const entity = req.user;
    const data = req.body;
    const addMember = await EntityService.addMember({ data, entity });
    return successResponse(req, res, addMember, 'Operation Successful');
  })
}

module.exports = {
  EntityController,
};
