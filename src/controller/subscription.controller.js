const catchAsync = require("../utils/catchAsync");
const { SubscriptionService } = require("../services");
const { successResponse, abortIf } = require("../utils/responder");
const httpStatus = require("http-status").default;

class SubscriptionController {
  // Get all available subscription plans
  static getAvailablePlans = catchAsync(async (req, res, next) => {
    const plans = await SubscriptionService.getAvailablePlans();
    return successResponse(req, res, plans);
  });

  // Get subscription comparison for pricing page
  static getSubscriptionComparison = catchAsync(async (req, res, next) => {
    const comparison = await SubscriptionService.getSubscriptionComparison();
    return successResponse(req, res, comparison);
  });

  // Get entity's current subscription
  static getEntitySubscription = catchAsync(async (req, res, next) => {
    const user = req.user;
    const subscription = await SubscriptionService.getEntitySubscription(
      user.id
    );
    return successResponse(req, res, subscription);
  });

  // Upgrade subscription
  static upgradeSubscription = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { planName, cardId } = req.body;

    abortIf(!planName, httpStatus.BAD_REQUEST, "Plan name is required");

    // Use payment-based upgrade
    const result = await SubscriptionService.upgradeSubscriptionWithPayment(
      user.id,
      planName,
      user.email,
      cardId
    );

    if (result.success) {
      return successResponse(req, res, result);
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        payment: result.payment,
      });
    }
  });

  // Downgrade subscription
  static downgradeSubscription = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { planName } = req.body;

    abortIf(!planName, httpStatus.BAD_REQUEST, "Plan name is required");

    const updatedEntity = await SubscriptionService.downgradeSubscription(
      user.id,
      planName
    );
    return successResponse(req, res, {
      message: "Subscription downgraded successfully",
      subscription: planName,
      status: updatedEntity.subscriptionStatus,
    });
  });

  // Check subscription limits
  static checkLimits = catchAsync(async (req, res, next) => {
    const user = req.user;
    const subscription = await SubscriptionService.getEntitySubscription(
      user.id
    );

    return successResponse(req, res, {
      currentPlan: subscription.plan.name,
      planDetails: subscription.plan,
      usage: subscription.usage,
      limits: subscription.limits,
      canCreateInvoice: await SubscriptionService.canCreateInvoice(user.id),
      canCreateCustomer: await SubscriptionService.canCreateCustomer(user.id),
    });
  });

  // Get feature access
  static getFeatureAccess = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { feature } = req.params;

    abortIf(!feature, httpStatus.BAD_REQUEST, "Feature name is required");

    const canAccess = await SubscriptionService.canAccessFeature(
      user.id,
      feature
    );
    return successResponse(req, res, {
      feature,
      canAccess,
      message: canAccess
        ? "Feature accessible"
        : "Feature not available in current plan",
    });
  });

  // Check if user has saved cards for subscription upgrade
  static checkPaymentReadiness = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { planName } = req.query;

    abortIf(!planName, httpStatus.BAD_REQUEST, "Plan name is required");

    const plan = await SubscriptionService.getPlanByName(planName);
    const hasCards = await SubscriptionService.checkPaymentReadiness(user.id);

    return successResponse(req, res, {
      planName,
      planPrice: plan.price,
      planCurrency: plan.currency,
      hasSavedCards: hasCards.hasCards,
      defaultCard: hasCards.defaultCard,
      canUpgrade: hasCards.hasCards || plan.price === 0,
      message: hasCards.hasCards
        ? "Ready to upgrade with saved card"
        : plan.price === 0
        ? "Free plan - no payment required"
        : "Please save a card first to upgrade",
    });
  });

  // Renew subscription
  static renewSubscription = catchAsync(async (req, res, next) => {
    const user = req.user;
    const { cardId } = req.body; // Optional: specific card to use

    const result = await SubscriptionService.renewSubscription(
      user.id,
      user.email,
      cardId
    );

    if (result.success) {
      return successResponse(req, res, result);
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        payment: result.payment,
      });
    }
  });

  // Get subscriptions needing renewal (for admin/cron monitoring)
  static getSubscriptionsNeedingRenewal = catchAsync(async (req, res, next) => {
    const { daysAhead = 7 } = req.query;

    const entities = await SubscriptionService.getSubscriptionsNeedingRenewal(
      parseInt(daysAhead)
    );

    return successResponse(req, res, {
      message: "Subscriptions needing renewal retrieved",
      count: entities.length,
      entities,
    });
  });

  // Process automatic renewals (for admin/cron jobs)
  static processAutomaticRenewals = catchAsync(async (req, res, next) => {
    const { daysAhead = 7 } = req.query;

    const results = await SubscriptionService.processAutomaticRenewals(
      parseInt(daysAhead)
    );

    return successResponse(req, res, {
      message: "Automatic renewals processed",
      results,
    });
  });
}

module.exports = {
  SubscriptionController,
};
