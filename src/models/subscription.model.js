const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriptionPlanSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      required: true,
      default: "free",
    },
    displayName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      enum: ["NGN", "USD"],
      default: "NGN",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    // Feature limits
    maxInvoices: {
      type: Number,
      required: true,
      default: 10,
    },
    maxCustomers: {
      type: Number,
      required: true,
      default: 5,
    },
    maxTeamMembers: {
      type: Number,
      required: true,
      default: 1,
    },
    // Feature flags
    features: {
      whatsappSharing: { type: Boolean, default: true },
      pdfExport: { type: Boolean, default: true },
      onlinePayments: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      recurringInvoices: { type: Boolean, default: false },
      taxReports: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
    },
    // Nigeria-specific features
    nigerianVAT: { type: Boolean, default: true },
    multiCurrency: { type: Boolean, default: false },
    businessTypes: { type: Boolean, default: true },
    // Plan status
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    description: String,
    benefits: [String],
  },
  { timestamps: true }
);

// Pre-save hook to set default values based on plan
subscriptionPlanSchema.pre("save", function (next) {
  if (this.name === "free") {
    this.maxInvoices = 10;
    this.maxCustomers = 5;
    this.maxTeamMembers = 1;
    this.features = {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: false,
      analytics: false,
      recurringInvoices: false,
      taxReports: false,
      whiteLabel: false,
      apiAccess: false,
    };
    this.price = 0;
    this.currency = "NGN";
  } else if (this.name === "basic") {
    this.maxInvoices = -1; // Unlimited
    this.maxCustomers = -1; // Unlimited
    this.maxTeamMembers = 2;
    this.features = {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: true,
      analytics: true,
      recurringInvoices: false,
      taxReports: false,
      whiteLabel: false,
      apiAccess: false,
    };
    this.price = 2000; // ₦2,000/month
    this.currency = "NGN";
  } else if (this.name === "premium") {
    this.maxInvoices = -1; // Unlimited
    this.maxCustomers = -1; // Unlimited
    this.maxTeamMembers = 5;
    this.features = {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: true,
      analytics: true,
      recurringInvoices: true,
      taxReports: true,
      whiteLabel: false,
      apiAccess: false,
    };
    this.price = 3500; // ₦3,500/month
    this.currency = "NGN";
  } else if (this.name === "enterprise") {
    this.maxInvoices = -1; // Unlimited
    this.maxCustomers = -1; // Unlimited
    this.maxTeamMembers = -1; // Unlimited
    this.features = {
      whatsappSharing: true,
      pdfExport: true,
      onlinePayments: true,
      analytics: true,
      recurringInvoices: true,
      taxReports: true,
      whiteLabel: true,
      apiAccess: true,
    };
    this.price = 5000; // ₦5,000/month
    this.currency = "NGN";
  }
  next();
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
