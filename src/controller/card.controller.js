const catchAsync = require("../utils/catchAsync");
const CardService = require("../services/card.service");
const { successResponse } = require("../utils/responder");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status");

class CardController {
  // Initialize card saving process
  static initializeCardSave = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { callbackUrl } = req.body;

    abortIf(!callbackUrl, httpStatus.BAD_REQUEST, "Callback URL is required");

    const result = await CardService.initializeCardSave(
      user.id,
      user.email,
      callbackUrl
    );

    return successResponse(req, res, result);
  });

  // Save card after payment verification (for testing purposes only)
  static saveCard = catchAsync(async (req, res, next) => {
    const { reference } = req.body;

    abortIf(
      !reference,
      httpStatus.BAD_REQUEST,
      "Payment reference is required"
    );

    // Note: In production, cards are saved via Paystack webhook
    // This endpoint is for testing/fallback only
    const result = await CardService.saveCard(reference);
    return successResponse(req, res, result);
  });

  // Get all cards for entity
  static getCards = catchAsync(async (req, res, next) => {
    const user = req.user;

    const result = await CardService.getEntityCards(user.id);
    return successResponse(req, res, result);
  });

  // Set default card
  static setDefaultCard = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { cardId } = req.body;

    abortIf(!cardId, httpStatus.BAD_REQUEST, "Card ID is required");

    const result = await CardService.setDefaultCard(user.id, cardId);
    return successResponse(req, res, result);
  });

  // Remove card
  static removeCard = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { cardId } = req.params;

    abortIf(!cardId, httpStatus.BAD_REQUEST, "Card ID is required");

    const result = await CardService.removeCard(user.id, cardId);
    return successResponse(req, res, result);
  });

  // Charge a saved card
  static chargeCard = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { amount, description, cardId } = req.body;

    abortIf(!amount, httpStatus.BAD_REQUEST, "Amount is required");
    abortIf(!description, httpStatus.BAD_REQUEST, "Description is required");

    const result = await CardService.chargeCard(
      user.id,
      amount,
      user.email,
      description,
      cardId
    );

    return successResponse(req, res, result);
  });

  // Check card save status (for testing webhook)
  static checkCardStatus = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { reference } = req.query;

    if (!reference) {
      return successResponse(req, res, {
        message: "Please provide a payment reference to check card status",
      });
    }

    // Check if card was saved via webhook
    const cards = await CardService.getEntityCards(user.id);
    const savedCard = cards.cards.find(
      (card) =>
        card.authorizationCode && card.authorizationCode.includes(reference)
    );

    if (savedCard) {
      return successResponse(req, res, {
        success: true,
        message: "Card was saved successfully via webhook",
        card: savedCard,
      });
    } else {
      return successResponse(req, res, {
        success: false,
        message:
          "Card not found. It may still be processing or the webhook hasn't been received yet.",
        reference: reference,
      });
    }
  });
}

module.exports = {
  CardController,
};
