const Card = require("../models/card.model");
const baseRepo = require("./base.repo");

class CardRepository extends baseRepo {
  constructor() {
    super(Card);
  }

  /**
   * Get all active cards for an entity
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} Array of cards
   */
  async getEntityCards(entityId) {
    return await this.findAll({
      query: { entity: entityId, isActive: true },
      sort: { isDefault: -1, createdAt: -1 },
    });
  }

  /**
   * Get default card for an entity
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Default card
   */
  async getDefaultCard(entityId) {
    return await this.findOne({
      query: { entity: entityId, isDefault: true, isActive: true },
    });
  }

  /**
   * Set a card as default
   * @param {string} cardId - Card ID
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Updated card
   */
  async setDefaultCard(cardId, entityId) {
    // First, remove default from all other cards
    await this.updateMany(
      { entity: entityId, _id: { $ne: cardId } },
      { isDefault: false }
    );

    // Set the specified card as default
    return await this.update(cardId, { isDefault: true });
  }

  /**
   * Deactivate a card
   * @param {string} cardId - Card ID
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Updated card
   */
  async deactivateCard(cardId, entityId) {
    const card = await this.findOne({
      query: { _id: cardId, entity: entityId },
    });

    if (!card) {
      throw new Error("Card not found");
    }

    // If this is the default card, set another card as default
    if (card.isDefault) {
      const otherCard = await this.findOne({
        query: { entity: entityId, _id: { $ne: cardId }, isActive: true },
      });

      if (otherCard) {
        await this.update(otherCard._id, { isDefault: true });
      }
    }

    return await this.update(cardId, { isActive: false });
  }

  /**
   * Check if authorization code already exists
   * @param {string} authorizationCode - Paystack authorization code
   * @returns {Promise<boolean>} True if exists
   */
  async authorizationCodeExists(authorizationCode) {
    const card = await this.findOne({
      query: { authorizationCode },
    });
    return !!card;
  }
}

module.exports = new CardRepository();
