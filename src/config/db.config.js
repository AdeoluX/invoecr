const mongoose = require("mongoose");
const { seedSubscriptionPlans } = require("./subscription-seeds");
const { migrateSubscriptions } = require("./migrate-subscriptions");

const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(
      `mongodb+srv://juwontayo:${process.env.MONGO_DB_PASSWORD}@cluster0.gzpfkkr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed subscription plans after successful connection
    await seedSubscriptionPlans();

    // Migrate existing entities to have subscription plans
    await migrateSubscriptions();
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};

module.exports = dbConnect;
