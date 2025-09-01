const SubscriptionPlan = require("../models/subscription.model");

const subscriptionPlans = [
  {
    name: "free",
    displayName: "Freemium",
    price: 0,
    currency: "NGN",
    billingCycle: "monthly",
    maxInvoices: 10,
    maxCustomers: 5,
    maxTeamMembers: 1,
    features: {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: false,
      analytics: false,
      recurringInvoices: false,
      taxReports: false,
      whiteLabel: false,
      apiAccess: false,
    },
    nigerianVAT: true,
    multiCurrency: false,
    businessTypes: true,
    isActive: true,
    isPopular: false,
    description:
      "Perfect for small businesses and freelancers just getting started",
    benefits: [
      "Up to 10 invoices per month",
      "Up to 5 customers",
      "WhatsApp sharing",
      "PDF export",
      "Nigerian VAT support",
      "Basic business types",
    ],
  },
  {
    name: "basic",
    displayName: "Basic",
    price: 2000,
    currency: "NGN",
    billingCycle: "monthly",
    maxInvoices: -1, // Unlimited
    maxCustomers: -1, // Unlimited
    maxTeamMembers: 2,
    features: {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: true,
      analytics: true,
      recurringInvoices: false,
      taxReports: false,
      whiteLabel: false,
      apiAccess: false,
    },
    nigerianVAT: true,
    multiCurrency: false,
    businessTypes: true,
    isActive: true,
    isPopular: true,
    description: "Ideal for growing businesses that need more features",
    benefits: [
      "Unlimited invoices",
      "Unlimited customers",
      "Online payments (Paystack)",
      "Basic analytics",
      "WhatsApp sharing",
      "PDF export",
      "Nigerian VAT support",
      "Up to 2 team members",
    ],
  },
  {
    name: "premium",
    displayName: "Premium",
    price: 3500,
    currency: "NGN",
    billingCycle: "monthly",
    maxInvoices: -1, // Unlimited
    maxCustomers: -1, // Unlimited
    maxTeamMembers: 5,
    features: {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: true,
      analytics: true,
      recurringInvoices: true,
      taxReports: true,
      whiteLabel: false,
      apiAccess: false,
    },
    nigerianVAT: true,
    multiCurrency: true,
    businessTypes: true,
    isActive: true,
    isPopular: false,
    description: "Advanced features for established businesses",
    benefits: [
      "Unlimited invoices",
      "Unlimited customers",
      "Online payments (Paystack)",
      "Advanced analytics",
      "Recurring invoices",
      "Tax reports",
      "Multi-currency support",
      "WhatsApp sharing",
      "PDF export",
      "Nigerian VAT support",
      "Up to 5 team members",
    ],
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    price: 5000,
    currency: "NGN",
    billingCycle: "monthly",
    maxInvoices: -1, // Unlimited
    maxCustomers: -1, // Unlimited
    maxTeamMembers: -1, // Unlimited
    features: {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: true,
      analytics: true,
      recurringInvoices: true,
      taxReports: true,
      whiteLabel: true,
      apiAccess: true,
    },
    nigerianVAT: true,
    multiCurrency: true,
    businessTypes: true,
    isActive: true,
    isPopular: false,
    description: "Full-featured solution for large organizations",
    benefits: [
      "Unlimited invoices",
      "Unlimited customers",
      "Unlimited team members",
      "Online payments (Paystack)",
      "Advanced analytics",
      "Recurring invoices",
      "Tax reports",
      "Multi-currency support",
      "White-label solution",
      "API access",
      "WhatsApp sharing",
      "PDF export",
      "Nigerian VAT support",
      "Priority support",
    ],
  },
];

const seedSubscriptionPlans = async () => {
  try {
    // Clear existing plans
    await SubscriptionPlan.deleteMany({});

    // Insert new plans
    const createdPlans = await SubscriptionPlan.insertMany(subscriptionPlans);

    console.log("✅ Subscription plans seeded successfully");
    console.log(`Created ${createdPlans.length} plans:`);

    createdPlans.forEach((plan) => {
      console.log(
        `- ${plan.displayName}: ₦${plan.price.toLocaleString()}/${
          plan.billingCycle
        }`
      );
    });

    return createdPlans;
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
};

module.exports = { seedSubscriptionPlans };
