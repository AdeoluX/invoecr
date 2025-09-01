const catchAsync = require("../utils/catchAsync");
const { UtilsService } = require("../services");
const { successResponse } = require("../utils/responder");
const httpStatus = require("http-status");

class UtilsController {
  // Signup
  static listBanks = catchAsync(async (req, res, next) => {
    const entity = await UtilsService.listAllBanks();
    return successResponse(req, res, entity, "Operation Successful");
  });

  static verifyBanks = catchAsync(async (req, res, next) => {
    const { accountNumber, bankCode } = req.body;
    const entity = await UtilsService.verifyBankNumber(accountNumber, bankCode);
    return successResponse(req, res, entity, "Operation Successful");
  });

  static webhook = catchAsync(async (req, res, next) => {
    const data = req.body;
    const signature = req.headers["x-paystack-signature"];

    try {
      const result = await UtilsService.webhook(data, signature);
      return successResponse(
        req,
        res,
        result,
        "Webhook processed successfully"
      );
    } catch (error) {
      console.error("Webhook processing error:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });
}

module.exports = {
  UtilsController,
};
