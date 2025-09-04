const express = require("express");
const router = express.Router();
const {
  SubscriptionController,
} = require("../controller/subscription.controller");
const Authorization = require("../utils/authorization.service");

const BASE = "/subscription";

// Public routes (no authentication required)
router.get(`${BASE}/plans`, SubscriptionController.getAvailablePlans);
router.get(
  `${BASE}/comparison`,
  SubscriptionController.getSubscriptionComparison
);

// Protected routes (authentication required)
router.get(
  `${BASE}/current`,
  Authorization.authenticateToken,
  SubscriptionController.getEntitySubscription
);
router.post(
  `${BASE}/upgrade`,
  Authorization.authenticateToken,
  SubscriptionController.upgradeSubscription
);
router.post(
  `${BASE}/downgrade`,
  Authorization.authenticateToken,
  SubscriptionController.downgradeSubscription
);
router.get(
  `${BASE}/limits`,
  Authorization.authenticateToken,
  SubscriptionController.checkLimits
);
router.get(
  `${BASE}/feature/:feature`,
  Authorization.authenticateToken,
  SubscriptionController.getFeatureAccess
);

// Check payment readiness for subscription upgrade
router.get(
  `${BASE}/payment-readiness`,
  Authorization.authenticateToken,
  SubscriptionController.checkPaymentReadiness
);

// Subscription renewal routes
router.post(
  `${BASE}/renew`,
  Authorization.authenticateToken,
  SubscriptionController.renewSubscription
);

// Admin/cron job routes (for monitoring and processing renewals)
router.get(
  `${BASE}/renewal-status`,
  Authorization.authenticateToken,
  SubscriptionController.getSubscriptionsNeedingRenewal
);

router.post(
  `${BASE}/process-renewals`,
  Authorization.authenticateToken,
  SubscriptionController.processAutomaticRenewals
);

module.exports = router;
