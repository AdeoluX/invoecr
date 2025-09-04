const SubscriptionPlan = require("../models/subscription.model");
const Entity = require("../models/entity.model");
const CardService = require("./card.service");
const { abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;

// Constants
const SUBSCRIPTION_DURATION_DAYS = 30;
const FREE_PLAN_NAME = "free";
const RENEWAL_CHECK_DAYS = 7;

// Simple in-memory cache for plans (in production, use Redis or similar)
const planCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class SubscriptionService {
  /**
   * Handle duplicate key errors gracefully
   * @param {Error} error - The error object
   * @param {string} field - The field that caused the duplicate error
   * @returns {string} User-friendly error message
   */
  static handleDuplicateKeyError(error, field) {
    if (error.code === 11000) {
      const duplicateValue = error.keyValue?.[field];
      return `${field} '${duplicateValue}' is already in use. Please use a different ${field}.`;
    }
    return error.message;
  }

  /**
   * Validate and sanitize input parameters
   * @param {Object} params - Parameters to validate
   * @param {Array} requiredFields - Required field names
   * @returns {Object} Sanitized parameters
   */
  static validateInput(params, requiredFields = []) {
    const sanitized = {};

    for (const field of requiredFields) {
      if (!params[field]) {
        throw new Error(`${field} is required`);
      }
      if (typeof params[field] === "string") {
        sanitized[field] = params[field].trim();
      } else {
        sanitized[field] = params[field];
      }
    }

    return sanitized;
  }

  /**
   * Clear plan cache (useful when plans are updated)
   * @param {string} planName - Optional specific plan name to clear
   */
  static clearPlanCache(planName = null) {
    if (planName) {
      const cacheKey = `plan_${planName.trim().toLowerCase()}`;
      planCache.delete(cacheKey);
    } else {
      planCache.clear();
    }
  }

  /**
   * Normalize entity ID to string (handles both string and ObjectId)
   * @param {string|ObjectId} entityId - Entity ID
   * @returns {string} Normalized entity ID string
   */
  static normalizeEntityId(entityId) {
    if (!entityId) {
      throw new Error("Entity ID is required");
    }
    return entityId.toString();
  }

  /**
   * Batch update usage for multiple entities (optimized for bulk operations)
   * @param {Array} updates - Array of {entityId, type, increment} objects
   * @returns {Promise<Object>} Results of batch update
   */
  static async batchUpdateUsage(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("Updates array is required and must not be empty");
    }

    const validTypes = ["invoice", "customer", "teamMember"];
    const bulkOps = [];
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const update of updates) {
      try {
        results.processed++;

        if (
          !update.entityId ||
          !update.type ||
          typeof update.increment !== "number"
        ) {
          throw new Error(
            "Invalid update object: entityId, type, and increment are required"
          );
        }

        if (!validTypes.includes(update.type)) {
          throw new Error(`Invalid usage type: ${update.type}`);
        }

        const updateField = {};
        switch (update.type) {
          case "invoice":
            updateField.invoicesCreated = update.increment;
            break;
          case "customer":
            updateField.customersCreated = update.increment;
            break;
          case "teamMember":
            updateField.teamMembersCount = update.increment;
            break;
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: update.entityId },
            update: { $inc: updateField },
          },
        });

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          entityId: update.entityId,
          error: error.message,
        });
      }
    }

    if (bulkOps.length > 0) {
      try {
        await Entity.bulkWrite(bulkOps);
      } catch (error) {
        throw new Error(`Batch update failed: ${error.message}`);
      }
    }

    return results;
  }
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
   * Get plan by name with caching
   * @param {string} planName - Plan name
   * @returns {Promise<Object>} Plan details
   */
  static async getPlanByName(planName) {
    if (!planName || typeof planName !== "string") {
      throw new Error("Plan name is required and must be a string");
    }

    const normalizedPlanName = planName.trim().toLowerCase();
    const cacheKey = `plan_${normalizedPlanName}`;

    // Check cache first
    const cached = planCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const plan = await SubscriptionPlan.findOne({
      name: normalizedPlanName,
      isActive: true,
    });

    abortIf(
      !plan,
      httpStatus.NOT_FOUND,
      `Subscription plan '${planName}' not found`
    );

    // Cache the result
    planCache.set(cacheKey, {
      data: plan,
      timestamp: Date.now(),
    });

    return plan;
  }

  /**
   * Get entity's current subscription
   * @param {string|ObjectId} entityId - Entity ID
   * @returns {Promise<Object>} Entity with subscription details
   */
  static async getEntitySubscription(entityId) {
    const entityIdStr = this.normalizeEntityId(entityId);

    const entity = await Entity.findById(entityIdStr)
      .populate("subscriptionPlan")
      .select(
        "subscriptionPlan subscriptionStatus subscriptionExpiry subscriptionStartDate invoicesCreated customersCreated teamMembersCount"
      );

    abortIf(!entity, httpStatus.NOT_FOUND, "Entity not found");

    // If no subscription plan is set, get the free plan (cached)
    let plan;
    if (!entity.subscriptionPlan) {
      plan = await this.getPlanByName(FREE_PLAN_NAME);
    } else {
      plan = entity.subscriptionPlan;
    }

    return {
      entity,
      plan,
      usage: {
        invoicesCreated: entity.invoicesCreated || 0,
        customersCreated: entity.customersCreated || 0,
        teamMembersCount: entity.teamMembersCount || 1,
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
   * @param {string|ObjectId} entityId - Entity ID
   * @param {string} type - Type of usage (invoice, customer, teamMember)
   * @param {number} increment - Amount to increment
   * @returns {Promise<Object>} Updated entity
   */
  static async updateUsage(entityId, type, increment = 1) {
    const entityIdStr = this.normalizeEntityId(entityId);

    if (!type || typeof type !== "string") {
      throw new Error("Usage type is required and must be a string");
    }

    if (typeof increment !== "number" || increment < 0) {
      throw new Error("Increment must be a non-negative number");
    }

    const validTypes = ["invoice", "customer", "teamMember"];
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid usage type. Must be one of: ${validTypes.join(", ")}`
      );
    }

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
    }

    const entity = await Entity.findByIdAndUpdate(
      entityIdStr,
      { $inc: updateField },
      { new: true }
    );

    if (!entity) {
      throw new Error("Entity not found");
    }

    return entity;
  }

  /**
   * Upgrade entity subscription
   * @param {string|ObjectId} entityId - Entity ID
   * @param {string} newPlan - New plan name
   * @returns {Promise<Object>} Updated entity
   */
  static async upgradeSubscription(entityId, newPlan) {
    const entityIdStr = this.normalizeEntityId(entityId);

    if (!newPlan || typeof newPlan !== "string") {
      throw new Error("Plan name is required and must be a string");
    }

    const plan = await this.getPlanByName(newPlan);

    const updateData = {
      subscriptionPlan: plan._id,
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionExpiry: new Date(
        Date.now() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000
      ),
    };

    const entity = await Entity.findByIdAndUpdate(entityIdStr, updateData, {
      new: true,
    });

    if (!entity) {
      throw new Error("Entity not found");
    }

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
      // Validate input parameters
      const entityIdStr = this.normalizeEntityId(entityId);

      const validated = this.validateInput(
        { entityId: entityIdStr, newPlan, email },
        ["entityId", "newPlan", "email"]
      );

      const plan = await this.getPlanByName(validated.newPlan);

      // Check if plan is free
      if (plan.price === 0) {
        // Free plan - upgrade immediately
        const updatedEntity = await this.upgradeSubscription(
          validated.entityId,
          validated.newPlan
        );
        return {
          success: true,
          isFree: true,
          message: "Subscription upgraded to free plan successfully",
          subscription: validated.newPlan,
          status: updatedEntity.subscriptionStatus,
          amount: 0,
          currency: plan.currency,
        };
      }

      // Paid plan - charge the card
      const chargeResult = await CardService.chargeCard(
        validated.entityId,
        plan.price,
        validated.email,
        `Subscription upgrade to ${plan.displayName} plan`,
        cardId
      );

      if (chargeResult.success) {
        // Payment successful - upgrade subscription
        const updatedEntity = await this.upgradeSubscription(
          validated.entityId,
          validated.newPlan
        );

        return {
          success: true,
          isFree: false,
          message: "Subscription upgraded successfully",
          subscription: validated.newPlan,
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
          message: `Payment failed: ${chargeResult.message}`,
          payment: chargeResult,
        };
      }
    } catch (error) {
      // Handle specific error types
      if (error.code === 11000) {
        return {
          success: false,
          message: this.handleDuplicateKeyError(error, "phone"),
        };
      }

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
    // Validate input parameters
    const entityIdStr = this.normalizeEntityId(entityId);

    const validated = this.validateInput({ entityId: entityIdStr, newPlan }, [
      "entityId",
      "newPlan",
    ]);

    const plan = await this.getPlanByName(validated.newPlan);

    // Check if current usage exceeds new plan limits
    const currentUsage = await this.getEntitySubscription(validated.entityId);

    if (
      plan.maxInvoices !== -1 &&
      currentUsage.usage.invoicesCreated > plan.maxInvoices
    ) {
      abortIf(
        true,
        httpStatus.BAD_REQUEST,
        `Cannot downgrade: current invoice count (${currentUsage.usage.invoicesCreated}) exceeds new plan limit (${plan.maxInvoices})`
      );
    }

    if (
      plan.maxCustomers !== -1 &&
      currentUsage.usage.customersCreated > plan.maxCustomers
    ) {
      abortIf(
        true,
        httpStatus.BAD_REQUEST,
        `Cannot downgrade: current customer count (${currentUsage.usage.customersCreated}) exceeds new plan limit (${plan.maxCustomers})`
      );
    }

    const updateData = {
      subscriptionPlan: plan._id,
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionExpiry: new Date(
        Date.now() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000
      ),
    };

    const entity = await Entity.findByIdAndUpdate(
      validated.entityId,
      updateData,
      {
        new: true,
      }
    );

    if (!entity) {
      throw new Error("Entity not found");
    }

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
   * @param {string|ObjectId} entityId - Entity ID
   * @returns {Promise<Object>} Updated entity
   */
  static async initializeEntitySubscription(entityId) {
    const entityIdStr = this.normalizeEntityId(entityId);

    const entity = await Entity.findById(entityIdStr);

    if (!entity) {
      throw new Error("Entity not found");
    }

    // If entity already has a subscription plan, don't change it
    if (entity.subscriptionPlan) {
      return entity;
    }

    try {
      // Get free plan
      const freePlan = await this.getPlanByName(FREE_PLAN_NAME);

      // Assign free plan to entity
      const updateData = {
        subscriptionPlan: freePlan._id,
        subscriptionStatus: "active",
        subscriptionStartDate: new Date(),
      };

      const updatedEntity = await Entity.findByIdAndUpdate(
        entityIdStr,
        updateData,
        {
          new: true,
        }
      );

      if (!updatedEntity) {
        throw new Error("Failed to update entity subscription");
      }

      return updatedEntity;
    } catch (error) {
      // Handle duplicate key errors specifically
      if (error.code === 11000) {
        throw new Error(this.handleDuplicateKeyError(error, "phone"));
      }
      throw error;
    }
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

  /**
   * Renew subscription for an entity
   * @param {string} entityId - Entity ID
   * @param {string} email - Entity email
   * @param {string} cardId - Optional card ID (uses default if not provided)
   * @returns {Promise<Object>} Renewal result
   */
  static async renewSubscription(entityId, email, cardId = null) {
    try {
      // Get current entity subscription
      const entity = await Entity.findById(entityId);
      if (!entity) {
        return {
          success: false,
          message: "Entity not found",
        };
      }

      // Get current subscription plan
      const currentPlan = await SubscriptionPlan.findById(
        entity.subscriptionPlan
      );
      if (!currentPlan) {
        return {
          success: false,
          message: "Current subscription plan not found",
        };
      }

      // Check if subscription is active and not expired
      if (
        entity.subscriptionStatus === "active" &&
        entity.subscriptionExpiry &&
        entity.subscriptionExpiry > new Date()
      ) {
        return {
          success: false,
          message: "Subscription is still active and not expired",
        };
      }

      // Check if plan is free
      if (currentPlan.price === 0) {
        // Free plan - just update dates
        const updatedEntity = await this.upgradeSubscription(
          entityId,
          currentPlan.name
        );
        return {
          success: true,
          isFree: true,
          message: "Free subscription renewed successfully",
          subscription: currentPlan.name,
          status: updatedEntity.subscriptionStatus,
          payment: {
            success: true,
            amount: 0,
            currency: currentPlan.currency,
          },
        };
      }

      // Paid plan - charge the card for renewal
      const chargeResult = await CardService.chargeCard(
        entityId,
        currentPlan.price,
        email,
        `Subscription renewal for ${currentPlan.displayName} plan`,
        cardId
      );

      if (chargeResult.success) {
        // Payment successful - renew subscription
        const updatedEntity = await this.upgradeSubscription(
          entityId,
          currentPlan.name
        );

        return {
          success: true,
          isFree: false,
          message: "Subscription renewed successfully",
          subscription: currentPlan.name,
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
   * Get subscriptions that need renewal (for cron jobs)
   * @param {number} daysAhead - Days ahead to check (default: 7)
   * @returns {Promise<Array>} Array of entities needing renewal
   */
  static async getSubscriptionsNeedingRenewal(daysAhead = RENEWAL_CHECK_DAYS) {
    try {
      if (typeof daysAhead !== "number" || daysAhead < 0) {
        throw new Error("Days ahead must be a non-negative number");
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const entities = await Entity.find({
        subscriptionStatus: "active",
        subscriptionExpiry: {
          $lte: cutoffDate,
          $gt: new Date(), // Not expired yet
        },
      }).populate("subscriptionPlan");

      return entities.map((entity) => ({
        entityId: entity._id,
        email: entity.email,
        currentPlan: entity.subscriptionPlan?.name || "unknown",
        currentPlanPrice: entity.subscriptionPlan?.price || 0,
        expiryDate: entity.subscriptionExpiry,
        daysUntilExpiry: Math.ceil(
          (entity.subscriptionExpiry - new Date()) / (1000 * 60 * 60 * 24)
        ),
      }));
    } catch (error) {
      throw new Error(
        `Error getting subscriptions needing renewal: ${error.message}`
      );
    }
  }

  /**
   * Process automatic subscription renewals (for cron jobs)
   * @param {number} daysAhead - Days ahead to process (default: 7)
   * @returns {Promise<Object>} Processing results
   */
  static async processAutomaticRenewals(daysAhead = RENEWAL_CHECK_DAYS) {
    try {
      if (typeof daysAhead !== "number" || daysAhead < 0) {
        throw new Error("Days ahead must be a non-negative number");
      }

      const entitiesNeedingRenewal = await this.getSubscriptionsNeedingRenewal(
        daysAhead
      );

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        summary: {
          totalEntities: entitiesNeedingRenewal.length,
          startTime: new Date(),
        },
      };

      for (const entity of entitiesNeedingRenewal) {
        try {
          results.processed++;

          // Try to renew using default card
          const renewalResult = await this.renewSubscription(
            entity.entityId,
            entity.email
          );

          if (renewalResult.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              entityId: entity.entityId,
              email: entity.email,
              error: renewalResult.message,
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            entityId: entity.entityId,
            email: entity.email,
            error: error.message,
          });
        }
      }

      results.summary.endTime = new Date();
      results.summary.duration =
        results.summary.endTime - results.summary.startTime;

      return results;
    } catch (error) {
      throw new Error(`Error processing automatic renewals: ${error.message}`);
    }
  }
}

module.exports = SubscriptionService;
