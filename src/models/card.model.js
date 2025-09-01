const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cardSchema = new Schema(
  {
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },
    // Paystack authorization details
    authorizationCode: {
      type: String,
      required: true,
      unique: true,
    },
    cardType: {
      type: String,
      enum: ["visa", "mastercard", "verve", "american_express"],
      required: true,
    },
    last4: {
      type: String,
      required: true,
    },
    expMonth: {
      type: String,
      required: true,
    },
    expYear: {
      type: String,
      required: true,
    },
    bank: {
      type: String,
      required: true,
    },
    countryCode: {
      type: String,
      default: "NG",
    },
    brand: {
      type: String,
      required: true,
    },
    // Card status
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Metadata
    cardName: {
      type: String,
      default: "My Card",
    },
    description: String,
  },
  { timestamps: true }
);

// Ensure only one default card per entity
cardSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { entity: this.entity, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Index for faster queries
cardSchema.index({ entity: 1, isActive: 1 });
cardSchema.index({ authorizationCode: 1 }, { unique: true });

module.exports = mongoose.model("Card", cardSchema);
