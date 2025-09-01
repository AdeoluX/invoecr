const SubscriptionPlan = require("../models/subscription.model");
const Entity = require("../models/entity.model");
const CardService = require("./card.service");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;

class SubscriptionService {
  /**
   * Get all available subscription plans
   * @returns {Promise<Array>} Available plans
   */
  static async getAvailablePlans() {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .select("-__v")
      .sort({ price: 1 });

    return plans;
  }

  /**
   * Get plan by name
   * @param {string} planName - Plan name
   * @returns {Promise<Object>} Plan details
   */
  static async getPlanByName(planName) {
    const plan = await SubscriptionPlan.findOne({
      name: planName,
      isActive: true,
    });

    abortIf(!plan, httpStatus.NOT_FOUND, "Subscription plan not found");
    return plan;
  }

  /**
   * Get entity's current subscription
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Entity with subscription details
   */
  static async getEntitySubscription(entityId) {
    const entity = await Entity.findById(entityId)
      .populate("subscriptionPlan")
      .select(
        "subscriptionPlan subscriptionStatus subscriptionExpiry subscriptionStartDate invoicesCreated customersCreated teamMembersCount"
      );

    abortIf(!entity, httpStatus.NOT_FOUND, "Entity not found");

    // If no subscription plan is set, get the free plan
    let plan;
    if (!entity.subscriptionPlan) {
      plan = await this.getPlanByName("free");
    } else {
      plan = entity.subscriptionPlan;
    }

    return {
      entity,
      plan,
      usage: {
        invoicesCreated: entity.invoicesCreated,
        customersCreated: entity.customersCreated,
        teamMembersCount: entity.teamMembersCount,
      },
      limits: {
        maxInvoices: plan.maxInvoices,
        maxCustomers: plan.maxCustomers,
        maxTeamMembers: plan.maxTeamMembers,
      },
    };
  }

  /**
   * Check if entity can create invoice
   * @param {string} entityId - Entity ID
   * @returns {Promise<boolean>} Can create invoice
   */
  static async canCreateInvoice(entityId) {
    const subscription = await this.getEntitySubscription(entityId);

    // Free plan has unlimited invoices
    if (subscription.plan.maxInvoices === -1) {
      return true;
    }

    return subscription.usage.invoicesCreated < subscription.plan.maxInvoices;
  }

  /**
   * Check if entity can create customer
   * @param {string} entityId - Entity ID
   * @returns {Promise<boolean>} Can create customer
   */
  static async canCreateCustomer(entityId) {
    const subscription = await this.getEntitySubscription(entityId);

    // Free plan has unlimited customers
    if (subscription.plan.maxCustomers === -1) {
      return true;
    }

    return subscription.usage.customersCreated < subscription.plan.maxCustomers;
  }

  /**
   * Check if entity can access feature
   * @param {string} entityId - Entity ID
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>} Can access feature
   */
  static async canAccessFeature(entityId, feature) {
    const subscription = await this.getEntitySubscription(entityId);

    return subscription.plan.features[feature] === true;
  }

  /**
   * Update entity usage counters
   * @param {string} entityId - Entity ID
   * @param {string} type - Type of usage (invoice, customer, teamMember)
   * @param {number} increment - Amount to increment
   * @returns {Promise<Object>} Updated entity
   */
  static async updateUsage(entityId, type, increment = 1) {
    const updateField = {};

    switch (type) {
      case "invoice":
        updateField.invoicesCreated = increment;
        break;
      case "customer":
        updateField.customersCreated = increment;
        break;
      case "teamMember":
        updateField.teamMembersCount = increment;
        break;
      default:
        throw new Error("Invalid usage type");
    }

    const entity = await Entity.findByIdAndUpdate(
      entityId,
      { $inc: updateField },
      { new: true }
    );

    return entity;
  }

  /**
   * Upgrade entity subscription
   * @param {string} entityId - Entity ID
   * @param {string} newPlan - New plan name
   * @returns {Promise<Object>} Updated entity
   */
  static async upgradeSubscription(entityId, newPlan) {
    const plan = await this.getPlanByName(newPlan);

    const updateData = {
      subscriptionPlan: plan._id,
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    const entity = await Entity.findByIdAndUpdate(entityId, updateData, {
      new: true,
    });

    return entity;
  }

  /**
   * Upgrade subscription with payment
   * @param {string} entityId - Entity ID
   * @param {string} newPlan - New plan name
   * @param {string} email - Customer email
   * @param {string} cardId - Optional card ID (uses default if not provided)
   * @returns {Promise<Object>} Upgrade result with payment details
   */
  static async upgradeSubscriptionWithPayment(
    entityId,
    newPlan,
    email,
    cardId = null
  ) {
    try {
      const plan = await this.getPlanByName(newPlan);

      // Check if plan is free
      if (plan.price === 0) {
        // Free plan - upgrade immediately
        const updatedEntity = await this.upgradeSubscription(entityId, newPlan);
        return {
          success: true,
          isFree: true,
          message: "Subscription upgraded to free plan",
          subscription: newPlan,
          status: updatedEntity.subscriptionStatus,
          amount: 0,
          currency: plan.currency,
        };
      }

      // Paid plan - charge the card
      const chargeResult = await CardService.chargeCard(
        entityId,
        plan.price,
        email,
        `Subscription upgrade to ${plan.displayName} plan`,
        cardId
      );

      if (chargeResult.success) {
        // Payment successful - upgrade subscription
        const updatedEntity = await this.upgradeSubscription(entityId, newPlan);

        return {
          success: true,
          isFree: false,
          message: "Subscription upgraded successfully",
          subscription: newPlan,
          status: updatedEntity.subscriptionStatus,
          payment: {
            success: true,
            reference: chargeResult.reference,
            amount: chargeResult.amount,
            currency: chargeResult.currency,
            card: chargeResult.card,
          },
        };
      } else {
        // Payment failed
        return {
          success: false,
          message: "Payment failed: " + chargeResult.message,
          payment: chargeResult,
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
   * Downgrade entity subscription
   * @param {string} entityId - Entity ID
   * @param {string} newPlan - New plan name
   * @returns {Promise<Object>} Updated entity
   */
  static async downgradeSubscription(entityId, newPlan) {
    const plan = await this.getPlanByName(newPlan);

    // Check if current usage exceeds new plan limits
    const currentUsage = await this.getEntitySubscription(entityId);

    if (
      plan.maxInvoices !== -1 &&
      currentUsage.usage.invoicesCreated > plan.maxInvoices
    ) {
      abortIf(
        true,
        httpStatus.BAD_REQUEST,
        "Cannot downgrade: current invoice count exceeds new plan limit"
      );
    }

    if (
      plan.maxCustomers !== -1 &&
      currentUsage.usage.customersCreated > plan.maxCustomers
    ) {
      abortIf(
        true,
        httpStatus.BAD_REQUEST,
        "Cannot downgrade: current customer count exceeds new plan limit"
      );
    }

    const updateData = {
      subscriptionPlan: plan._id,
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    const entity = await Entity.findByIdAndUpdate(entityId, updateData, {
      new: true,
    });

    return entity;
  }

  /**
   * Get subscription comparison for pricing page
   * @returns {Promise<Array>} Plans with comparison
   */
  static async getSubscriptionComparison() {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .select(
        "name displayName price currency features maxInvoices maxCustomers maxTeamMembers isPopular description benefits"
      )
      .sort({ price: 1 });

    return plans.map((plan) => ({
      ...plan.toObject(),
      features: Object.entries(plan.features).map(([key, value]) => ({
        name: key,
        enabled: value,
      })),
    }));
  }

  /**
   * Check subscription expiry and update status
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Updated entity
   */
  static async checkAndUpdateSubscriptionStatus(entityId) {
    const entity = await Entity.findById(entityId);

    if (!entity) {
      throw new Error("Entity not found");
    }

    // Check if subscription has expired
    if (entity.subscriptionExpiry && entity.subscriptionExpiry < new Date()) {
      // Get free plan
      const freePlan = await this.getPlanByName("free");

      // Downgrade to free plan if expired
      const updateData = {
        subscriptionPlan: freePlan._id,
        subscriptionStatus: "expired",
        subscriptionExpiry: null,
      };

      const updatedEntity = await Entity.findByIdAndUpdate(
        entityId,
        updateData,
        { new: true }
      );

      return updatedEntity;
    }

    return entity;
  }

  /**
   * Initialize entity with free subscription plan
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Updated entity
   */
  static async initializeEntitySubscription(entityId) {
    const entity = await Entity.findById(entityId);

    if (!entity) {
      throw new Error("Entity not found");
    }

    // If entity already has a subscription plan, don't change it
    if (entity.subscriptionPlan) {
      return entity;
    }

    // Get free plan
    const freePlan = await this.getPlanByName("free");

    // Assign free plan to entity
    const updateData = {
      subscriptionPlan: freePlan._id,
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
    };

    const updatedEntity = await Entity.findByIdAndUpdate(entityId, updateData, {
      new: true,
    });

    return updatedEntity;
  }

  /**
   * Check if entity has saved cards for payment
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} Payment readiness status
   */
  static async checkPaymentReadiness(entityId) {
    try {
      const cards = await CardService.getEntityCards(entityId);

      if (!cards.success || cards.cards.length === 0) {
        return {
          hasCards: false,
          defaultCard: null,
          message: "No saved cards found",
        };
      }

      const defaultCard = cards.cards.find((card) => card.isDefault);

      return {
        hasCards: true,
        defaultCard: defaultCard || cards.cards[0],
        totalCards: cards.cards.length,
        message: "Saved cards found",
      };
    } catch (error) {
      return {
        hasCards: false,
        defaultCard: null,
        message: error.message,
      };
    }
  }
}

module.exports = SubscriptionService;
