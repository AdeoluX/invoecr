var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var crypto = require("crypto"); // Assuming you're using Node's built-in crypto module

var entitySchema = new Schema(
  {
    code: {
      type: String, // You can also use Schema.Types.String if UUIDs are stored as strings
      default: function () {
        return "ent_" + crypto.randomUUID().split("-").join("").slice(0, 15); // Replaced arrow function with a regular function
      },
    },
    parent_id: {
      type: String,
      ref: "Entity",
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    first_name: String,
    last_name: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // helps with optional unique fields
    },
    password: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["business", "staff"],
      required: true,
    },
    // Nigeria-specific business fields
    businessType: {
      type: String,
      enum: [
        "freelancer",
        "tailor",
        "salon",
        "caterer",
        "mechanic",
        "contractor",
        "digital_marketing",
        "creative_agency",
        "it_consultant",
        "ngo",
        "church",
        "restaurant",
        "retail_shop",
        "transport",
        "healthcare",
        "education",
        "real_estate",
        "manufacturing",
        "other",
      ],
      default: "freelancer",
    },
    country: {
      type: String,
      enum: ["NG"],
      default: "NG",
    },
    state: String,
    city: String,
    vatRate: { type: Number, default: 7.5 }, // Nigerian VAT rate
    whatsappNumber: String,
    preferredPaymentGateway: {
      type: String,
      enum: ["paystack"],
      default: "paystack",
    },
    // Subscription reference
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "cancelled", "expired"],
      default: "active",
    },
    subscriptionExpiry: Date,
    subscriptionStartDate: Date,
    // Usage tracking
    invoicesCreated: { type: Number, default: 0 },
    customersCreated: { type: Number, default: 0 },
    teamMembersCount: { type: Number, default: 1 },
    logo: String,
    address: String,
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password; // Remove password field from the output
        return ret;
      },
    },
  }
);

// Virtuals
entitySchema.virtual("staff", {
  ref: "Entity",
  localField: "_id",
  foreignField: "parent_id",
});

entitySchema.virtual("roleEntities", {
  ref: "RoleEntity",
  localField: "_id",
  foreignField: "entity_id",
  justOne: true,
});

var Entity = mongoose.model("Entity", entitySchema);

module.exports = Entity;
