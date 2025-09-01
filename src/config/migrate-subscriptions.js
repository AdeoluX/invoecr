const mongoose = require("mongoose");
const Entity = require("../models/entity.model");
const SubscriptionPlan = require("../models/subscription.model");

const migrateSubscriptions = async () => {
  try {
    console.log("🔄 Starting subscription migration...");

    // Get free plan
    const freePlan = await SubscriptionPlan.findOne({ name: "free" });
    if (!freePlan) {
      console.log(
        "❌ Free plan not found. Please run subscription seeding first."
      );
      return;
    }

    // Find entities without subscription plans
    const entitiesWithoutPlan = await Entity.find({
      $or: [
        { subscriptionPlan: { $exists: false } },
        { subscriptionPlan: null },
      ],
    });

    console.log(
      `📊 Found ${entitiesWithoutPlan.length} entities without subscription plans`
    );

    if (entitiesWithoutPlan.length === 0) {
      console.log("✅ All entities already have subscription plans");
      return;
    }

    // Update entities with free plan
    const updatePromises = entitiesWithoutPlan.map((entity) =>
      Entity.findByIdAndUpdate(entity._id, {
        subscriptionPlan: freePlan._id,
        subscriptionStatus: "active",
        subscriptionStartDate: new Date(),
        invoicesCreated: 0,
        customersCreated: 0,
        teamMembersCount: 1,
      })
    );

    await Promise.all(updatePromises);

    console.log(
      `✅ Successfully migrated ${entitiesWithoutPlan.length} entities to free plan`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

module.exports = { migrateSubscriptions };
