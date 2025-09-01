const cardRepo = require("../repo/card.repo");
const { PaystackPaymentGateway } = require("../utils/paystack.utils");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;

class CardService {
  /**
   * Initialize card saving process
   * @param {string} entityId - Entity ID
   * @param {string} email - Customer email
   * @param {string} callbackUrl - Payment callback URL
   * @returns {Promise<Object>} Payment initialization response
   */
  static async initializeCardSave(entityId, email, callbackUrl) {
    try {
      const paystack = new PaystackPaymentGateway();

      const paymentData = {
        email: email,
        amount: 100, // ₦1.00 verification charge
        currency: "NGN",
        callback_url: callbackUrl,
        metadata: {
          entityId: entityId,
          type: "card_save",
          purpose: "card_verification",
        },
        channels: ["card"],
        reference: `CARD_SAVE_${entityId}_${Date.now()}`,
        description: "Card verification for saving",
      };

      const paymentResponse = await paystack.initializeTransaction(paymentData);

      if (paymentResponse.status) {
        return {
          success: true,
          paymentUrl: paymentResponse.data.authorization_url,
          reference: paymentResponse.data.reference,
          amount: 1, // ₦1.00
          currency: "NGN",
        };
      } else {
        return {
          success: false,
          message: paymentResponse.message || "Card save initialization failed",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Save card after successful payment verification
   * @param {string} reference - Payment reference
   * @returns {Promise<Object>} Card save result
   */
  static async saveCard(reference) {
    try {
      const paystack = new PaystackPaymentGateway();
      const verificationResponse = await paystack.verifyTransaction(reference);

      if (
        verificationResponse.status &&
        verificationResponse.data.status === "success"
      ) {
        const metadata = verificationResponse.data.metadata;
        const entityId = metadata.entityId;
        const authorization = verificationResponse.data.authorization;

        // Check if card already exists
        const cardExists = await cardRepo.authorizationCodeExists(
          authorization.authorization_code
        );
        if (cardExists) {
          return {
            success: false,
            message: "Card already saved",
          };
        }

        // Save card details
        const cardData = {
          entity: entityId,
          authorizationCode: authorization.authorization_code,
          cardType: authorization.card_type,
          last4: authorization.last4,
          expMonth: authorization.exp_month,
          expYear: authorization.exp_year,
          bank: authorization.bank,
          countryCode: authorization.country_code,
          brand: authorization.brand,
          isDefault: false, // Will be set to true if it's the first card
        };

        // Check if this is the first card (make it default)
        const existingCards = await cardRepo.getEntityCards(entityId);
        if (existingCards.length === 0) {
          cardData.isDefault = true;
        }

        const savedCard = await cardRepo.create(cardData);

        return {
          success: true,
          message: "Card saved successfully",
          card: {
            id: savedCard._id,
            last4: savedCard.last4,
            brand: savedCard.brand,
            cardType: savedCard.cardType,
            isDefault: savedCard.isDefault,
            expMonth: savedCard.expMonth,
            expYear: savedCard.expYear,
          },
        };
      } else {
        return {
          success: false,
          message: "Payment verification failed",
          details: verificationResponse.data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Charge a saved card
   * @param {string} entityId - Entity ID
   * @param {string} cardId - Card ID (optional, uses default if not provided)
   * @param {number} amount - Amount in Naira
   * @param {string} email - Customer email
   * @param {string} description - Payment description
   * @returns {Promise<Object>} Charge result
   */
  static async chargeCard(entityId, amount, email, description, cardId = null) {
    try {
      // Get card to charge
      let card;
      if (cardId) {
        card = await cardRepo.findOne({
          query: { _id: cardId, entity: entityId, isActive: true },
        });
      } else {
        card = await cardRepo.getDefaultCard(entityId);
      }

      if (!card) {
        return {
          success: false,
          message: cardId ? "Card not found" : "No default card found",
        };
      }

      const paystack = new PaystackPaymentGateway();

      const chargeData = {
        authorization_code: card.authorizationCode,
        email: email,
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        reference: `CHARGE_${entityId}_${Date.now()}`,
        description: description,
      };

      const chargeResponse = await paystack.chargeAuthorization(chargeData);

      if (chargeResponse.status) {
        return {
          success: true,
          message: "Payment successful",
          reference: chargeResponse.data.reference,
          amount: amount,
          currency: "NGN",
          card: {
            last4: card.last4,
            brand: card.brand,
          },
          paymentDetails: {
            gateway: "paystack",
            status: chargeResponse.data.status,
            paidAt: chargeResponse.data.paid_at,
          },
        };
      } else {
        return {
          success: false,
          message: chargeResponse.message || "Payment failed",
          details: chargeResponse.data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get all cards for an entity
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} Array of cards
   */
  static async getEntityCards(entityId) {
    try {
      const cards = await cardRepo.getEntityCards(entityId);

      return {
        success: true,
        cards: cards.map((card) => ({
          id: card._id,
          last4: card.last4,
          brand: card.brand,
          cardType: card.cardType,
          expMonth: card.expMonth,
          expYear: card.expYear,
          bank: card.bank,
          isDefault: card.isDefault,
          cardName: card.cardName,
          createdAt: card.createdAt,
        })),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Set a card as default
   * @param {string} entityId - Entity ID
   * @param {string} cardId - Card ID
   * @returns {Promise<Object>} Update result
   */
  static async setDefaultCard(entityId, cardId) {
    try {
      const updatedCard = await cardRepo.setDefaultCard(cardId, entityId);

      return {
        success: true,
        message: "Default card updated successfully",
        card: {
          id: updatedCard._id,
          last4: updatedCard.last4,
          brand: updatedCard.brand,
          isDefault: updatedCard.isDefault,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Remove a card
   * @param {string} entityId - Entity ID
   * @param {string} cardId - Card ID
   * @returns {Promise<Object>} Removal result
   */
  static async removeCard(entityId, cardId) {
    try {
      const updatedCard = await cardRepo.deactivateCard(cardId, entityId);

      return {
        success: true,
        message: "Card removed successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Save card from webhook (called by Paystack webhook)
   * @param {string} entityId - Entity ID
   * @param {Object} authorization - Paystack authorization object
   * @returns {Promise<Object>} Save result
   */
  static async saveCardFromWebhook(entityId, authorization) {
    try {
      // Check if card already exists
      const cardExists = await cardRepo.authorizationCodeExists(
        authorization.authorization_code
      );
      if (cardExists) {
        return {
          success: false,
          message: "Card already saved",
        };
      }

      // Save card details
      const cardData = {
        entity: entityId,
        authorizationCode: authorization.authorization_code,
        cardType: authorization.card_type,
        last4: authorization.last4,
        expMonth: authorization.exp_month,
        expYear: authorization.exp_year,
        bank: authorization.bank,
        countryCode: authorization.country_code,
        brand: authorization.brand,
        isDefault: false, // Will be set to true if it's the first card
      };

      // Check if this is the first card (make it default)
      const existingCards = await cardRepo.getEntityCards(entityId);
      if (existingCards.length === 0) {
        cardData.isDefault = true;
      }

      const savedCard = await cardRepo.create(cardData);

      return {
        success: true,
        message: "Card saved successfully via webhook",
        card: {
          id: savedCard._id,
          last4: savedCard.last4,
          brand: savedCard.brand,
          cardType: savedCard.cardType,
          isDefault: savedCard.isDefault,
          expMonth: savedCard.expMonth,
          expYear: savedCard.expYear,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

module.exports = CardService;
