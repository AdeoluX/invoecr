const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { seedSubscriptionPlans } = require("./src/config/subscription-seeds");
const dbConnect = require("./src/config/db.config");

dotenv.config();

const runSeeds = async () => {
  try {
    await dbConnect();
    console.log("Database connected");
    await seedSubscriptionPlans();
    console.log("Subscription plans seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding plans:", error);
    process.exit(1);
  }
};

runSeeds();
